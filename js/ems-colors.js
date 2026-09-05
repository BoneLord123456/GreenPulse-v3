/**
 * GreenPulse - Eco-Metric Score (EMS) Color Coding Engine (ems-colors.js)
 * 
 * Strict implementation of user-specified color thresholds:
 * (0-20,   #DC2626) -> Critical / Severe Stress
 * (21-40,  #F97316) -> High Anthropogenic Stress / Unhealthy
 * (41-60,  #EAB308) -> Moderate / Advisory Caution
 * (61-80,  #65A30D) -> Good / Stable Microclimate
 * (81-100, #16A34A) -> Optimal / Thriving Ecosystem
 */

(function (window) {
  'use strict';

  const EMS_THRESHOLDS = [
    {
      min: 0,
      max: 20,
      range: '0-20',
      color: '#DC2626',
      label: 'Critical / Severe',
      shortLabel: 'Critical',
      glow: 'rgba(220, 38, 38, 0.4)',
      bgLight: 'rgba(220, 38, 38, 0.12)',
      borderLight: 'rgba(220, 38, 38, 0.35)',
      description: 'Severe ecological stress. High particulate density or acute microclimate distress.'
    },
    {
      min: 21,
      max: 40,
      range: '21-40',
      color: '#F97316',
      label: 'High Stress',
      shortLabel: 'Poor',
      glow: 'rgba(249, 115, 22, 0.4)',
      bgLight: 'rgba(249, 115, 22, 0.12)',
      borderLight: 'rgba(249, 115, 22, 0.35)',
      description: 'Elevated stress factors. Caution advised for prolonged outdoor physical exposure.'
    },
    {
      min: 41,
      max: 60,
      range: '41-60',
      color: '#EAB308',
      label: 'Moderate Caution',
      shortLabel: 'Moderate',
      glow: 'rgba(234, 179, 8, 0.4)',
      bgLight: 'rgba(234, 179, 8, 0.12)',
      borderLight: 'rgba(234, 179, 8, 0.35)',
      description: 'Acceptable microclimate conditions with slight atmospheric or acoustic disturbance.'
    },
    {
      min: 61,
      max: 80,
      range: '61-80',
      color: '#65A30D',
      label: 'Good / Stable',
      shortLabel: 'Good',
      glow: 'rgba(101, 163, 13, 0.4)',
      bgLight: 'rgba(101, 163, 13, 0.12)',
      borderLight: 'rgba(101, 163, 13, 0.35)',
      description: 'Healthy vegetation canopy, balanced particulates, and comfortable ambient telemetry.'
    },
    {
      min: 81,
      max: 100,
      range: '81-100',
      color: '#16A34A',
      label: 'Optimal / Thriving',
      shortLabel: 'Optimal',
      glow: 'rgba(22, 163, 74, 0.4)',
      bgLight: 'rgba(22, 163, 74, 0.12)',
      borderLight: 'rgba(22, 163, 74, 0.35)',
      description: 'Pristine ecosystem balance. Optimal air quality, clean soil moisture, and low noise.'
    }
  ];

  const EMSColors = {
    thresholds: EMS_THRESHOLDS,

    /**
     * Get primary color hex code for an EMS score (0-100)
     * @param {number} score 
     * @returns {string} Hex color (#DC2626, #F97316, #EAB308, #65A30D, #16A34A)
     */
    getColor(score) {
      const val = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
      if (val <= 20) return '#DC2626';
      if (val <= 40) return '#F97316';
      if (val <= 60) return '#EAB308';
      if (val <= 80) return '#65A30D';
      return '#16A34A';
    },

    /**
     * Get full descriptive meta object for an EMS score
     * @param {number} score 
     * @returns {Object}
     */
    getInfo(score) {
      const val = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
      for (const t of EMS_THRESHOLDS) {
        if (val >= t.min && val <= t.max) {
          return t;
        }
      }
      return EMS_THRESHOLDS[4];
    },

    /**
     * Get translucent RGBA background color for badges / pills
     * @param {number} score 
     * @param {number} opacity 
     * @returns {string}
     */
    getRgba(score, opacity = 0.15) {
      const hex = this.getColor(score);
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },

    /**
     * Returns CSS class name for styling
     */
    getClassName(score) {
      const val = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
      if (val <= 20) return 'ems-tier-0-20';
      if (val <= 40) return 'ems-tier-21-40';
      if (val <= 60) return 'ems-tier-41-60';
      if (val <= 80) return 'ems-tier-61-80';
      return 'ems-tier-81-100';
    },

    /**
     * Create an interactive HTML badge with the exact color coding
     * @param {number} score 
     * @param {string} [prefix]
     * @returns {string} HTML snippet
     */
    createBadgeHtml(score, prefix = 'EMS') {
      const info = this.getInfo(score);
      return `
        <span class="ems-color-chip ${this.getClassName(score)}" 
              style="--chip-color: ${info.color}; --chip-bg: ${info.bgLight}; --chip-border: ${info.borderLight};"
              title="${info.label} (${info.range})">
          <span class="ems-chip-dot" style="background-color: ${info.color};"></span>
          <span class="ems-chip-text">${prefix ? `${prefix} ` : ''}${score}</span>
        </span>
      `;
    }
  };

  window.EMSColors = EMSColors;
})(window);
