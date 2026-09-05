/**
 * GreenPulse - Dashboard Controller (dashboard.js)
 * 
 * Orchestrates the main dashboard screen:
 * - Station selection & state synchronization.
 * - Environmental telemetry card updates (temperature, humidity, air quality, noise, etc.).
 * - Prominent Eco-Metric Score (EMS) gauge & status badge.
 * - 24-hour EMS trend chart via ChartManager.
 * - Station quick-list with real-time status pills.
 */

(function (window) {
  'use strict';

  const DashboardController = {
    selectedLocationId: 'ward-lake', // default initial selection
    locations: [],
    
    async init() {
      if (!window.DataService) return;
      this.locations = await window.DataService.getLocations();
      
      this.renderLocationSelectorOptions();
      this.renderLocationQuickList();
      this.bindEvents();
      
      // Initialize Leaflet Map with selection callback
      if (window.MapController) {
        window.MapController.init('leaflet-map', (id) => {
          this.selectLocation(id, false); // select without cyclic map trigger
        });
        window.MapController.setLocations(this.locations, this.selectedLocationId);
      }

      // Initial render for selected location
      await this.updateDashboardView(this.selectedLocationId);
    },

    bindEvents() {
      // Dropdown location selector in topbar/dashboard header
      const locationSelect = document.getElementById('location-dropdown');
      if (locationSelect) {
        locationSelect.addEventListener('change', (e) => {
          this.selectLocation(e.target.value, true);
        });
      }

      // Map reset zoom button
      const resetMapBtn = document.getElementById('btn-reset-map');
      if (resetMapBtn && window.MapController) {
        resetMapBtn.addEventListener('click', () => {
          window.MapController.resetBounds();
        });
      }

      // Bind Topbar Refresh button
      const topbarRefreshBtn = document.getElementById('btn-topbar-refresh');
      if (topbarRefreshBtn) {
        topbarRefreshBtn.addEventListener('click', async () => {
          topbarRefreshBtn.classList.add('opacity-75');
          if (window.DataService) {
            window.DataService.simulateLivePulse();
          }
          await this.refreshCurrentLocationData();
          setTimeout(() => {
            topbarRefreshBtn.classList.remove('opacity-75');
          }, 400);
        });
      }
    },

    /**
     * Render the station select options
     */
    renderLocationSelectorOptions() {
      const select = document.getElementById('location-dropdown');
      if (!select || !this.locations) return;

      select.innerHTML = this.locations.map(loc => `
        <option value="${loc.id}" ${loc.id === this.selectedLocationId ? 'selected' : ''}>
          ${loc.name} (EMS: ${loc.current.ems})
        </option>
      `).join('');
    },

    /**
     * Render horizontal/vertical quick-select list of stations
     */
    renderLocationQuickList() {
      const container = document.getElementById('station-quick-list');
      if (!container || !this.locations) return;

      container.innerHTML = this.locations.map(loc => {
        const isSelected = loc.id === this.selectedLocationId;
        const emsScore = loc.current.ems;
        const color = window.EMSColors ? window.EMSColors.getColor(emsScore) : '#16A34A';
        const info = window.EMSColors ? window.EMSColors.getInfo(emsScore) : { range: '81-100', label: 'Optimal' };
        
        return `
          <button type="button" 
                  class="station-card-item ${isSelected ? 'is-selected' : ''}" 
                  data-location-id="${loc.id}"
                  id="station-card-${loc.id}">
            <div class="station-card-top">
              <span class="station-card-name" title="${loc.name}">${loc.name}</span>
              <span class="ems-color-chip" 
                    style="--chip-color: ${color}; --chip-bg: ${window.EMSColors ? window.EMSColors.getRgba(emsScore, 0.15) : 'rgba(0,0,0,0.05)'}; --chip-border: ${window.EMSColors ? window.EMSColors.getRgba(emsScore, 0.4) : 'transparent'};">
                <span class="ems-chip-dot" style="background-color: ${color};"></span>
                <span>${emsScore} EMS</span>
              </span>
            </div>
            <div class="station-card-meta">
              <span>${loc.current.temperature}°C</span>
              <span>•</span>
              <span>AQI ${loc.current.aqiRaw}</span>
              <span>•</span>
              <span>${loc.category.split(' ')[0]}</span>
            </div>
          </button>
        `;
      }).join('');

      // Attach click events
      container.querySelectorAll('.station-card-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const locId = btn.getAttribute('data-location-id');
          this.selectLocation(locId, true);
        });
      });
    },

    /**
     * Switch currently selected station
     */
    async selectLocation(locationId, updateMap = true) {
      if (!locationId || locationId === this.selectedLocationId) {
        if (updateMap && window.MapController) {
          window.MapController.selectLocation(locationId, false);
        }
        return;
      }

      this.selectedLocationId = locationId;

      // Update dropdown selection if present
      const select = document.getElementById('location-dropdown');
      if (select && select.value !== locationId) {
        select.value = locationId;
      }

      // Update quick list item highlights
      const items = document.querySelectorAll('.station-card-item');
      items.forEach(item => {
        const isSelected = item.getAttribute('data-location-id') === locationId;
        item.classList.toggle('is-selected', isSelected);
      });

      // Update Leaflet map
      if (updateMap && window.MapController) {
        window.MapController.selectLocation(locationId, false);
      }

      // Update telemetry display
      await this.updateDashboardView(locationId);
    },

    /**
     * Update all DOM elements reflecting the selected station
     */
    async updateDashboardView(locationId) {
      const loc = await window.DataService.getLocationById(locationId);
      if (!loc) return;

      // Update Station Header info
      this._setElementText('selected-station-name', loc.name);
      this._setElementText('selected-station-code', loc.code);
      this._setElementText('selected-station-elevation', loc.elevation);
      this._setElementText('selected-station-category', loc.category);
      this._setElementText('selected-station-desc', loc.description);
      this._setElementText('selected-station-coords', `${loc.coordinates[0].toFixed(4)}° N, ${loc.coordinates[1].toFixed(4)}° E`);

      // Update Topbar Title and Breadcrumb District
      const topbarDistrict = document.getElementById('topbar-district');
      if (topbarDistrict) {
        topbarDistrict.textContent = loc.district || 'East Khasi Hills';
      }
      const topbarTitle = document.getElementById('topbar-view-title');
      if (topbarTitle && window.NavigationManager && window.NavigationManager.currentView === 'dashboard') {
        topbarTitle.textContent = `${loc.district || 'Meghalaya'}: ${loc.name}`;
      }

      // Update Map Header Badges
      const mapAqi = document.getElementById('map-header-aqi');
      if (mapAqi) {
        const aqiLabel = loc.current.airQuality >= 80 ? 'AQI: Optimal' : loc.current.airQuality >= 65 ? 'AQI: Moderate' : 'AQI: Advisory';
        mapAqi.textContent = aqiLabel;
      }
      const mapTemp = document.getElementById('map-header-temp');
      if (mapTemp) {
        mapTemp.textContent = `Temp: ${loc.current.temperature}°C`;
      }

      // Update Primary Eco-Metric Score (EMS) using exact user color scale
      const emsScore = loc.current.ems;
      const emsColor = window.EMSColors ? window.EMSColors.getColor(emsScore) : '#16A34A';
      const emsMeta = window.EMSColors ? window.EMSColors.getInfo(emsScore) : { label: 'Optimal', description: '' };

      this._setElementText('ems-score-value', emsScore);
      const emsScoreEl = document.getElementById('ems-score-value');
      if (emsScoreEl) {
        emsScoreEl.style.color = emsColor;
      }

      // Update Status Badge with exact color
      const statusBadge = document.getElementById('selected-station-status-badge');
      if (statusBadge) {
        statusBadge.textContent = `${emsMeta.label} (${emsMeta.range})`;
        statusBadge.style.color = emsColor;
        statusBadge.style.backgroundColor = window.EMSColors ? window.EMSColors.getRgba(emsScore, 0.12) : 'rgba(0,0,0,0.05)';
        statusBadge.style.borderColor = window.EMSColors ? window.EMSColors.getRgba(emsScore, 0.35) : 'transparent';
      }

      const emsRing = document.getElementById('ems-gauge-circle');
      if (emsRing) {
        // Circumference is 2 * PI * 42 ~= 264
        const strokeDashoffset = 264 - (264 * emsScore) / 100;
        emsRing.style.strokeDashoffset = strokeDashoffset;
        emsRing.style.stroke = emsColor;
      }

      // Update EMS Progress Fill & Descriptions
      const emsProgressFill = document.getElementById('ems-progress-fill');
      if (emsProgressFill) {
        emsProgressFill.style.width = `${Math.min(100, Math.max(0, emsScore))}%`;
        emsProgressFill.style.backgroundColor = emsColor;
      }
      const emsTitle = document.getElementById('ems-banner-title');
      const emsDesc = document.getElementById('ems-banner-desc');
      if (emsTitle && emsDesc) {
        emsTitle.textContent = emsMeta.label;
        emsDesc.textContent = emsMeta.description;
      }

      // Update Sensor Grid Values
      this._setElementText('val-temp', `${loc.current.temperature}°C`);
      this._setElementText('val-humidity', `${loc.current.humidity}%`);
      this._setElementText('val-airquality', `${loc.current.airQuality} / 100`);
      this._setElementText('val-aqi-sub', `AQI ${loc.current.aqiRaw} • PM2.5 ${loc.current.pm25} µg/m³`);
      this._setElementText('val-soil', `${loc.current.soilMoisture} / 100`);
      this._setElementText('val-noise', `${loc.current.noiseLevel} dB`);
      this._setElementText('val-light', `${loc.current.lightIntensity} / 100`);
      this._setElementText('val-crowd', `${loc.current.crowdIndex} / 100`);
      this._setElementText('val-co2', `${loc.current.co2} ppm`);

      // Update Insights list
      const insightsList = document.getElementById('selected-station-insights');
      if (insightsList && loc.insights) {
        insightsList.innerHTML = loc.insights.map(item => `
          <li class="insight-bullet">
            <span class="bullet-dot"></span>
            <span>${item}</span>
          </li>
        `).join('');
      }

      // Fetch Live Open-Meteo Historical Weather and AQI Telemetry
      if (window.OpenMeteoService) {
        const coords = loc.coordinates || [52.52, 13.41];
        const openMeteoData = await window.OpenMeteoService.fetchHistoricalData(coords[0], coords[1]);

        if (openMeteoData?.current) {
          this._setElementText('val-rainfall-current', `${openMeteoData.current.rainfallMm} mm/h`);
          this._setElementText('val-precip-prob', `${openMeteoData.current.precipitationProbability}%`);
          this._setElementText('val-accum-rain', `${openMeteoData.current.totalRainfall48h} mm (48h)`);
          this._setElementText('val-openmeteo-pm25', `${openMeteoData.current.pm25} µg/m³`);
          this._setElementText('val-openmeteo-pm10', `${openMeteoData.current.pm10} µg/m³`);
          this._setElementText('val-openmeteo-no2', `${openMeteoData.current.no2} µg/m³`);
          this._setElementText('val-openmeteo-co2', `${openMeteoData.current.co2} ppm`);
        }

        // Render Open-Meteo Historical Charts
        if (window.ChartManager) {
          window.ChartManager.renderHistoricalWeatherChart('chart-historical-weather', openMeteoData.historicalWeather);
          window.ChartManager.renderHistoricalAQIChart('chart-historical-aqi', openMeteoData.historicalAirQuality);
        }

        // Trigger ML Model Prediction re-calibration with this station's baseline
        if (window.MLController) {
          window.MLController.runInference();
        }
      }

      // Update 24h EMS Line Chart
      if (window.ChartManager) {
        const history = await window.DataService.getEMSHistory(locationId, '24h');
        window.ChartManager.renderEMSTrend('chart-ems-trend', history.labels, history.values, loc.name);
      }
    },

    /**
     * Refresh data without resetting map bounds (used for live ticks)
     */
    async refreshCurrentLocationData() {
      if (!this.selectedLocationId) return;
      await this.updateDashboardView(this.selectedLocationId);
      this.renderLocationQuickList();
      if (window.MapController && this.locations) {
        window.MapController.setLocations(this.locations, this.selectedLocationId);
      }
    },

    _setElementText(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    }
  };

  window.DashboardController = DashboardController;
})(window);
