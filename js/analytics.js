/**
 * GreenPulse - Analytics Controller (analytics.js)
 * 
 * Orchestrates the comprehensive Analytics screen:
 * - Summary KPI cards (Average EMS, Best/Worst locations, Avg Temp).
 * - Regional 7-day EMS & Temperature trend line chart.
 * - Cross-location EMS comparative bar chart.
 * - Multi-sensor parameter radar analysis.
 * - Sortable & searchable location ranking table.
 * - Derived environmental observations & anomalies list.
 */

(function (window) {
  'use strict';

  const AnalyticsController = {
    analyticsData: null,
    locations: [],
    radarLocationId: 'ward-lake',
    comparisonOrientation: 'horizontal',

    async init() {
      if (!window.DataService) return;
      this.locations = await window.DataService.getLocations();
      this.analyticsData = await window.DataService.getAnalytics();
      
      this.renderKPICards();
      this.renderRankingTable();
      this.renderInsights();
      this.bindEvents();
    },

    bindEvents() {
      // Search / Filter input in Ranking Table
      const searchInput = document.getElementById('table-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.filterRankingTable(e.target.value);
        });
      }

      // Radar chart station selector
      const radarSelect = document.getElementById('radar-location-select');
      if (radarSelect) {
        radarSelect.innerHTML = this.locations.map(loc => `
          <option value="${loc.id}" ${loc.id === this.radarLocationId ? 'selected' : ''}>
            ${loc.name} (${loc.current.ems} EMS)
          </option>
        `).join('');

        radarSelect.addEventListener('change', (e) => {
          this.radarLocationId = e.target.value;
          this.renderRadarChart();
        });
      }

      // Cross-Location comparison orientation toggle (Ranked Horizontal vs Vertical Columns)
      const viewToggle = document.getElementById('comparison-view-toggle');
      if (viewToggle) {
        viewToggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const orientation = btn.getAttribute('data-orientation');
            if (orientation && orientation !== this.comparisonOrientation) {
              this.comparisonOrientation = orientation;
              viewToggle.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              if (window.ChartManager && this.locations.length > 0) {
                window.ChartManager.renderLocationComparison('chart-location-comparison', this.locations, this.comparisonOrientation);
              }
            }
          });
        });
      }
    },

    /**
     * Called when user navigates to the Analytics tab
     */
    async onViewActivated() {
      if (!this.analyticsData) {
        await this.init();
      }
      this.renderCharts();
    },

    /**
     * Render the 4 main KPI Cards
     */
    renderKPICards() {
      if (!this.analyticsData) return;
      const { summary } = this.analyticsData;

      // Average EMS
      const avgEmsEl = document.getElementById('kpi-avg-ems');
      if (avgEmsEl) avgEmsEl.textContent = summary.averageEMS;

      // Best Location
      const bestLocEl = document.getElementById('kpi-best-location');
      const bestLocSub = document.getElementById('kpi-best-sub');
      if (bestLocEl) bestLocEl.textContent = summary.bestLocation.name;
      if (bestLocSub) bestLocSub.textContent = `${summary.bestLocation.ems} EMS • ${summary.bestLocation.statusLabel}`;

      // Worst Location
      const worstLocEl = document.getElementById('kpi-worst-location');
      const worstLocSub = document.getElementById('kpi-worst-sub');
      if (worstLocEl) worstLocEl.textContent = summary.worstLocation.name;
      if (worstLocSub) worstLocSub.textContent = `${summary.worstLocation.ems} EMS • ${summary.worstLocation.statusLabel}`;

      // Average Temperature
      const avgTempEl = document.getElementById('kpi-avg-temp');
      const avgTempSub = document.getElementById('kpi-avg-temp-sub');
      if (avgTempEl) avgTempEl.textContent = `${summary.averageTemperature}°C`;
      if (avgTempSub) avgTempSub.textContent = `Avg Humidity ${summary.averageHumidity}% • Stations: ${summary.activeStationsCount}`;
    },

    /**
     * Render all Analytics Chart.js instances
     */
    renderCharts() {
      if (!window.ChartManager || !this.analyticsData) return;

      // 1. Regional 7-day Historical Trend
      window.ChartManager.renderRegionalTrend('chart-regional-trend', this.analyticsData.regionalTrends);

      // 2. Comparative Location Bar Chart
      window.ChartManager.renderLocationComparison('chart-location-comparison', this.locations, this.comparisonOrientation || 'horizontal');

      // 3. Multi-Sensor Radar
      this.renderRadarChart();
    },

    renderRadarChart() {
      if (!window.ChartManager || !this.locations) return;
      const targetLoc = this.locations.find(l => l.id === this.radarLocationId) || this.locations[0];
      if (targetLoc) {
        window.ChartManager.renderSensorRadar('chart-sensor-radar', targetLoc);
      }
    },

    /**
     * Render the Location Ranking Table
     */
    renderRankingTable() {
      if (!this.analyticsData) return;
      const tbody = document.getElementById('ranking-table-body');
      if (!tbody) return;

      const rows = this.analyticsData.rankings.map(item => `
        <tr class="table-row" data-location-id="${item.id}">
          <td class="table-cell-rank">
            <span class="rank-number">${item.rank}</span>
          </td>
          <td class="table-cell-name">
            <div class="table-loc-title">${item.name}</div>
            <div class="table-loc-meta">${item.category} • ${item.code}</div>
          </td>
          <td class="table-cell-ems">
            <span class="ems-color-chip" style="--chip-color: ${window.EMSColors ? window.EMSColors.getColor(item.ems) : '#16A34A'}; --chip-bg: ${window.EMSColors ? window.EMSColors.getRgba(item.ems, 0.12) : 'rgba(0,0,0,0.05)'};">
              <span class="ems-chip-dot" style="background-color: ${window.EMSColors ? window.EMSColors.getColor(item.ems) : '#16A34A'};"></span>
              <span>${item.ems}</span>
            </span>
          </td>
          <td class="table-cell-status">
            <span class="status-badge" style="color: ${window.EMSColors ? window.EMSColors.getColor(item.ems) : '#16A34A'}; background: ${window.EMSColors ? window.EMSColors.getRgba(item.ems, 0.12) : 'transparent'}; border-color: ${window.EMSColors ? window.EMSColors.getRgba(item.ems, 0.3) : 'transparent'};">
              ${window.EMSColors ? window.EMSColors.getInfo(item.ems).label : item.statusLabel}
            </span>
          </td>
          <td class="table-cell-num">${item.temperature}°C</td>
          <td class="table-cell-num">${item.airQuality} / 100</td>
          <td class="table-cell-num">${item.noiseLevel} dB</td>
          <td class="table-cell-action">
            <button type="button" class="btn-inspect-station" data-id="${item.id}" title="Inspect in Dashboard">
              Inspect &rarr;
            </button>
          </td>
        </tr>
      `).join('');

      tbody.innerHTML = rows;

      // Click row or inspect button to go to dashboard
      tbody.querySelectorAll('.btn-inspect-station').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const locId = btn.getAttribute('data-id');
          this.navigateToStationOnDashboard(locId);
        });
      });
    },

    /**
     * Filter table rows based on user input
     */
    filterRankingTable(searchTerm) {
      const q = searchTerm.toLowerCase().trim();
      const rows = document.querySelectorAll('#ranking-table-body tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    },

    /**
     * Render Environmental Derived Insights
     */
    renderInsights() {
      if (!this.analyticsData) return;
      const container = document.getElementById('insights-grid-container');
      if (!container) return;

      const insights = this.analyticsData.insights;
      container.innerHTML = insights.map(item => {
        return `
          <div class="insight-card type-${item.type}">
            <div class="insight-card-header">
              <span class="insight-pill">${item.title}</span>
              <span class="insight-location">${item.location}</span>
            </div>
            <div class="insight-value">${item.value}</div>
            <p class="insight-summary">${item.summary}</p>
          </div>
        `;
      }).join('');
    },

    navigateToStationOnDashboard(locationId) {
      if (window.NavigationManager && window.DashboardController) {
        window.NavigationManager.switchView('dashboard');
        window.DashboardController.selectLocation(locationId, true);
      }
    }
  };

  window.AnalyticsController = AnalyticsController;
})(window);
