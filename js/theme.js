/**
 * GreenPulse - Theme Management (theme.js)
 * 
 * Manages Light / Dark mode themes.
 * - Defaults strictly to LIGHT MODE as requested.
 * - Persists preference in localStorage.
 * - Updates DOM attribute `data-theme` on <html>.
 * - Emits a custom 'themeChanged' event so Leaflet and Chart.js sync instantly.
 */

(function (window) {
  'use strict';

  const THEME_STORAGE_KEY = 'greenpulse_theme';
  const THEME_LIGHT = 'light';
  const THEME_DARK = 'dark';

  const ThemeManager = {
    currentTheme: THEME_LIGHT,

    init() {
      // Check stored preference, otherwise default strictly to light
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      this.currentTheme = (savedTheme === THEME_DARK) ? THEME_DARK : THEME_LIGHT;
      this.applyTheme(this.currentTheme, false);
      this.bindEvents();
    },

    bindEvents() {
      const toggleButtons = document.querySelectorAll('.js-theme-toggle');
      toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.toggleTheme();
        });
      });
    },

    toggleTheme() {
      const newTheme = (this.currentTheme === THEME_LIGHT) ? THEME_DARK : THEME_LIGHT;
      this.applyTheme(newTheme, true);
    },

    applyTheme(theme, save = true) {
      this.currentTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      
      if (save) {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }

      // Update toggle button states / icons
      const toggleButtons = document.querySelectorAll('.js-theme-toggle');
      toggleButtons.forEach(btn => {
        const textSpan = btn.querySelector('.theme-toggle-label');
        if (textSpan) {
          textSpan.textContent = theme === THEME_LIGHT ? 'Dark Mode' : 'Light Mode';
        }
        btn.setAttribute('aria-label', `Switch to ${theme === THEME_LIGHT ? 'Dark' : 'Light'} Mode`);
        btn.setAttribute('title', `Switch to ${theme === THEME_LIGHT ? 'Dark' : 'Light'} Mode`);
        
        const sunIcon = btn.querySelector('.theme-icon-sun');
        const moonIcon = btn.querySelector('.theme-icon-moon');
        if (sunIcon && moonIcon) {
          if (theme === THEME_DARK) {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
          } else {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
          }
        }
      });

      // Dispatch event for Map and Charts to redraw with respective color palettes
      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: this.currentTheme }
      }));
    },

    getTheme() {
      return this.currentTheme;
    },

    isDark() {
      return this.currentTheme === THEME_DARK;
    }
  };

  window.ThemeManager = ThemeManager;
})(window);
