/**
 * GreenPulse - Data Access Layer (data-service.js)
 * 
 * Abstraction layer decoupling the UI from data sources.
 * Easily swappable between local demo dataset and live REST/WebSocket APIs.
 * 
 * Example future migration:
 * async function getLocations() {
 *   const res = await fetch("/api/v1/locations");
 *   return await res.json();
 * }
 */

(function (window) {
  'use strict';

  const DataService = {
    /**
     * Retrieve all monitored locations
     * @returns {Promise<Array>} Array of location objects
     */
    async getLocations() {
      // Emulate brief async resolution to match standard API behavior
      await this._simulateLatency(40);
      return this.getLocationsSync();
    },

    /**
     * Synchronous retrieval of all monitored locations
     * @returns {Array} Array of location objects
     */
    getLocationsSync() {
      return window.environmentalData ? window.environmentalData.locations : [];
    },

    /**
     * Retrieve a specific location by unique slug ID
     * @param {string} id Location ID (e.g., 'ward-lake')
     * @returns {Promise<Object|null>} Location object
     */
    async getLocationById(id) {
      await this._simulateLatency(30);
      return this.getLocation(id);
    },

    /**
     * Synchronous retrieval of a location by ID (safe for direct access)
     * @param {string} id Location ID
     * @returns {Object|null}
     */
    getLocation(id) {
      const locations = this.getLocationsSync();
      return locations.find(loc => loc.id === id) || null;
    },

    /**
     * Get the currently active location across the dashboard
     * @returns {Object|null}
     */
    getCurrentLocation() {
      if (window.DashboardController && window.DashboardController.selectedLocationId) {
        return this.getLocation(window.DashboardController.selectedLocationId);
      }
      const locations = this.getLocationsSync();
      return locations[0] || null;
    },

    /**
     * Retrieve general system & regional metadata
     * @returns {Promise<Object>} Region metadata
     */
    async getRegionMetadata() {
      await this._simulateLatency(20);
      return window.environmentalData ? window.environmentalData.region : {};
    },

    /**
     * Retrieve current snapshot of sensor data for a location or all locations
     * @param {string} [locationId] Optional specific location
     * @returns {Promise<Object>} Current sensor readings
     */
    async getCurrentSensorData(locationId) {
      if (locationId) {
        const loc = await this.getLocationById(locationId);
        return loc ? loc.current : null;
      }
      const locations = await this.getLocations();
      return locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        current: loc.current
      }));
    },

    /**
     * Retrieve historical Eco-Metric Score (EMS) data
     * @param {string} locationId 
     * @param {string} [period='24h']
     * @returns {Promise<Object>} Labels and historical EMS values
     */
    async getEMSHistory(locationId, period = '24h') {
      const loc = await this.getLocationById(locationId);
      if (!loc) return { labels: [], values: [] };

      return {
        locationId: loc.id,
        locationName: loc.name,
        period: period,
        labels: loc.hourlyLabels,
        values: loc.emsHistory24h
      };
    },

    /**
     * Retrieve calculated analytics, rankings, and regional comparisons
     * @returns {Promise<Object>} Analytics summary
     */
    async getAnalytics() {
      const locations = await this.getLocations();
      const regionalTrends = window.environmentalData ? window.environmentalData.regionalTrends : {};
      const insights = window.environmentalData ? window.environmentalData.environmentalInsights : [];

      if (!locations || locations.length === 0) {
        return null;
      }

      // Calculate key aggregates
      const totalLocations = locations.length;
      const avgEMS = (locations.reduce((acc, l) => acc + l.current.ems, 0) / totalLocations).toFixed(1);
      const avgTemp = (locations.reduce((acc, l) => acc + l.current.temperature, 0) / totalLocations).toFixed(1);
      const avgHumidity = Math.round(locations.reduce((acc, l) => acc + l.current.humidity, 0) / totalLocations);
      const avgNoise = Math.round(locations.reduce((acc, l) => acc + l.current.noiseLevel, 0) / totalLocations);

      // Identify best and worst locations based on EMS
      const sortedByEMS = [...locations].sort((a, b) => b.current.ems - a.current.ems);
      const bestLocation = sortedByEMS[0];
      const worstLocation = sortedByEMS[sortedByEMS.length - 1];

      // Format location ranking list
      const rankings = sortedByEMS.map((loc, idx) => ({
        rank: idx + 1,
        id: loc.id,
        name: loc.name,
        code: loc.code,
        category: loc.category,
        ems: loc.current.ems,
        status: loc.current.status,
        statusLabel: loc.current.statusLabel,
        temperature: loc.current.temperature,
        airQuality: loc.current.airQuality,
        noiseLevel: loc.current.noiseLevel,
        humidity: loc.current.humidity
      }));

      return {
        summary: {
          averageEMS: parseFloat(avgEMS),
          bestLocation: {
            id: bestLocation.id,
            name: bestLocation.name,
            ems: bestLocation.current.ems,
            statusLabel: bestLocation.current.statusLabel
          },
          worstLocation: {
            id: worstLocation.id,
            name: worstLocation.name,
            ems: worstLocation.current.ems,
            statusLabel: worstLocation.current.statusLabel
          },
          averageTemperature: parseFloat(avgTemp),
          averageHumidity: avgHumidity,
          averageNoise: avgNoise,
          activeStationsCount: totalLocations
        },
        rankings,
        regionalTrends,
        insights
      };
    },

    /**
     * Search or filter locations
     * @param {string} query 
     * @param {string} [filterStatus]
     */
    async searchLocations(query = '', filterStatus = 'all') {
      const locations = await this.getLocations();
      const cleanQ = query.toLowerCase().trim();

      return locations.filter(loc => {
        const matchesQuery = !cleanQ || 
          loc.name.toLowerCase().includes(cleanQ) || 
          loc.description.toLowerCase().includes(cleanQ) ||
          loc.category.toLowerCase().includes(cleanQ);
          
        const matchesStatus = filterStatus === 'all' || loc.current.status === filterStatus;
        return matchesQuery && matchesStatus;
      });
    },

    /**
     * Simulated micro-fluctuation to give dynamic live heartbeat
     * Modifies current sensor reading slightly (±0.2°C, etc.)
     */
    simulateLivePulse() {
      if (!window.environmentalData) return;
      window.environmentalData.locations.forEach(loc => {
        // Subtle drift
        const tempDelta = (Math.random() - 0.5) * 0.2;
        loc.current.temperature = parseFloat((loc.current.temperature + tempDelta).toFixed(1));
        
        // Random micro humidity drift
        if (Math.random() > 0.6) {
          const humDelta = Math.random() > 0.5 ? 1 : -1;
          loc.current.humidity = Math.min(99, Math.max(30, loc.current.humidity + humDelta));
        }

        // Noise micro jitter
        if (Math.random() > 0.5) {
          const noiseDelta = Math.random() > 0.5 ? 1 : -1;
          loc.current.noiseLevel = Math.min(95, Math.max(30, loc.current.noiseLevel + noiseDelta));
        }

        loc.current.lastUpdated = "Just now";
      });
    },

    _simulateLatency(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  };

  window.DataService = DataService;
})(window);
