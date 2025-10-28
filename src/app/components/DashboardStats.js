"use client";
import { useState, useEffect, useMemo, useRef } from 'react';

const FILTERS = [
  { label: 'Daily', value: 'day', icon: '📅' },
  { label: 'Monthly', value: 'month', icon: '📊' },
  { label: 'Yearly', value: 'year', icon: '🎯' }
];

const CHART_TYPES = [
  { label: 'Bars', value: 'bar', icon: '📊' },
  { label: 'Lines', value: 'line', icon: '📈' }
];

export default function DashboardStats() {
  const [filter, setFilter] = useState('month');
  const [chartType, setChartType] = useState('bar');
  const [chartData, setChartData] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chartScrollRef = useRef(null);
  const topScrollRef = useRef(null);

  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/invoice/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filterType: filter })
        });
        
        if (!res.ok) throw new Error('Failed to fetch data');
        
        const result = await res.json();
        if (result.success) {
          const raw = result.data.reverse(); // chronological
          setChartData(raw);
          // extract years when periods are YYYY or YYYY-MM or YYYY-MM-DD
          const yrs = Array.from(new Set(raw.map(r => String(r.period || '').split('-')[0]).filter(Boolean))).map(Number).sort((a,b)=>b-a);
          if (yrs.length) {
            setYears(yrs);
            if (!yrs.includes(selectedYear)) setSelectedYear(yrs[0]);
          }
        } else {
          setChartData([]);
          setYears([]);
        }
      } catch (err) {
        setError('Failed to load chart data');
        setChartData([]);
        console.error('Chart data loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadChartData();
  }, [filter]);

  // Compute displayData depending on filter and selectedYear
  const displayData = useMemo(() => {
    if (filter === 'month') {
      // create 12 months for selectedYear
      const months = Array.from({ length: 12 }, (_, i) => {
        const mm = String(i+1).padStart(2, '0');
        const period = `${selectedYear}-${mm}`;
        const found = chartData.find(r => String(r.period) === period);
        return {
          period,
          label: new Date(selectedYear, i).toLocaleString('en-US', { month: 'short' }),
          total_sales: Number(found?.total_sales || 0),
          total_profit: Number(found?.total_profit || 0)
        };
      });
      return months;
    }
    return chartData.map(r => ({
      period: r.period,
      label: r.period,
      total_sales: Number(r.total_sales || 0),
      total_profit: Number(r.total_profit || 0)
    }));
  }, [chartData, filter, selectedYear]);

  // Find max for scaling on displayData
  const maxSales = Math.max(...displayData.map(d => d.total_sales || 0), 1);
  const maxProfit = Math.max(...displayData.map(d => d.total_profit || 0), 1);

  // Compute visible-window max (use last 7 days when viewing daily) so the recent days are scaled larger
  const VISIBLE_WINDOW = filter === 'day' ? 7 : displayData.length;
  const visibleSlice = displayData.slice(Math.max(0, displayData.length - VISIBLE_WINDOW));
  const maxSalesVisible = Math.max(...visibleSlice.map(d => d.total_sales || 0), 1);
  const maxProfitVisible = Math.max(...visibleSlice.map(d => d.total_profit || 0), 1);

  // Prepare line chart geometry
  const lineChart = useMemo(() => {
    const w = Math.max(640, displayData.length * 60);
    const h = 220;
    const padding = 28;
    const usableW = w - padding * 2;
    const usableH = h - padding * 2;
    const step = displayData.length > 1 ? usableW / (displayData.length - 1) : usableW;

    const salesPoints = displayData.map((d, i) => {
      const x = Math.round(padding + i * step);
      const y = Math.round(padding + (1 - (d.total_sales / (maxSales || 1))) * usableH);
      return `${x},${y}`;
    });

    const profitPoints = displayData.map((d, i) => {
      const x = Math.round(padding + i * step);
      const y = Math.round(padding + (1 - (d.total_profit / (maxProfit || 1))) * usableH);
      return `${x},${y}`;
    });

    return { w, h, padding, salesPoints, profitPoints, step };
  }, [displayData, maxSales, maxProfit]);

  const formatCurrency = (value) => {
    return isFinite(Number(value)) ? 
      Number(value).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 
      '0.00';
  };

  const formatPeriod = (period) => {
    if (filter === 'day') {
      return new Date(period).toLocaleDateString('en-LK', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else if (filter === 'month') {
      return new Date(period).toLocaleDateString('en-LK', { 
        year: 'numeric',
        month: 'short'
      });
    } else {
      return period;
    }
  };

  // per-bar slot width (px) used to compute inner chart width
  const BAR_SLOT = 60;

  // compute inner width for chart area
  const chartInnerWidth = Math.max(displayData.length * BAR_SLOT, 640);

  // keep top scrollbar and main scroll in sync
  useEffect(() => {
    const top = topScrollRef.current;
    const main = chartScrollRef.current;
    if (!top || !main) return;

    let syncing = false;
    const onTopScroll = () => {
      if (syncing) return;
      syncing = true;
      main.scrollLeft = top.scrollLeft;
      requestAnimationFrame(() => { syncing = false; });
    };
    const onMainScroll = () => {
      if (syncing) return;
      syncing = true;
      top.scrollLeft = main.scrollLeft;
      requestAnimationFrame(() => { syncing = false; });
    };

    top.addEventListener('scroll', onTopScroll);
    main.addEventListener('scroll', onMainScroll);

    return () => {
      top.removeEventListener('scroll', onTopScroll);
      main.removeEventListener('scroll', onMainScroll);
    };
  }, [displayData.length]);

  // auto-scroll to show the most recent 7 periods (zoomed) when viewing days
  useEffect(() => {
    const main = chartScrollRef.current;
    if (!main) return;
    // small timeout to allow layout
    setTimeout(() => {
      if (filter === 'day') {
        // show last 7 slots: scroll to end so latest days visible
        const desired = Math.max(0, chartInnerWidth - main.clientWidth);
        main.scrollLeft = desired;
        if (topScrollRef.current) topScrollRef.current.scrollLeft = desired;
      } else {
        // center recent data for other filters
        const desired = Math.max(0, chartInnerWidth - main.clientWidth);
        main.scrollLeft = desired;
        if (topScrollRef.current) topScrollRef.current.scrollLeft = desired;
      }
    }, 50);
  }, [filter, chartInnerWidth, displayData.length]);

  return (
    <div className="dashboard-stats">
      <div className="chart-section">
        <div className="chart-header">
          <div className="chart-title">
            <h3>Sales & Profit Analytics</h3>
            <p>Visualize your business performance over time</p>
          </div>
          <div className="chart-controls">
            <div className="control-group">
              <label>View:</label>
              <div className="filter-buttons">
                {FILTERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`filter-btn ${filter === f.value ? 'active' : ''}`}
                  >
                    <span className="icon">{f.icon}</span>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="control-group">
              <label>Chart:</label>
              <div className="chart-type-buttons">
                {CHART_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setChartType(type.value)}
                    className={`chart-type-btn ${chartType === type.value ? 'active' : ''}`}
                  >
                    <span className="icon">{type.icon}</span>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            {filter === 'month' && years.length > 0 && (
              <div className="control-group">
                <label>Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="year-selector"
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="chart-container">
          {loading ? (
            <div className="chart-loading">
              <div className="loading-spinner"></div>
              <p>Loading chart data...</p>
            </div>
          ) : error ? (
            <div className="chart-error">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="retry-btn">
                Retry
              </button>
            </div>
          ) : displayData.length === 0 ? (
            <div className="chart-empty">
              <div className="empty-icon">📊</div>
              <p>No data available for the selected period</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="chart-summary">
                <div className="summary-card">
                  <div className="summary-icon">💰</div>
                  <div className="summary-content">
                    <div className="summary-label">Total Sales</div>
                    <div className="summary-value">රු{formatCurrency(displayData.reduce((sum, item) => sum + (item.total_sales || 0), 0))}</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">💹</div>
                  <div className="summary-content">
                    <div className="summary-label">Total Profit</div>
                    <div className="summary-value positive">රු{formatCurrency(displayData.reduce((sum, item) => sum + (item.total_profit || 0), 0))}</div>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">📈</div>
                  <div className="summary-content">
                    <div className="summary-label">Avg. Sales</div>
                    <div className="summary-value">රු{formatCurrency(displayData.length > 0 ? displayData.reduce((sum, item) => sum + (item.total_sales || 0), 0) / displayData.length : 0)}</div>
                  </div>
                </div>
              </div>

              {/* Chart Visualization */}
              {/* Small top scrollbar to allow quick horizontal scrolling/zoom control */}
              <div ref={topScrollRef} className="chart-top-scroll" aria-hidden="true">
                <div style={{ width: chartInnerWidth + 'px', height: '1px' }}></div>
              </div>

              {/* Make chart area horizontally scrollable when many periods present */}
              <div className="chart-scroll-wrap" ref={chartScrollRef}>
                <div className={`chart-visualization ${chartType}`} style={{ minWidth: chartInnerWidth + 'px' }}>
                  {displayData.map((item, index) => (
                    <div key={item.period} className="chart-item">
                    {chartType === 'bar' ? (
                      <>
                        <div className="bars-container">
                          <div
                            className="bar sales-bar"
                            style={{
                              height: `${(item.total_sales / (maxSalesVisible || maxSales)) * 80}%`,
                              animationDelay: `${index * 0.05}s`
                            }}
                            title={`Sales: රු${formatCurrency(item.total_sales)}`}
                          >
                            <div className="bar-value">රු{formatCurrency(item.total_sales)}</div>
                          </div>
                          <div
                            className="bar profit-bar"
                            style={{
                              height: `${(item.total_profit / (maxProfitVisible || maxProfit)) * 80}%`,
                              animationDelay: `${index * 0.05 + 0.2}s`
                            }}
                            title={`Profit: රු${formatCurrency(item.total_profit)}`}
                          >
                            <div className="bar-value">රු{formatCurrency(item.total_profit)}</div>
                          </div>
                        </div>
                        <span className="period-label">{formatPeriod(item.period)}</span>
                      </>
                    ) : (
                      // Line chart implementation
                      <div className="line-chart">
                        <svg width={lineChart.w} height={lineChart.h} viewBox={`0 0 ${lineChart.w} ${lineChart.h}`} preserveAspectRatio="xMidYMid meet">
                          <defs>
                              <linearGradient id="salesGrad" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="var(--primary)" />
                                <stop offset="100%" stopColor="var(--primary-light)" />
                              </linearGradient>
                          </defs>
                          <polyline fill="none" stroke="var(--primary)" strokeWidth="2" points={lineChart.salesPoints.join(' ')} />
                          <polyline fill="none" stroke="var(--success)" strokeWidth="2" points={lineChart.profitPoints.join(' ')} />
                          {/* markers */}
                          {displayData.map((d, i) => {
                            const [sx, sy] = lineChart.salesPoints[i].split(',').map(Number);
                            const [px, py] = lineChart.profitPoints[i].split(',').map(Number);
                            return (
                              <g key={d.period}>
                                <circle cx={sx} cy={sy} r={3} fill="var(--primary)" />
                                <circle cx={px} cy={py} r={3} fill="var(--success)" />
                              </g>
                            );
                          })}
                        </svg>
                        <div className="period-row">
                          {displayData.map(d => (
                            <div key={d.period} className="period-cell">{formatPeriod(d.period)}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color sales"></div>
                  <span>Sales</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color profit"></div>
                  <span>Profit</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard-stats {
          margin-bottom: var(--spacing-xl);
        }

        .chart-section {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--border-radius);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-light);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-lg);
          gap: var(--spacing-lg);
        }

        .chart-title h3 {
          margin: 0 0 var(--spacing-xs) 0;
          color: var(--foreground);
          font-size: 1.3rem;
          font-weight: 700;
        }

        .chart-title p {
          margin: 0;
          color: var(--foreground);
          opacity: 0.7;
          font-size: 0.9rem;
        }

        .chart-controls {
          display: flex;
          gap: var(--spacing-lg);
          flex-wrap: wrap;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .control-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--foreground);
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-buttons,
        .chart-type-buttons {
          display: flex;
          gap: var(--spacing-xs);
          background: var(--background-secondary);
          padding: 4px;
          border-radius: var(--border-radius);
        }

        .filter-btn,
        .chart-type-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--foreground);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 0.85rem;
          white-space: nowrap;
        }

        .filter-btn.active,
        .chart-type-btn.active {
          background: var(--primary);
          color: white;
          box-shadow: var(--shadow-light);
        }

        .filter-btn:hover:not(.active),
        .chart-type-btn:hover:not(.active) {
          background: var(--background);
        }

        .icon {
          font-size: 0.9rem;
        }

        .chart-container {
          min-height: 400px;
        }

        .chart-loading,
        .chart-error,
        .chart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: var(--foreground);
          gap: var(--spacing-md);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top: 3px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .error-icon,
        .empty-icon {
          font-size: 3rem;
          opacity: 0.5;
        }

        .retry-btn {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--border-radius);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .retry-btn:hover {
          background: var(--primary-hover);
        }

        .chart-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: var(--background-secondary);
          border-radius: var(--border-radius);
          border-left: 4px solid var(--primary);
        }

        .summary-icon {
          font-size: 1.5rem;
          opacity: 0.8;
        }

        .summary-label {
          font-size: 0.8rem;
          color: var(--foreground);
          opacity: 0.7;
          margin-bottom: 2px;
        }

        .summary-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--foreground);
        }

        .summary-value.positive {
          color: var(--success);
        }

        .chart-visualization {
          display: flex;
          align-items: end;
          height: 250px;
          gap: var(--spacing-md);
          padding: var(--spacing-lg) 0;
          position: relative;
        }

        .chart-scroll-wrap {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          position: relative;
          padding-bottom: 8px; /* room for scrollbar */
        }

        .chart-top-scroll {
          width: 100%;
          height: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          margin-bottom: 8px;
        }

        .chart-top-scroll::-webkit-scrollbar { height: 8px; }
        .chart-top-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 8px; }

        /* hide native scrollbar in WebKit while keeping scroll functionality */
        .chart-scroll-wrap::-webkit-scrollbar { height: 10px; }
        .chart-scroll-wrap::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }

        /* left/right gradient indicators */
        .chart-scroll-wrap::before,
        .chart-scroll-wrap::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 8px;
          width: 36px;
          pointer-events: none;
          z-index: 5;
        }
        .chart-scroll-wrap::before { left: 0; background: linear-gradient(90deg, var(--background), transparent); }
        .chart-scroll-wrap::after { right: 0; background: linear-gradient(-90deg, var(--background), transparent); }

        .line-chart {
          width: 100%;
          overflow: auto;
        }

        .line-chart svg { display:block; }

        .period-row { display:flex; gap:8px; margin-top:8px; }
        .period-cell { min-width:60px; text-align:center; font-size:0.8rem; color:var(--foreground); }

        .chart-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          gap: var(--spacing-sm);
        }

        .bars-container {
          display: flex;
          gap: 4px;
          align-items: end;
          height: 100%;
          width: 100%;
          max-width: 60px;
        }

        .bar {
          flex: 1;
          border-radius: 4px 4px 0 0;
          transition: all var(--transition-fast);
          animation: growUp 0.8s ease-out both;
          position: relative;
          min-height: 4px;
        }

        .sales-bar {
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
        }

        .profit-bar {
          background: linear-gradient(135deg, var(--success), var(--success-light));
        }

        .bar-value {
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--foreground);
          opacity: 0;
          transition: opacity var(--transition-fast);
          white-space: nowrap;
        }

        .bar:hover .bar-value {
          opacity: 1;
        }

        .period-label {
          font-size: 0.75rem;
          color: var(--foreground);
          opacity: 0.7;
          text-align: center;
          font-weight: 500;
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: var(--spacing-lg);
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.8rem;
          color: var(--foreground);
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-color.sales {
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
        }

        .legend-color.profit {
          background: linear-gradient(135deg, var(--success), var(--success-light));
        }

        @keyframes growUp {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .chart-header {
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .chart-controls {
            width: 100%;
            justify-content: space-between;
          }

          .control-group {
            flex: 1;
          }

          .chart-visualization {
            height: 200px;
            gap: var(--spacing-sm);
          }

          .bars-container {
            max-width: 40px;
          }

          .bar-value {
            font-size: 0.6rem;
            top: -20px;
          }
        }

        @media (max-width: 480px) {
          .chart-section {
            padding: var(--spacing-md);
          }

          .chart-summary {
            grid-template-columns: 1fr;
          }

          .filter-buttons,
          .chart-type-buttons {
            flex-wrap: wrap;
          }

          .chart-visualization {
            height: 180px;
          }
        }
      `}</style>
    </div>
  );
}