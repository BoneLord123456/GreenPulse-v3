/**
 * GreenPulse - Navigation Controller (navigation.js)
 * 
 * Handles:
 * - Tab navigation between Dashboard & Analytics views.
 * - Mobile sidebar drawer toggle with accessible backdrop.
 * - URL Hash sync (#dashboard, #analytics).
 * - Keyboard support (Escape closes mobile drawer).
 */

(function (window) {
  'use strict';

  const NavigationManager = {
    currentView: 'dashboard',
    sidebarEl: null,
    backdropEl: null,

    init() {
      this.sidebarEl = document.getElementById('app-sidebar');
      this.backdropEl = document.getElementById('sidebar-backdrop');

      this.bindNavLinks();
      this.bindMobileDrawer();
      this.handleInitialRoute();
    },

    bindNavLinks() {
      const navLinks = document.querySelectorAll('.nav-item[data-view]');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetView = link.getAttribute('data-view');
          this.switchView(targetView);
          this.closeMobileDrawer();
        });
      });

      // Handle browser back/forward buttons
      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash && (hash === 'dashboard' || hash === 'analytics' || hash === 'ml')) {
          this.switchView(hash, false);
        }
      });
    },

    bindMobileDrawer() {
      const menuBtn = document.getElementById('mobile-menu-btn');
      const closeBtn = document.getElementById('mobile-drawer-close');

      if (menuBtn) {
        menuBtn.addEventListener('click', () => {
          this.openMobileDrawer();
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeMobileDrawer();
        });
      }

      if (this.backdropEl) {
        this.backdropEl.addEventListener('click', () => {
          this.closeMobileDrawer();
        });
      }

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.sidebarEl && this.sidebarEl.classList.contains('is-open')) {
          this.closeMobileDrawer();
        }
      });
    },

    openMobileDrawer() {
      if (this.sidebarEl) {
        this.sidebarEl.classList.add('is-open');
      }
      if (this.backdropEl) {
        this.backdropEl.classList.add('is-active');
      }
      document.body.style.overflow = 'hidden';
    },

    closeMobileDrawer() {
      if (this.sidebarEl) {
        this.sidebarEl.classList.remove('is-open');
      }
      if (this.backdropEl) {
        this.backdropEl.classList.remove('is-active');
      }
      document.body.style.overflow = '';
    },

    switchView(viewName, updateHash = true) {
      if (viewName !== 'dashboard' && viewName !== 'analytics' && viewName !== 'ml') return;
      this.currentView = viewName;

      if (updateHash) {
        window.location.hash = viewName;
      }

      // Update sidebar nav items
      const navLinks = document.querySelectorAll('.nav-item[data-view]');
      navLinks.forEach(link => {
        const isTarget = link.getAttribute('data-view') === viewName;
        link.classList.toggle('is-active', isTarget);
        link.setAttribute('aria-current', isTarget ? 'page' : 'false');
      });

      // Update view sections
      const views = document.querySelectorAll('.app-view');
      views.forEach(v => {
        const isTarget = v.id === `view-${viewName}`;
        v.classList.toggle('hidden', !isTarget);
        v.classList.toggle('is-active-view', isTarget);
      });

      // Update Topbar breadcrumb / title
      const topbarTitle = document.getElementById('topbar-view-title');
      if (topbarTitle) {
        if (viewName === 'dashboard') {
          topbarTitle.textContent = 'Regional Dashboard';
        } else if (viewName === 'ml') {
          topbarTitle.textContent = 'ML Predictive Horizons (1h–5h)';
        } else {
          topbarTitle.textContent = 'Telemetry Analytics';
        }
      }

      // Notify controllers
      if (viewName === 'dashboard') {
        if (window.MapController) {
          window.MapController.invalidateSize();
        }
      } else if (viewName === 'analytics') {
        if (window.AnalyticsController) {
          window.AnalyticsController.onViewActivated();
        }
      } else if (viewName === 'ml') {
        if (window.MLController && typeof window.MLController.onViewActivated === 'function') {
          window.MLController.onViewActivated();
        }
      }

      // Dispatch custom view switch event
      window.dispatchEvent(new CustomEvent('viewChanged', {
        detail: { view: viewName }
      }));
    },

    handleInitialRoute() {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'analytics') {
        this.switchView('analytics', false);
      } else if (hash === 'ml') {
        this.switchView('ml', false);
      } else {
        this.switchView('dashboard', false);
      }
    }
  };

  window.NavigationManager = NavigationManager;
})(window);
