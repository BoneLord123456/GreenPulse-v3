/**
 * GreenPulse - Charts Controller (charts.js)
 * 
 * Powered by Chart.js.
 * Built with professional SaaS design principles:
 * - Disciplined color palette: primary green, neutral slate grays.
 * - Restrained grid lines (subtle, non-distracting).
 * - Full reactivity on theme change (Light / Dark mode).
 * - Proper destruction of existing chart instances to prevent memory leaks or canvas corruption.
 */

(function (window) {
  'use strict';

  // Palette tokens for Chart.js
  function getThemeColors() {
    const isDark = window.ThemeManager ? window.ThemeManager.isDark() : false;
    return {
      isDark,
      primary: '#279655',
      primaryTransparent: isDark ? 'rgba(39, 150, 85, 0.25)' : 'rgba(39, 150, 85, 0.12)',
      primaryLight: isDark ? '#34d399' : '#1e7e45',
      secondary: isDark ? '#4ade80' : '#22c55e',
      text: isDark ? '#9CA3AF' : '#4B5563',
      textStrong: isDark ? '#F3F4F6' : '#111827',
      grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      border: isDark ? '#26332B' : '#E2E8E4',
      tooltipBg: isDark ? '#1F2823' : '#FFFFFF',
      tooltipText: isDark ? '#F3F4F6' : '#111827',
      tooltipBorder: isDark ? '#2A352F' : '#E5E9E7',
      advisoryColor: '#D97706',
      alertColor: '#DC2626'
    };
  }

  const ChartManager = {
    instances: {},

    init() {
      // Listen for theme switch to update chart visuals dynamically
      window.addEventListener('themeChanged', () => {
        this.updateAllChartsTheme();
      });
    },

    /**
     * Safely destroy an existing chart instance
     * @param {string} key 
     */
    destroyChart(key) {
      if (this.instances[key]) {
        this.instances[key].destroy();
        delete this.instances[key];
      }
    },

    /**
     * Render the EMS 24-hour trend line chart on Dashboard
     */
    renderEMSTrend(canvasId, labels, dataPoints, locationName) {
      const canvas = document.getElementById(canvasId);
      if (!canvas || typeof Chart === 'undefined') return;

      this.destroyChart(canvasId);
      const colors = getThemeColors();
      const ctx = canvas.getContext('2d');

      // Create subtle gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, 180);
      gradient.addColorStop(0, colors.primaryTransparent);
      gradient.addColorStop(1, 'rgba(39, 150, 85, 0.00)');

      // Point colors matched to user's exact EMS thresholds
      const pointColors = dataPoints.map(val => {
        if (window.EMSColors) return window.EMSColors.getColor(val);
        if (val <= 20) return '#DC2626';
        if (val <= 40) return '#F97316';
        if (val <= 60) return '#EAB308';
        if (val <= 80) return '#65A30D';
        return '#16A34A';
      });

      this.instances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: `${locationName} EMS`,
            data: dataPoints,
            borderColor: colors.primary,
            backgroundColor: gradient,
            borderWidth: 2.2,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: pointColors,
            pointBorderColor: colors.tooltipBg,
            pointBorderWidth: 2,
            pointRadius: 4.5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: pointColors,
            pointHoverBorderColor: colors.tooltipBg,
            pointHoverBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              titleColor: colors.tooltipText,
              bodyColor: colors.text,
              borderColor: colors.tooltipBorder,
              borderWidth: 1,
              padding: 10,
              boxPadding: 4,
              usePointStyle: true,
              callbacks: {
                label: function (context) {
                  return `EMS Index: ${context.parsed.y} / 100`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false,
                drawBorder: false
              },
              ticks: {
                color: colors.text,
                font: { size: 11, family: 'inherit' },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 6
              }
            },
            y: {
              min: 0,
              max: 100,
              beginAtZero: true,
              grid: {
                color: colors.grid,
                drawBorder: false
              },
              ticks: {
                color: colors.text,
                font: { size: 11, family: 'inherit' },
                stepSize: 20
              }
            }
          }
        }
      });
    },

    /**
     * Render the Comparative Location Bar Chart on Analytics view
     * Supports both 'horizontal' (ranked leaderboard) and 'vertical' (column chart)
     * Always adheres to the 0-100 EMS scale with true status-tier colors
     * @param {string} canvasId 
     * @param {Array} locations 
     * @param {string} [orientation='horizontal'] 'horizontal' | 'vertical'
     */
    renderLocationComparison(canvasId, locations, orientation = 'horizontal') {
      const canvas = document.getElementById(canvasId);
      if (!canvas || typeof Chart === 'undefined' || !locations || locations.length === 0) return;

      this.destroyChart(canvasId);
      const colors = getThemeColors();
      const ctx = canvas.getContext('2d');

      // Sort locations descending by EMS: highest health to lowest
      const sorted = [...locations].sort((a, b) => b.current.ems - a.current.ems);
      const isHorizontal = orientation === 'horizontal';

      // Full descriptive names for horizontal (plenty of room); clean formatted for vertical
      const fullLabels = sorted.map(l => l.name);

      // Multi-line labels for vertical columns so names never collide or truncate
      const verticalLabels = sorted.map(l => {
        let short = l.name.replace(/\s*\(.*?\)\s*/g, '').trim();
        short = short.replace(/\b(Corridor|Commercial Ridge|Nongkwar|Reservoir Shore|Precipice|Outlook)\b/gi, '').trim();
        const parts = short.split(' ');
        if (parts.length > 2) {
          return [parts.slice(0, 2).join(' '), parts.slice(2).join(' ')];
        }
        return parts;
      });

      const labels = isHorizontal ? fullLabels : verticalLabels;
      const emsScores = sorted.map(l => l.current.ems);

      // Color bars strictly according to user's EMS thresholds:
      // (0-20 #DC2626), (21-40 #F97316), (41-60 #EAB308), (61-80 #65A30D), (81-100 #16A34A)
      const barColors = sorted.map(l => {
        if (window.EMSColors && typeof window.EMSColors.getColor === 'function') {
          return window.EMSColors.getColor(l.current.ems);
        }
        const val = l.current.ems;
        if (val <= 20) return '#DC2626';
        if (val <= 40) return '#F97316';
        if (val <= 60) return '#EAB308';
        if (val <= 80) return '#65A30D';
        return '#16A34A';
      });

      // Calculate regional average for reference guideline
      const totalEMS = emsScores.reduce((acc, v) => acc + v, 0);
      const avgEMS = parseFloat((totalEMS / emsScores.length).toFixed(1));

      // Custom Chart.js inline plugin to draw score value labels and regional average reference line
      const comparisonDecorationsPlugin = {
        id: 'comparisonDecorations_' + canvasId,
        afterDatasetsDraw(chart) {
          const { ctx: chartCtx, chartArea, scales: { x: scaleX, y: scaleY } } = chart;
          if (!chartArea) return;
          const { top, bottom, left, right } = chartArea;
          chartCtx.save();

          // 1. Draw subtle dashed Regional Average benchmark line
          if (!isNaN(avgEMS) && avgEMS >= 0 && avgEMS <= 100) {
            chartCtx.strokeStyle = colors.isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.22)';
            chartCtx.lineWidth = 1;
            chartCtx.setLineDash([4, 4]);

            if (isHorizontal) {
              const lineX = scaleX.getPixelForValue(avgEMS);
              if (lineX >= left && lineX <= right) {
                chartCtx.beginPath();
                chartCtx.moveTo(lineX, top);
                chartCtx.lineTo(lineX, bottom);
                chartCtx.stroke();

                chartCtx.fillStyle = colors.text;
                chartCtx.font = '500 10px Inter, system-ui, sans-serif';
                chartCtx.textAlign = 'center';
                chartCtx.fillText(`Avg ${avgEMS}`, lineX, top - 4);
              }
            } else {
              const lineY = scaleY.getPixelForValue(avgEMS);
              if (lineY >= top && lineY <= bottom) {
                chartCtx.beginPath();
                chartCtx.moveTo(left, lineY);
                chartCtx.lineTo(right, lineY);
                chartCtx.stroke();

                chartCtx.fillStyle = colors.text;
                chartCtx.font = '500 10px Inter, system-ui, sans-serif';
                chartCtx.textAlign = 'right';
                chartCtx.fillText(`Avg ${avgEMS}`, right - 4, lineY - 4);
              }
            }
          }

          // 2. Draw score value at the end of each bar
          chart.getDatasetMeta(0).data.forEach((bar, index) => {
            const val = emsScores[index];
            const color = barColors[index];
            chartCtx.setLineDash([]);
            chartCtx.font = '600 11px Inter, system-ui, sans-serif';

            if (isHorizontal) {
              const barX = bar.x;
              const barY = bar.y;
              // Check if bar is very close to right edge
              if (barX + 30 > right) {
                chartCtx.textAlign = 'right';
                chartCtx.fillStyle = '#FFFFFF';
                chartCtx.fillText(val, barX - 6, barY);
              } else {
                chartCtx.textAlign = 'left';
                chartCtx.fillStyle = color;
                chartCtx.fillText(val, barX + 6, barY);
              }
            } else {
              const barX = bar.x;
              const barY = bar.y;
              chartCtx.textAlign = 'center';
              chartCtx.fillStyle = color;
              chartCtx.fillText(val, barX, barY - 4);
            }
          });

          chartCtx.restore();
        }
      };

      this.instances[canvasId] = new Chart(ctx, {
        type: 'bar',
        plugins: [comparisonDecorationsPlugin],
        data: {
          labels: labels,
          datasets: [{
            label: 'Eco-Metric Score (EMS)',
            data: emsScores,
            backgroundColor: barColors,
            borderRadius: isHorizontal ? { topRight: 6, bottomRight: 6 } : { topLeft: 6, topRight: 6 },
            borderSkipped: false,
            maxBarThickness: isHorizontal ? 18 : 28
          }]
        },
        options: {
          indexAxis: isHorizontal ? 'y' : 'x',
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 14,
              right: isHorizontal ? 36 : 14,
              bottom: 6,
              left: 4
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              titleColor: colors.tooltipText,
              bodyColor: colors.text,
              borderColor: colors.tooltipBorder,
              borderWidth: 1,
              padding: 12,
              displayColors: true,
              callbacks: {
                title: function(items) {
                  const loc = sorted[items[0].dataIndex];
                  return loc.name;
                },
                label: function(item) {
                  const loc = sorted[item.dataIndex];
                  const info = window.EMSColors ? window.EMSColors.getInfo(loc.current.ems) : null;
                  const tierLabel = info ? info.label : loc.current.statusLabel;
                  return ` EMS: ${loc.current.ems} / 100 • ${tierLabel}`;
                },
                afterLabel: function(item) {
                  const loc = sorted[item.dataIndex];
                  return `Category: ${loc.category}\nStatus: ${loc.current.statusLabel}\nAQI: ${loc.current.aqiRaw || loc.current.airQuality} • Temp: ${loc.current.temperature}°C`;
                }
              }
            }
          },
          scales: isHorizontal ? {
            x: {
              min: 0,
              max: 100,
              beginAtZero: true,
              grid: { color: colors.grid, drawBorder: false },
              ticks: {
                color: colors.text,
                font: { size: 11, family: 'inherit' },
                stepSize: 20
              },
              title: {
                display: true,
                text: 'Eco-Metric Score (0 = Critical Stress, 100 = Optimal)',
                color: colors.text,
                font: { size: 10, family: 'inherit', weight: 500 }
              }
            },
            y: {
              grid: { display: false, drawBorder: false },
              ticks: {
                color: colors.textStrong,
                font: { size: 11, family: 'inherit', weight: 500 }
              }
            }
          } : {
            x: {
              grid: { display: false, drawBorder: false },
              ticks: {
                color: colors.textStrong,
                font: { size: 10, family: 'inherit' },
                maxRotation: 0,
                minRotation: 0
              }
            },
            y: {
              min: 0,
              max: 100,
              beginAtZero: true,
              grid: { color: colors.grid, drawBorder: false },
              ticks: {
                color: colors.text,
                font: { size: 11, family: 'inherit' },
                stepSize: 20
              },
              title: {
                display: true,
                text: 'Eco-Metric Score (EMS)',
                color: colors.text,
                font: { size: 10, family: 'inherit', weight: 500 }
              }
            }
          },
          onClick: (event, elements) => {
            if (elements && elements.length > 0) {
              const index = elements[0].index;
              const loc = sorted[index];
              if (loc && window.AnalyticsController) {
                window.AnalyticsController.navigateToStationOnDashboard(loc.id);
              }
            }
          }
        }
      });
    },

    /**
     * Render Regional 7-day Historical Trend on Analytics
     */
    renderRegionalTrend(canvasId, regionalTrends) {
      const canvas = document.getElementById(canvasId);
      if (!canvas || typeof Chart === 'undefined' || !regionalTrends) return;

      this.destroyChart(canvasId);
      const colors = getThemeColors();
      const ctx = canvas.getContext('2d');

      this.instances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: regionalTrends.dates,
          datasets: [
            {
              label: 'Regional Average EMS',
              data: regionalTrends.averageEMS,
              borderColor: colors.primary,
              backgroundColor: 'transparent',
              borderWidth: 2.2,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: colors.primary,
              pointBorderColor: colors.tooltipBg,
              yAxisID: 'y'
            },
            {
              label: 'Avg Temperature (°C)',
              data: regionalTrends.averageTemp,
              borderColor: '#0284C7', // subtle blue-slate for temperature
              backgroundColor: 'transparent',
              borderWidth: 1.8,
              borderDash: [4, 4],
              tension: 0.35,
              pointRadius: 3,
              pointBackgroundColor: '#0284C7',
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                boxWidth: 12,
                boxHeight: 12,
                color: colors.text,
                font: { size: 11, family: 'inherit' },
                usePointStyle: true
              }
            },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              titleColor: colors.tooltipText,
              bodyColor: colors.text,
              borderColor: colors.tooltipBorder,
              borderWidth: 1,
              padding: 10
            }
          },
          scales: {
            x: {
              grid: { display: false, drawBorder: false },
              ticks: { color: colors.text, font: { size: 11, family: 'inherit' } }
            },
            y: {
              type: 'linear',
              position: 'left',
              min: 75,
              max: 95,
              grid: { color: colors.grid, drawBorder: false },
              ticks: {
                color: colors.text,
                font: { size: 11, family: 'inherit' },
                callback: v => `${v} EMS`
              }
            },
            y1: {
              type: 'linear',
              position: 'right',
              min: 15,
              max: 30,
              grid: { display: false, drawBorder: false },
              ticks: {
                color: colors.text,
                font: { size: 11, family: 'inherit' },
                callback: v => `${v}°C`
              }
            }
          }
        }
      });
    },

    /**
     * Render Radar Chart for Multi-Sensor Parameter Comparison
     */
    renderSensorRadar(canvasId, location) {
      const canvas = document.getElementById(canvasId);
      if (!canvas || typeof Chart === 'undefined' || !location) return;

      this.destroyChart(canvasId);
      const colors = getThemeColors();
      const ctx = canvas.getContext('2d');

      // Normalized parameters: Air Quality, Soil, Quietude (100-noise), Thermal Comfort, Moisture, Anthropogenic Freedom (100-crowd)
      const quietudeScore = Math.max(10, 100 - (location.current.noiseLevel - 30) * 1.5);
      const crowdScore = Math.max(10, 100 - location.current.crowdIndex);
      const thermalScore = Math.max(20, 100 - Math.abs(location.current.temperature - 21) * 6);

      const labels = ['Air Quality', 'Soil Hydration', 'Acoustic Calm', 'Relative Humidity', 'Thermal Stability', 'Low Footprint'];
      const locationData = [
        location.current.airQuality,
        location.current.soilMoisture,
        Math.round(quietudeScore),
        location.current.humidity,
        Math.round(thermalScore),
        Math.round(crowdScore)
      ];

      // Regional baseline benchmark
      const baselineData = [80, 75, 70, 72, 85, 65];

      this.instances[canvasId] = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: labels,
          datasets: [
            {
              label: location.name,
              data: locationData,
              fill: true,
              backgroundColor: colors.primaryTransparent,
              borderColor: colors.primary,
              pointBackgroundColor: colors.primary,
              pointBorderColor: colors.tooltipBg,
              pointHoverBackgroundColor: colors.tooltipBg,
              pointHoverBorderColor: colors.primary,
              borderWidth: 2
            },
            {
              label: 'Regional Average',
              data: baselineData,
              fill: false,
              borderColor: colors.isDark ? '#4B5563' : '#9CA3AF',
              borderDash: [3, 3],
              pointRadius: 2,
              borderWidth: 1.5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                color: colors.text,
                font: { size: 11, family: 'inherit' },
                usePointStyle: true
              }
            },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              titleColor: colors.tooltipText,
              bodyColor: colors.text,
              borderColor: colors.tooltipBorder,
              borderWidth: 1,
              padding: 8
            }
          },
          scales: {
            r: {
              angleLines: { color: colors.grid },
              grid: { color: colors.grid },
              pointLabels: {
                color: colors.text,
                font: { size: 10.5, family: 'inherit' }
              },
              ticks: {
                display: false,
                backdropColor: 'transparent',
                stepSize: 25,
                max: 100,
                min: 0
              },
              suggestedMin: 20,
              suggestedMax: 100
            }
          }
        }
      });
    },

    /**
     * Render Open-Meteo Historical Weather Chart (Rainfall, Precipitation & Probability)
     */
    renderHistoricalWeatherChart(canvasId, historicalWeather) {
      const canvas = document.getElementById(canvasId);
      if (!canvas || typeof Chart === 'undefined' || !historicalWeather || historicalWeather.length === 0) return;

      this.destroyChart(canvasId);
      const colors = getThemeColors();
      const ctx = canvas.getContext('2d');

      // Sample down if more than 30 points for crisp presentation
      const step = Math.max(1, Math.floor(historicalWeather.length / 24));
      const sampled = historicalWeather.filter((_, idx) => idx % step === 0);

      const labels = sampled.map(d => `${d.dayLabel} ${d.hourLabel}`);
      const rainData = sampled.map(d => d.rain);
      const precipData = sampled.map(d => d.precipitation);
      const probData = sampled.map(d => d.probability);

      this.instances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              type: 'bar',
              label: 'Rainfall (mm)',
              data: rainData,
              backgroundColor: 'rgba(37, 99, 235, 0.65)',
              borderColor: '#2563EB',
              borderWidth: 1,
              borderRadius: 4,
              yAxisID: 'y'
            },
            {
              type: 'line',
              label: 'Precipitation Probability (%)',
              data: probData,
              borderColor: '#F59E0B',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderWidth: 2,
              tension: 0.35,
              pointRadius: 2.5,
              pointBackgroundColor: '#F59E0B',
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: { color: colors.text, boxWidth: 12, font: { size: 11 } }
            },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              titleColor: colors.tooltipText,
              bodyColor: colors.text,
              borderColor: colors.tooltipBorder,
              borderWidth: 1,
              padding: 10
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: colors.text, maxTicksLimit: 8, font: { size: 10 } }
            },
            y: {
              type: 'linear',
              position: 'left',
              title: { display: true, text: 'Rainfall (mm)', color: colors.text, font: { size: 10 } },
              grid: { color: colors.grid },
              ticks: { color: colors.text, font: { size: 10 } },
              min: 0
            },
            y1: {
              type: 'linear',
              position: 'right',
              title: { display: true, text: 'Probability (%)', color: colors.text, font: { size: 10 } },
              grid: { display: false },
              ticks: { color: colors.text, font: { size: 10 } },
              min: 0,
              max: 100
            }
          }
        }
      });
    },

    /**
     * Render Open-Meteo Historical Air Quality Chart (PM2.5 & PM10)
     */
    renderHistoricalAQIChart(canvasId, historicalAQI) {
      const canvas = document.getElementById(canvasId);
      if (!canvas || typeof Chart === 'undefined' || !historicalAQI || historicalAQI.length === 0) return;

      this.destroyChart(canvasId);
      const colors = getThemeColors();
      const ctx = canvas.getContext('2d');

      const step = Math.max(1, Math.floor(historicalAQI.length / 24));
      const sampled = historicalAQI.filter((_, idx) => idx % step === 0);

      const labels = sampled.map(d => `${d.dayLabel} ${d.hourLabel}`);
      const pm25Data = sampled.map(d => d.pm2_5);
      const pm10Data = sampled.map(d => d.pm10);

      this.instances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'PM2.5 (µg/m³)',
              data: pm25Data,
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2.2,
              tension: 0.35,
              fill: true,
              pointRadius: 2.5,
              pointBackgroundColor: '#10B981'
            },
            {
              label: 'PM10 (µg/m³)',
              data: pm10Data,
              borderColor: '#8B5CF6',
              backgroundColor: 'rgba(139, 92, 246, 0.08)',
              borderWidth: 2.2,
              tension: 0.35,
              fill: true,
              pointRadius: 2.5,
              pointBackgroundColor: '#8B5CF6'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: { color: colors.text, boxWidth: 12, font: { size: 11 } }
            },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              titleColor: colors.tooltipText,
              bodyColor: colors.text,
              borderColor: colors.tooltipBorder,
              borderWidth: 1,
              padding: 10
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: colors.text, maxTicksLimit: 8, font: { size: 10 } }
            },
            y: {
              title: { display: true, text: 'Concentration (µg/m³)', color: colors.text, font: { size: 10 } },
              grid: { color: colors.grid },
              ticks: { color: colors.text, font: { size: 10 } },
              min: 0
            }
          }
        }
      });
    },

    /**
     * Combined Historical Open-Meteo + ML Predictive Engine (1h-5h) Transition Chart
     * Clearly delineates:
     * - Past 16-24h Historical Telemetry (Solid lines)
     * - NOW Demarcation Boundary
     * - Next 1h, 2h, 3h, 4h, 5h ML Model Predictions (Dashed / Glowing lines)
     */
    renderMLTransitionChart(canvasId, historicalAQI, mlPredictions, metricMode = 'both') {
      const canvas = document.getElementById(canvasId);
      if (!canvas || typeof Chart === 'undefined') return;

      this.destroyChart(canvasId);
      const colors = getThemeColors();
      const ctx = canvas.getContext('2d');

      // Slice last 14 historical points
      const histSlice = (historicalAQI || []).slice(-14);
      const horizons = mlPredictions?.horizons || [];

      const histLabels = histSlice.map(h => `${h.hourLabel}`);
      const mlLabels = horizons.map(h => `${h.horizonLabel} (${h.targetFormattedTime})`);
      const allLabels = [...histLabels, ...mlLabels];

      // Hist PM2.5 array with nulls for ML segment
      const histPm25 = [...histSlice.map(h => h.pm2_5)];
      const lastHistPm25 = histPm25[histPm25.length - 1] ?? 12.0;

      // Hist PM10 array with nulls for ML segment
      const histPm10 = [...histSlice.map(h => h.pm10)];
      const lastHistPm10 = histPm10[histPm10.length - 1] ?? 24.0;

      // ML arrays padding nulls for historical segment, connecting at the seam
      const mlPm25Padded = new Array(histSlice.length - 1).fill(null);
      mlPm25Padded.push(lastHistPm25); // bridge point
      horizons.forEach(h => mlPm25Padded.push(h.pm25));

      const mlPm10Padded = new Array(histSlice.length - 1).fill(null);
      mlPm10Padded.push(lastHistPm10); // bridge point
      horizons.forEach(h => mlPm10Padded.push(h.pm10));

      const datasets = [];

      // Historical PM2.5
      if (metricMode === 'both' || metricMode === 'pm25') {
        datasets.push({
          label: 'Historical PM2.5 (Open-Meteo)',
          data: [...histPm25, ...new Array(horizons.length).fill(null)],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          borderWidth: 2.2,
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#10B981'
        });

        // Forecast PM2.5
        datasets.push({
          label: 'ML Model 1h-5h Prediction (PM2.5)',
          data: mlPm25Padded,
          borderColor: '#059669',
          borderDash: [5, 4],
          backgroundColor: 'rgba(5, 150, 105, 0.15)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#059669',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2
        });
      }

      // Historical PM10
      if (metricMode === 'both' || metricMode === 'pm10') {
        datasets.push({
          label: 'Historical PM10 (Open-Meteo)',
          data: [...histPm10, ...new Array(horizons.length).fill(null)],
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.08)',
          borderWidth: 2.2,
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#8B5CF6'
        });

        // Forecast PM10
        datasets.push({
          label: 'ML Model 1h-5h Prediction (PM10)',
          data: mlPm10Padded,
          borderColor: '#7C3AED',
          borderDash: [5, 4],
          backgroundColor: 'rgba(124, 58, 237, 0.15)',
          borderWidth: 3,
          tension: 0.35,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#7C3AED',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2
        });
      }

      this.instances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: allLabels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: colors.text,
                boxWidth: 14,
                font: { size: 11, weight: '600' }
              }
            },
            tooltip: {
              backgroundColor: colors.tooltipBg,
              titleColor: colors.tooltipText,
              bodyColor: colors.text,
              borderColor: colors.tooltipBorder,
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: function (context) {
                  const val = context.parsed.y;
                  if (val === null || val === undefined) return null;
                  return `${context.dataset.label}: ${val} µg/m³`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: function (context) {
                  // Highlight the boundary between historical and ML
                  if (context.index === histSlice.length - 1) {
                    return colors.advisoryColor || '#F59E0B';
                  }
                  return 'transparent';
                },
                lineWidth: function (context) {
                  return context.index === histSlice.length - 1 ? 2 : 1;
                }
              },
              ticks: { color: colors.text, maxTicksLimit: 12, font: { size: 10 } }
            },
            y: {
              title: { display: true, text: 'Particulate Concentration (µg/m³)', color: colors.text, font: { size: 10 } },
              grid: { color: colors.grid },
              ticks: { color: colors.text, font: { size: 10 } },
              min: 0
            }
          }
        }
      });
    },

    /**
     * Refresh all active charts when theme toggles
     */
    updateAllChartsTheme() {
      // Loop through all active instances and re-render if data exists
      Object.keys(this.instances).forEach(id => {
        const chart = this.instances[id];
        if (!chart) return;
        const colors = getThemeColors();

        if (chart.config.type === 'line' || chart.config.type === 'bar') {
          const isHorizontal = chart.options.indexAxis === 'y';
          if (chart.options.scales.x) {
            chart.options.scales.x.ticks.color = isHorizontal ? colors.text : colors.textStrong;
            if (chart.options.scales.x.grid) chart.options.scales.x.grid.color = colors.grid;
          }
          if (chart.options.scales.y) {
            chart.options.scales.y.ticks.color = isHorizontal ? colors.textStrong : colors.text;
            chart.options.scales.y.grid.color = colors.grid;
          }
          if (chart.options.scales.y1) {
            chart.options.scales.y1.ticks.color = colors.text;
          }
          if (chart.options.plugins.tooltip) {
            chart.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
            chart.options.plugins.tooltip.titleColor = colors.tooltipText;
            chart.options.plugins.tooltip.bodyColor = colors.text;
            chart.options.plugins.tooltip.borderColor = colors.tooltipBorder;
          }
          if (chart.options.plugins.legend) {
            chart.options.plugins.legend.labels.color = colors.text;
          }
        } else if (chart.config.type === 'radar') {
          if (chart.options.scales.r) {
            chart.options.scales.r.angleLines.color = colors.grid;
            chart.options.scales.r.grid.color = colors.grid;
            chart.options.scales.r.pointLabels.color = colors.text;
          }
          if (chart.options.plugins.legend) {
            chart.options.plugins.legend.labels.color = colors.text;
          }
        }
        chart.update();
      });
    }
  };

  window.ChartManager = ChartManager;
})(window);
