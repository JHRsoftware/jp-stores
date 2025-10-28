'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import AuthWrapper from '../components/AuthWrapper';
import FastPageLoader from '../components/FastPageLoader';
import { usePerformance } from '../utils/performance';
import { useTheme } from '../theme-context';
import { 
  ThemeCard, 
  ThemeButton, 
  ThemeInput, 
  ThemeContainer,
  ThemeGrid,
  ThemeLoading 
} from '../components/ThemeAware';

// Lazy load heavy components for better performance
const DashboardStats = lazy(() => import('../components/DashboardStats'));
const QuickActions = lazy(() => import('../components/QuickActions'));
const RecentActivity = lazy(() => import('../components/RecentActivity'));

export default function Dashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    today: { sales: 0, profit: 0, orders: 0 },
    month: { sales: 0, profit: 0, orders: 0 },
    year: { sales: 0, profit: 0, orders: 0 },
    selected: { sales: 0, profit: 0, orders: 0 } // නව selected date stats
  });
  // Don't auto-load dashboard data; load only on user action
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default today
  const [allData, setAllData] = useState([]); // සියලු data store කරන්න
  const { measureAsync } = usePerformance();

  const loadDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Fetch all day-wise data for the last year
      const res = await fetch('/api/invoice/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filterType: 'day' })
      });
      const result = await res.json();
      
      if (result.success) {
          const data = result.data.map(row => {
            const period = String(row.period || '');
            const parts = period.split('-');
            const year = parts[0] ? Number(parts[0]) : null;
            // month in JS Date is 0-based; parts[1] is 'MM'
            const month = parts[1] ? Number(parts[1]) - 1 : null;
            const day = parts[2] ? Number(parts[2]) : null;
            return {
              ...row,
              period,
              year,
              month,
              day,
              total_sales: Number(row.total_sales) || 0,
              total_profit: Number(row.total_profit) || 0,
              order_count: Number(row.order_count) || 0
            };
          });

          setAllData(data); // සියලු data store කරන්න
          calculateStats(data, selectedDate);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data, currentSelectedDate) => {
    const now = new Date();
    
    // Today (match year, month, day)
    const today = data.find(row => 
      row.year === now.getFullYear() && 
      row.month === now.getMonth() && 
      row.day === now.getDate()
    ) || { total_sales: 0, total_profit: 0, order_count: 0 };

    // This month (match year and month)
    const month = data.filter(row => 
      row.year === now.getFullYear() && 
      row.month === now.getMonth()
    ).reduce((acc, row) => ({
      total_sales: acc.total_sales + (Number(row.total_sales) || 0),
      total_profit: acc.total_profit + (Number(row.total_profit) || 0),
      order_count: (acc.order_count || 0) + (Number(row.order_count) || 0)
    }), { total_sales: 0, total_profit: 0, order_count: 0 });

    // This year (match year)
    const year = data.filter(row => 
      row.year === now.getFullYear()
    ).reduce((acc, row) => ({
      total_sales: acc.total_sales + (Number(row.total_sales) || 0),
      total_profit: acc.total_profit + (Number(row.total_profit) || 0),
      order_count: (acc.order_count || 0) + (Number(row.order_count) || 0)
    }), { total_sales: 0, total_profit: 0, order_count: 0 });

    // Selected date stats
    const selected = data.find(row => 
      row.year === currentSelectedDate.getFullYear() && 
      row.month === currentSelectedDate.getMonth() && 
      row.day === currentSelectedDate.getDate()
    ) || { total_sales: 0, total_profit: 0, order_count: 0 };

    setStats({
      today: { 
        sales: today.total_sales || 0, 
        profit: today.total_profit || 0,
        orders: today.order_count || 0
      },
      month: { 
        sales: month.total_sales || 0, 
        profit: month.total_profit || 0,
        orders: month.order_count || 0
      },
      year: { 
        sales: year.total_sales || 0, 
        profit: year.total_profit || 0,
        orders: year.order_count || 0
      },
      selected: {
        sales: selected.total_sales || 0,
        profit: selected.total_profit || 0,
        orders: selected.order_count || 0
      }
    });
  };

  const handleDateChange = (event) => {
    const newDate = new Date(event.target.value);
    setSelectedDate(newDate);
    calculateStats(allData, newDate);
  };

  // NOTE: Dashboard data is not auto-loaded. Use the Load button to fetch data on demand.

  const formatCurrency = (value) => {
    return isFinite(Number(value)) ? 
      Number(value).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 
      '0.00';
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Stat card component with theme support
  const StatCard = ({ title, value, profit, orders, icon, variant = 'default' }) => (
    <ThemeCard 
      className={`stat-card ${variant}`}
      style={{
        background: theme?.colors.card,
        borderTop: `4px solid ${variant === 'today' ? '#ff6b6b' : 
                                variant === 'selected' ? '#00b894' :
                                variant === 'month' ? '#4834d4' :
                                variant === 'year' ? '#00d2d3' : theme?.colors.primary}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-md)'
      }}
    >
      <div className="stat-icon" style={{ fontSize: '2rem', opacity: 0.8 }}>
        {icon}
      </div>
      <div className="stat-content" style={{ flex: 1 }}>
        <h3 style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: theme?.colors.foregroundSecondary,
          marginBottom: 'var(--spacing-sm)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {title}
        </h3>
        <div style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: theme?.colors.primary,
          marginBottom: 'var(--spacing-md)',
          lineHeight: 1
        }}>
          රු{formatCurrency(value)}
        </div>
        <div className="stat-details">
          <div className="stat-detail flex-between" style={{ marginBottom: 'var(--spacing-xs)' }}>
            <span style={{ fontSize: '0.8rem', color: theme?.colors.foregroundSecondary }}>
              Profit:
            </span>
            <span style={{ 
              fontSize: '0.9rem', 
              fontWeight: 600,
              color: theme?.colors.success 
            }}>
              රු{formatCurrency(profit)}
            </span>
          </div>
          <div className="stat-detail flex-between">
            <span style={{ fontSize: '0.8rem', color: theme?.colors.foregroundSecondary }}>
              Orders:
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: theme?.colors.foreground }}>
              {orders}
            </span>
          </div>
        </div>
      </div>
    </ThemeCard>
  );

  return (
    <AuthWrapper>
      <FastPageLoader loading={loading}>
        <ThemeContainer className="dashboard-container" style={{ 
          animation: 'fadeIn 0.5s ease-out',
          maxWidth: '1400px'
        }}>
          {/* Header Section */}
          <div className="dashboard-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div className="header-content flex-between" style={{ gap: 'var(--spacing-lg)' }}>
              <div className="welcome-section">
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  marginBottom: 'var(--spacing-xs)',
                  backgroundImage: theme?.colors.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {getGreeting()}!
                </h1>
                <p style={{
                  color: theme?.colors.foregroundSecondary,
                  fontSize: '1.1rem'
                }}>
                  Here's your business overview
                </p>
              </div>
              <div className="header-controls flex" style={{ 
                alignItems: 'center', 
                gap: 'var(--spacing-md)' 
              }}>
                <div className="date-picker-container">
                  <label 
                    htmlFor="date-select" 
                    className="form-label"
                    style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}
                  >
                    Select Date:
                  </label>
                  <ThemeInput
                    id="date-select"
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={handleDateChange}
                    max={new Date().toISOString().split('T')[0]}
                    style={{ fontSize: '0.9rem', cursor: 'pointer' }}
                    disabled={loading || allData.length === 0}
                  />
                </div>
                <button
                  onClick={async () => {
                    setLoading(true);
                    await loadDashboardData(true);
                  }}
                  disabled={loading}
                  className="blink-highlight"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    whiteSpace: 'nowrap',
                    height: 'fit-content',
                    marginTop: '1.5rem',
                    padding: '10px 20px',
                    fontSize: '1rem',
                    background: loading ? '#9e9e9e' : '#1976d2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    animation: loading ? undefined : 'blinkHighlight 1.2s linear infinite',
                    fontWeight: 700
                  }}
                >
                  {loading ? 'Loading...' : 'Load'}
                </button>
              </div>
            </div>
          </div>

          {/* Only render dashboard content after data is loaded */}
          {allData.length > 0 && !loading && (
            <>
              {/* Selected Date Card */}
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <StatCard
                  title={formatDateForDisplay(selectedDate)}
                  value={stats.selected.sales}
                  profit={stats.selected.profit}
                  orders={stats.selected.orders}
                  icon="📅"
                  variant="selected"
                />
              </div>

              {/* Stats Grid */}
              <ThemeGrid 
                columns="repeat(auto-fit, minmax(280px, 1fr))" 
                gap="lg"
                style={{ marginBottom: 'var(--spacing-xl)' }}
              >
                <StatCard
                  title="Today's Performance"
                  value={stats.today.sales}
                  profit={stats.today.profit}
                  orders={stats.today.orders}
                  icon="📊"
                  variant="today"
                />

                <StatCard
                  title="This Month"
                  value={stats.month.sales}
                  profit={stats.month.profit}
                  orders={stats.month.orders}
                  icon="📅"
                  variant="month"
                />

                <StatCard
                  title="This Year"
                  value={stats.year.sales}
                  profit={stats.year.profit}
                  orders={stats.year.orders}
                  icon="🎯"
                  variant="year"
                />
              </ThemeGrid>

              {/* Quick Actions */}
              <Suspense fallback={<ThemeLoading text="Loading quick actions..." />}>
                <QuickActions />
              </Suspense>

              {/* Charts Section */}
              <Suspense fallback={<ThemeLoading text="Loading charts..." />}>
                <DashboardStats />
              </Suspense>

              {/* Recent Activity */}
              <Suspense fallback={<ThemeLoading text="Loading recent activity..." />}>
                <RecentActivity />
              </Suspense>
            </>
          )}
        </ThemeContainer>

        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes blinkHighlight {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(0,255,128,0);
              background: #1976d2;
              color: #fff;
              transform: translateY(0) scale(1);
            }
            50% {
              box-shadow: 0 0 18px 6px #00e676;
              background: linear-gradient(90deg, #00e676 0%, #1976d2 100%);
              color: #111;
              transform: translateY(-1px) scale(1.02);
            }
          }

          .blink-highlight {
            animation: blinkHighlight 1.2s linear infinite !important;
          }

          @media (max-width: 768px) {
            .header-content {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            
            .header-controls {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: var(--spacing-sm) !important;
            }
            
            .date-picker-container {
              order: -1;
            }
            
            .welcome-section h1 {
              font-size: 2rem !important;
            }
          }

          @media (max-width: 480px) {
            .welcome-section h1 {
              font-size: 1.75rem !important;
            }
          }
        `}</style>
      </FastPageLoader>
    </AuthWrapper>
  );
}