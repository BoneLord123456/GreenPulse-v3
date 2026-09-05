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
 * - MLController
 * - Real-time ticker & live simulated pulse
 */

(function () {
  'use strict';

  /**
   * Update the live clock and last refreshed timestamp
   */
  function updateLiveClock() {
    const clockEl = document.getElementById('topbar-live-clock');
    if (!clockEl) return;
    try {
      const now = new Date();
      let timeStr;
      try {
        timeStr = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kolkata'
        });
      } catch (tzErr) {
        timeStr = now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      clockEl.textContent = `${timeStr} IST`;
    } catch (e) {
      console.warn('Clock display error:', e);
    }
  }

  // Expose globally for instant triggering upon data refresh
  window.updateLiveClock = updateLiveClock;

  // Immediately invoke and start timer right away without waiting for any async dependencies
  updateLiveClock();
  const clockInterval = setInterval(updateLiveClock, 1000);

  function startLivePulseLoop() {
    // Periodically pulse live data (every 20s) to give the operational feeling
    setInterval(() => {
      if (window.DataService && typeof window.DataService.simulateLivePulse === 'function') {
        window.DataService.simulateLivePulse();
        if (window.DashboardController && typeof window.DashboardController.refreshCurrentLocationData === 'function') {
          window.DashboardController.refreshCurrentLocationData();
        }
        updateLiveClock();
      }
    }, 20000);
  }

  /**
   * Master application initialization sequence
   */
  async function initApp() {
    // Ensure clock is visible immediately upon DOM readiness
    updateLiveClock();

    // 1. Initialize Theme immediately (ensures correct light/dark styles before paint)
    try {
      if (window.ThemeManager) {
        window.ThemeManager.init();
      }
    } catch (err) {
      console.warn('ThemeManager init error:', err);
    }

    // 2. Initialize Navigation
    try {
      if (window.NavigationManager) {
        window.NavigationManager.init();
      }
    } catch (err) {
      console.warn('NavigationManager init error:', err);
    }

    // 3. Initialize Charts Engine
    try {
      if (window.ChartManager) {
        window.ChartManager.init();
      }
    } catch (err) {
      console.warn('ChartManager init error:', err);
    }

    // 4. Initialize Dashboard Controller
    try {
      if (window.DashboardController) {
        await window.DashboardController.init();
      }
    } catch (err) {
      console.warn('DashboardController init error:', err);
    }

    // 5. Initialize Analytics Controller
    try {
      if (window.AnalyticsController) {
        await window.AnalyticsController.init();
      }
    } catch (err) {
      console.warn('AnalyticsController init error:', err);
    }

    // 6. Initialize ML Controller (Custom 1h-5h Predictor connected to backend)
    try {
      if (window.MLController) {
        await window.MLController.init();
      }
    } catch (err) {
      console.warn('MLController init error:', err);
    }

    // 7. Topbar Refresh button handler
    const topbarRefreshBtn = document.getElementById('btn-topbar-refresh');
    if (topbarRefreshBtn) {
      topbarRefreshBtn.addEventListener('click', async () => {
        topbarRefreshBtn.classList.add('animate-spin');
        updateLiveClock();
        try {
          if (window.OpenMeteoService) {
            window.OpenMeteoService.clearCache();
          }
          if (window.DashboardController) {
            await window.DashboardController.refreshCurrentLocationData();
          }
          if (window.MLController) {
            await window.MLController.runInference();
          }
        } catch (refreshErr) {
          console.warn('Manual refresh error:', refreshErr);
        } finally {
          updateLiveClock();
          setTimeout(() => {
            topbarRefreshBtn.classList.remove('animate-spin');
          }, 600);
        }
      });
    }

    // 8. Start Simulated Pulse Loop
    startLivePulseLoop();

    // 9. Initialize Lucide icons if loaded
    if (typeof window.lucide !== 'undefined' && window.lucide.createIcons) {
      try {
        window.lucide.createIcons();
      } catch (iconErr) {
        console.warn('Lucide icons error:', iconErr);
      }
    }
  }

  // Handle both dynamic injection and early/late DOMContentLoaded states
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    // DOM is already ready (e.g. static hosting on GitHub Pages, cached, or bottom script execution)
    initApp();
  }
})();
