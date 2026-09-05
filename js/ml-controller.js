/**
 * GreenPulse - ML Predictive Controller (ml-controller.js)
 * 
 * Manages the dedicated "ML Predictive Horizon" section:
 * - Next 1hr, 2hr, 3hr, 4hr, 5hr predictions strictly covering PM2.5 and PM10.
 * - Historical data sourced from Open-Meteo APIs.
 * - Future data sourced from our backend ML Model.
 * - Interactive What-If Simulation (rainfall scavenging, traffic density, wind dispersion).
 * - Exact EMS Color Coding for predicted environmental indices.
 */

(function (window) {
  'use strict';

  const MLController = {
    currentPredictions: null,
    historicalAQI: null,
    activeHorizonHours: null, // null means all horizons
    activeMetricMode: 'both', // 'both' | 'pm25' | 'pm10'
    selectedStationId: 'byrnihat-ind',
    simulationParams: {
      rainSimulationMm: 0,
      trafficFactor: 1.0,
      windDispersion: 1.0
    },

    async init() {
      await this.populateStationSelector();
      this.bindEvents();
      await this.runInference();
    },

    async populateStationSelector() {
      const select = document.getElementById('ml-station-select');
      if (!select) return;

      let locations = [];
      if (window.environmentalData && Array.isArray(window.environmentalData.locations)) {
        locations = window.environmentalData.locations;
      } else if (window.DataService && typeof window.DataService.getLocationsSync === 'function') {
        locations = window.DataService.getLocationsSync();
      } else if (window.DataService && typeof window.DataService.getLocations === 'function') {
        locations = await window.DataService.getLocations();
      }

      if (!Array.isArray(locations) || locations.length === 0) return;

      select.innerHTML = locations.map(loc => {
        const ems = loc.current ? loc.current.ems : 50;
        return `<option value="${loc.id}">${loc.name} (${loc.type}) — EMS: ${ems}</option>`;
      }).join('');

      if (!locations.some(l => l.id === this.selectedStationId)) {
        this.selectedStationId = locations[0].id;
      }
      select.value = this.selectedStationId;

      select.addEventListener('change', async (e) => {
        this.selectedStationId = e.target.value;
        await this.runInference();
      });
    },

    onViewActivated() {
      // Synchronize station dropdown if dashboard selection changed
      const currentStation = (window.DataService && typeof window.DataService.getCurrentLocation === 'function')
        ? window.DataService.getCurrentLocation()
        : (window.DashboardController && window.environmentalData?.locations
          ? window.environmentalData.locations.find(l => l.id === window.DashboardController.selectedLocationId)
          : null);

      if (currentStation && currentStation.id !== this.selectedStationId) {
        this.selectedStationId = currentStation.id;
        const select = document.getElementById('ml-station-select');
        if (select) select.value = currentStation.id;
        this.runInference();
        return;
      }

      // Invalidate chart sizing and re-render to fit container cleanly
      if (this.currentPredictions) {
        setTimeout(() => {
          this.renderTransitionChart();
        }, 80);
      } else {
        this.runInference();
      }
    },

    bindEvents() {
      // Metric filter buttons
      const btnBoth = document.getElementById('btn-ml-filter-both');
      const btnPm25 = document.getElementById('btn-ml-filter-pm25');
      const btnPm10 = document.getElementById('btn-ml-filter-pm10');

      if (btnBoth) {
        btnBoth.addEventListener('click', () => this.setMetricMode('both'));
      }
      if (btnPm25) {
        btnPm25.addEventListener('click', () => this.setMetricMode('pm25'));
      }
      if (btnPm10) {
        btnPm10.addEventListener('click', () => this.setMetricMode('pm10'));
      }

      // Simulation range inputs
      const rainSlider = document.getElementById('sim-rain-slider');
      const rainVal = document.getElementById('sim-rain-val');
      if (rainSlider && rainVal) {
        rainSlider.addEventListener('input', (e) => {
          this.simulationParams.rainSimulationMm = parseFloat(e.target.value);
          rainVal.textContent = `+${e.target.value} mm/h`;
        });
      }

      const trafficSelect = document.getElementById('sim-traffic-select');
      if (trafficSelect) {
        trafficSelect.addEventListener('change', (e) => {
          this.simulationParams.trafficFactor = parseFloat(e.target.value);
        });
      }

      const windSlider = document.getElementById('sim-wind-slider');
      const windVal = document.getElementById('sim-wind-val');
      if (windSlider && windVal) {
        windSlider.addEventListener('input', (e) => {
          this.simulationParams.windDispersion = parseFloat(e.target.value);
          windVal.textContent = `${e.target.value}x factor`;
        });
      }

      // Re-run simulation button
      const rerunBtn = document.getElementById('btn-rerun-ml-sim');
      if (rerunBtn) {
        rerunBtn.addEventListener('click', async () => {
          rerunBtn.disabled = true;
          const originalText = rerunBtn.innerHTML;
          rerunBtn.innerHTML = `
            <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span>Inferencing...</span>
          `;
          await this.runInference();
          setTimeout(() => {
            rerunBtn.disabled = false;
            rerunBtn.innerHTML = originalText;
          }, 300);
        });
      }

      // Reset simulation button
      const resetBtn = document.getElementById('btn-reset-ml-sim');
      if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
          this.simulationParams = { rainSimulationMm: 0, trafficFactor: 1.0, windDispersion: 1.0 };
          if (rainSlider) rainSlider.value = 0;
          if (rainVal) rainVal.textContent = '+0 mm/h';
          if (trafficSelect) trafficSelect.value = '1.0';
          if (windSlider) windSlider.value = 1.0;
          if (windVal) windVal.textContent = '1.0x factor';
          await this.runInference();
        });
      }
    },

    setMetricMode(mode) {
      this.activeMetricMode = mode;
      ['btn-ml-filter-both', 'btn-ml-filter-pm25', 'btn-ml-filter-pm10'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('btn-glass-primary', 'is-active');
      });

      const activeBtnId = mode === 'both' ? 'btn-ml-filter-both' : mode === 'pm25' ? 'btn-ml-filter-pm25' : 'btn-ml-filter-pm10';
      const activeBtn = document.getElementById(activeBtnId);
      if (activeBtn) activeBtn.classList.add('btn-glass-primary', 'is-active');

      this.renderTransitionChart();
    },

    /**
     * Run inference by pulling historical Open-Meteo baseline and calling Backend ML Service
     */
    async runInference() {
      // 1. Fetch latest historical baseline from OpenMeteoService if not loaded
      let openMeteoData = null;
      if (window.OpenMeteoService) {
        openMeteoData = await window.OpenMeteoService.fetchHistoricalData();
        this.historicalAQI = openMeteoData.historicalAirQuality;
      }

      // Check selected station for station-specific baseline
      let stationName = 'Regional Monitoring Station';
      let baselinePm25 = openMeteoData?.current?.pm25 ?? 14.2;
      let baselinePm10 = openMeteoData?.current?.pm10 ?? 26.5;

      if (this.selectedStationId) {
        let loc = null;
        if (window.DataService && typeof window.DataService.getLocation === 'function') {
          loc = window.DataService.getLocation(this.selectedStationId);
        } else if (window.DataService && typeof window.DataService.getLocationById === 'function') {
          loc = await window.DataService.getLocationById(this.selectedStationId);
        } else if (window.environmentalData?.locations) {
          loc = window.environmentalData.locations.find(l => l.id === this.selectedStationId);
        }

        if (loc && loc.current) {
          stationName = loc.name;
          if (typeof loc.current.pm25 === 'number') baselinePm25 = loc.current.pm25;
          if (typeof loc.current.pm10 === 'number') baselinePm10 = loc.current.pm10;
        }
      }

      const recentPrecip = openMeteoData?.current?.precipitationMm ?? 0;

      // 2. Call backend ML prediction service
      if (window.MLService) {
        this.currentPredictions = await window.MLService.fetchPredictions({
          baselinePm25,
          baselinePm10,
          recentPrecipitation: recentPrecip,
          trafficFactor: this.simulationParams.trafficFactor,
          rainSimulationMm: this.simulationParams.rainSimulationMm,
          windDispersion: this.simulationParams.windDispersion,
          stationId: this.selectedStationId,
          stationName
        });
      }

      // 3. Render UI components
      this.renderHorizonCards();
      this.renderTransitionChart();
      this.updateDiagnosticsUI();
    },

    /**
     * Render the 5 horizon cards (+1hr, +2hr, +3hr, +4hr, +5hr)
     */
    renderHorizonCards() {
      const container = document.getElementById('ml-horizons-container');
      if (!container || !this.currentPredictions?.horizons) return;

      const horizons = this.currentPredictions.horizons;
      const colors = window.EMSColors;

      container.innerHTML = horizons.map((h, idx) => {
        const emsScore = h.emsProjected;
        const color = colors ? colors.getColor(emsScore) : '#16A34A';
        const info = colors ? colors.getInfo(emsScore) : { label: 'Optimal', range: '81-100' };
        const isActive = this.activeHorizonHours === h.horizonHours;

        const pm25DeltaText = h.deltaPm25 >= 0 ? `+${h.deltaPm25}` : `${h.deltaPm25}`;
        const pm10DeltaText = h.deltaPm10 >= 0 ? `+${h.deltaPm10}` : `${h.deltaPm10}`;

        return `
          <div class="ml-horizon-card ${isActive ? 'is-active' : ''}" 
               id="ml-card-horizon-${h.horizonHours}"
               data-horizon="${h.horizonHours}"
               onclick="window.MLController.selectHorizon(${h.horizonHours})">
            
            <div class="ml-horizon-header">
              <span class="ml-horizon-badge">${h.horizonLabel}</span>
              <span class="ml-horizon-time">${h.targetFormattedTime}</span>
            </div>

            <!-- Predicted EMS Pill with exact Color Code -->
            <div class="ems-color-chip" 
                 style="--chip-color: ${color}; --chip-bg: ${colors ? colors.getRgba(emsScore, 0.14) : 'rgba(0,0,0,0.05)'}; --chip-border: ${colors ? colors.getRgba(emsScore, 0.4) : 'transparent'};">
              <span class="ems-chip-dot" style="background-color: ${color};"></span>
              <span class="ems-chip-text">EMS: ${emsScore} / 100</span>
            </div>

            <!-- Particulates strictly: PM2.5 and PM10 -->
            <div class="ml-metric-row">
              <div class="ml-metric-item">
                <span class="ml-metric-name">PM2.5</span>
                <div style="text-align: right;">
                  <span class="ml-metric-val" style="color: #10B981;">${h.pm25}</span>
                  <span style="font-size: 0.65rem; color: var(--text-tertiary);"> µg/m³</span>
                  <span style="font-size: 0.65rem; font-weight: 700; color: ${h.deltaPm25 > 0 ? '#DC2626' : '#16A34A'}; display: block;">
                    (${pm25DeltaText})
                  </span>
                </div>
              </div>

              <div class="ml-metric-item">
                <span class="ml-metric-name">PM10</span>
                <div style="text-align: right;">
                  <span class="ml-metric-val" style="color: #8B5CF6;">${h.pm10}</span>
                  <span style="font-size: 0.65rem; color: var(--text-tertiary);"> µg/m³</span>
                  <span style="font-size: 0.65rem; font-weight: 700; color: ${h.deltaPm10 > 0 ? '#DC2626' : '#16A34A'}; display: block;">
                    (${pm10DeltaText})
                  </span>
                </div>
              </div>
            </div>

            <!-- Confidence Bar -->
            <div>
              <div class="ml-confidence-bar">
                <span>Model Confidence</span>
                <span class="font-mono" style="font-weight: 700;">${h.confidencePercent}%</span>
              </div>
              <div class="ml-confidence-track">
                <div class="ml-confidence-fill" style="width: ${h.confidencePercent}%;"></div>
              </div>
            </div>

          </div>
        `;
      }).join('');
    },

    selectHorizon(hours) {
      if (this.activeHorizonHours === hours) {
        this.activeHorizonHours = null; // toggle off
      } else {
        this.activeHorizonHours = hours;
      }
      this.renderHorizonCards();
    },

    /**
     * Render the combined Historical + ML Forecast Transition Chart
     */
    renderTransitionChart() {
      if (window.ChartManager && this.currentPredictions) {
        window.ChartManager.renderMLTransitionChart(
          'chart-ml-transition',
          this.historicalAQI,
          this.currentPredictions,
          this.activeMetricMode
        );
      }
    },

    /**
     * Update model diagnostics and backend status
     */
    updateDiagnosticsUI() {
      const statusEl = document.getElementById('ml-backend-status-pill');
      if (statusEl && window.MLService) {
        statusEl.innerHTML = `
          <span class="status-dot-pulse"></span>
          <span>${window.MLService.modelMeta.status}</span>
        `;
      }

      const baseline25El = document.getElementById('ml-baseline-pm25');
      const baseline10El = document.getElementById('ml-baseline-pm10');
      if (baseline25El && this.currentPredictions?.inputBaseline) {
        baseline25El.textContent = `${this.currentPredictions.inputBaseline.pm25} µg/m³`;
      }
      if (baseline10El && this.currentPredictions?.inputBaseline) {
        baseline10El.textContent = `${this.currentPredictions.inputBaseline.pm10} µg/m³`;
      }

      const trajectoryEl = document.getElementById('ml-kpi-trajectory');
      if (trajectoryEl && this.currentPredictions?.horizons?.length) {
        const first = this.currentPredictions.horizons[0];
        const last = this.currentPredictions.horizons[this.currentPredictions.horizons.length - 1];
        const delta = +(last.pm25 - this.currentPredictions.inputBaseline.pm25).toFixed(1);
        if (delta < -1) {
          trajectoryEl.textContent = `Decreasing (${delta} µg/m³)`;
          trajectoryEl.style.color = '#16A34A';
        } else if (delta > 1) {
          trajectoryEl.textContent = `Rising (+${delta} µg/m³)`;
          trajectoryEl.style.color = '#DC2626';
        } else {
          trajectoryEl.textContent = `Stable (±0.5 µg/m³)`;
          trajectoryEl.style.color = '#EAB308';
        }
      }

      const precipKpiEl = document.getElementById('ml-kpi-precip-factor');
      if (precipKpiEl) {
        if (this.simulationParams.rainSimulationMm > 0) {
          precipKpiEl.textContent = `+${this.simulationParams.rainSimulationMm} mm/h Washout`;
          precipKpiEl.style.color = '#2563EB';
        } else if (this.currentPredictions?.inputBaseline?.recentPrecipitation > 0) {
          precipKpiEl.textContent = `${this.currentPredictions.inputBaseline.recentPrecipitation} mm/h Natural`;
          precipKpiEl.style.color = '#0284C7';
        } else {
          precipKpiEl.textContent = `Dry Baseline (0 mm/h)`;
          precipKpiEl.style.color = 'var(--text-primary)';
        }
      }
    }
  };

  window.MLController = MLController;
})(window);
