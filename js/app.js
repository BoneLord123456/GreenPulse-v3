/**
 * GreenPulse - Main Application Entry (app.js)
 * 
 * Coordinates module initialization:
 * - ThemeManager
 * - DataService
 * - NavigationManager
 * - ChartManager
 * - DashboardController
 * - AnalyticsController
 * - Real-time ticker & live simulated pulse
 */

(function () {
  'use strict';

  function updateLiveClock() {
    const clockEl = document.getElementById('topbar-live-clock');
    if (!clockEl) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    clockEl.textContent = `${timeStr} IST`;
  }

  function startLivePulseLoop() {
    // Periodically pulse live data (every 20s) to give the operational feeling
    setInterval(() => {
      if (window.DataService) {
        window.DataService.simulateLivePulse();
        if (window.DashboardController) {
          window.DashboardController.refreshCurrentLocationData();
        }
      }
    }, 20000);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Theme immediately (ensures correct light/dark styles before paint)
    if (window.ThemeManager) {
      window.ThemeManager.init();
    }

    // 2. Initialize Navigation
    if (window.NavigationManager) {
      window.NavigationManager.init();
    }

    // 3. Initialize Charts Engine
    if (window.ChartManager) {
      window.ChartManager.init();
    }

    // 4. Initialize Dashboard Controller
    if (window.DashboardController) {
      await window.DashboardController.init();
    }

    // 5. Initialize Analytics Controller
    if (window.AnalyticsController) {
      await window.AnalyticsController.init();
    }

    // 6. Initialize ML Controller (Custom 1h-5h Predictor connected to backend)
    if (window.MLController) {
      await window.MLController.init();
    }

    // 7. Topbar Refresh button handler
    const topbarRefreshBtn = document.getElementById('btn-topbar-refresh');
    if (topbarRefreshBtn) {
      topbarRefreshBtn.addEventListener('click', async () => {
        topbarRefreshBtn.classList.add('animate-spin');
        if (window.OpenMeteoService) {
          window.OpenMeteoService.clearCache();
        }
        if (window.DashboardController) {
          await window.DashboardController.refreshCurrentLocationData();
        }
        if (window.MLController) {
          await window.MLController.runInference();
        }
        setTimeout(() => {
          topbarRefreshBtn.classList.remove('animate-spin');
        }, 600);
      });
    }

    // 8. Live Clock & Simulated Ticker
    updateLiveClock();
    setInterval(updateLiveClock, 1000);
    startLivePulseLoop();

    // 9. Initialize Lucide icons if loaded
    if (typeof window.lucide !== 'undefined' && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  });
})();
