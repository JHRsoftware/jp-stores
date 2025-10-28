"use client";
import React from 'react';
import { Suspense, lazy, useEffect, useState, useRef } from 'react';
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
import { navbarPages } from '../navbar';

export default function ManageUserPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { measureAsync } = usePerformance();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessPages, setAccessPages] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [currentTime, setCurrentTime] = useState('');

  // Set current time
  useEffect(() => {
    const updateTime = () => {
      const t = new Date();
      setCurrentTime(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const showMessage = (msg, type = 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Fetch user details
  const fetchUser = async () => {
    if (!username.trim()) {
      showMessage('Please enter a username');
      return;
    }

    try {
      const res = await fetch('/api/user/getUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.success) {
        setPassword(data.user.password || '');
        setAccessPages(data.user.accessPages || []);
        showMessage('User loaded successfully', 'success');
      } else {
        showMessage('User not found');
        setPassword('');
        setAccessPages([]);
      }
    } catch (error) {
      showMessage('Error fetching user');
    }
  };

  // Update user details
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showMessage('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch('/api/user/updateUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, accessPages })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('User updated successfully', 'success');
      } else {
        showMessage(data.error || 'Error updating user');
      }
    } catch (error) {
      showMessage('Error updating user');
    }
  };

  // Add new user
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showMessage('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch('/api/user/addUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, accessPages })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('User added successfully', 'success');
        setUsername('');
        setPassword('');
        setAccessPages([]);
      } else {
        showMessage(data.error || 'Error adding user');
      }
    } catch (error) {
      showMessage('Error adding user');
    }
  };

  const handleCheckbox = (page) => {
    setAccessPages(prev =>
      prev.includes(page)
        ? prev.filter(p => p !== page)
        : [...prev, page]
    );
  };

  const selectAllPages = () => {
    setAccessPages(navbarPages.map(page => page.path));
  };

  const clearAllPages = () => {
    setAccessPages([]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Theme-aware message component
  const MessageAlert = ({ message, type }) => (
    <div
      style={{
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-lg)',
        background: type === 'success' ? theme?.colors.successLight : theme?.colors.errorLight,
        border: `1px solid ${type === 'success' ? theme?.colors.success : theme?.colors.error}`,
        color: type === 'success' ? theme?.colors.success : theme?.colors.error,
        fontWeight: 600,
        fontSize: '0.9rem'
      }}
    >
      {message}
    </div>
  );

  return (
    <AuthWrapper>
      <FastPageLoader loading={loading}>
        <ThemeContainer className="user-container" style={{ 
          animation: 'fadeIn 0.5s ease-out',
          maxWidth: '1400px'
        }}>
          {/* Header Section */}
          <div className="user-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
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
                  Add new users or manage existing user permissions and access levels
                </p>
              </div>
              <div className="header-controls flex" style={{ 
                alignItems: 'center', 
                gap: 'var(--spacing-md)' 
              }}>
                <div className="time-display" style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: theme?.colors.foregroundSecondary,
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    Current Time
                  </div>
                  <div style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 700,
                    color: theme?.colors.primary 
                  }}>
                    {currentTime}
                  </div>
                </div>
                <ThemeButton 
                  onClick={() => window.location.reload()}
                  disabled={refreshing}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    whiteSpace: 'nowrap',
                    height: 'fit-content'
                  }}
                >
                  <span className={refreshing ? 'spin' : ''}>↻</span>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </ThemeButton>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <ThemeGrid columns="1fr 1fr" gap="lg">
            {/* Left Column - User Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {/* User Information Card */}
              <ThemeCard 
                style={{
                  background: theme?.colors.card,
                  borderTop: `4px solid ${theme?.colors.primary}`
                }}
              >
                <h3 style={{ 
                  margin: '0 0 var(--spacing-lg) 0', 
                  color: theme?.colors.primary, 
                  fontSize: '1.5rem', 
                  fontWeight: 600 
                }}>
                  👥 User Information
                </h3>
                
                {message && (
                  <MessageAlert message={message} type={messageType} />
                )}

                <form>
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary,
                      fontSize: '0.85rem'
                    }}>
                      Username *
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <ThemeInput
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        style={{ 
                          flex: 1,
                          fontSize: '0.85rem'
                        }}
                      />
                      <ThemeButton 
                        type="button"
                        onClick={fetchUser}
                        variant="warning"
                        aria-pressed={false}
                        title="Load user details"
                        style={{
                          padding: 'calc(var(--spacing-md) + 2px) var(--spacing-lg)',
                          fontSize: '0.95rem',
                          whiteSpace: 'nowrap',
                          background: theme?.colors.primary,
                          color: theme?.colors.onPrimary || '#fff',
                          border: `2px solid ${theme?.colors.primaryDark || theme?.colors.primary}`,
                          boxShadow: `0 4px 8px ${theme?.colors.shadow || 'rgba(0,0,0,0.08)'}`,
                          fontWeight: 700
                        }}
                      >
                        Load User
                      </ThemeButton>
                    </div>
                  </div>

                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary,
                      fontSize: '0.85rem'
                    }}>
                      Password *
                    </label>
                    <ThemeInput
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                    <ThemeButton
                      type="button"
                      onClick={handleAdd}
                      variant="success"
                      style={{
                        flex: 1,
                        padding: 'var(--spacing-md)',
                        fontSize: '0.9rem'
                      }}
                    >
                      Add New User
                    </ThemeButton>
                    <ThemeButton
                      type="submit"
                      onClick={handleUpdate}
                      variant="primary"
                      style={{
                        flex: 1,
                        padding: 'var(--spacing-md)',
                        fontSize: '0.9rem'
                      }}
                    >
                      Update User
                    </ThemeButton>
                  </div>

                  <div style={{ 
                    marginTop: 'var(--spacing-md)', 
                    padding: 'var(--spacing-md)', 
                    background: theme?.colors.warningLight, 
                    borderRadius: 'var(--radius-md)', 
                    border: `1px solid ${theme?.colors.warning}` 
                  }}>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: theme?.colors.warning, 
                      fontWeight: 500,
                      textAlign: 'center'
                    }}>
                      <strong>Note:</strong> Passwords are stored securely and access permissions are enforced immediately
                    </div>
                  </div>
                </form>
              </ThemeCard>

              {/* Quick Actions Card */}
              <ThemeCard style={{
                background: theme?.colors.card,
                border: `2px solid ${theme?.colors.success}`
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: theme?.colors.success, 
                  fontSize: '1rem',
                  marginBottom: 'var(--spacing-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)'
                }}>
                  ⚡ Quick Actions
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  <ThemeButton 
                    onClick={() => {
                      setUsername('');
                      setPassword('');
                      setAccessPages([]);
                    }}
                    variant="secondary"
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    Clear Form
                  </ThemeButton>
                  
                  <ThemeButton 
                    onClick={selectAllPages}
                    variant="secondary"
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    Select All Pages
                  </ThemeButton>

                  <ThemeButton 
                    onClick={clearAllPages}
                    variant="secondary"
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    Clear All Pages
                  </ThemeButton>
                </div>
              </ThemeCard>
            </div>

            {/* Right Column - Access Permissions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {/* Access Permissions Card */}
              <ThemeCard 
                style={{
                  background: theme?.colors.card,
                  borderTop: `4px solid ${theme?.colors.info}`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-lg)' 
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    color: theme?.colors.info, 
                    fontSize: '1.5rem', 
                    fontWeight: 600 
                  }}>
                    Access Permissions
                  </h3>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <ThemeButton
                      type="button"
                      onClick={selectAllPages}
                      variant="success"
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        fontSize: '0.8rem'
                      }}
                    >
                      Select All
                    </ThemeButton>
                    <ThemeButton
                      type="button"
                      onClick={clearAllPages}
                      variant="error"
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        fontSize: '0.8rem'
                      }}
                    >
                      Clear All
                    </ThemeButton>
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: 'var(--spacing-sm)',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: 'var(--spacing-sm)'
                }}>
                  {navbarPages.map(page => (
                    <div
                      key={page.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: 'var(--spacing-md)',
                        background: accessPages.includes(page.path)
                          ? theme?.colors.primaryLight
                          : theme?.colors.background,
                        border: `2px solid ${accessPages.includes(page.path) ? theme?.colors.primary : theme?.colors.border}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => handleCheckbox(page.path)}
                      onMouseEnter={(e) => {
                        if (!accessPages.includes(page.path)) {
                          e.target.style.background = theme?.colors.backgroundSecondary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!accessPages.includes(page.path)) {
                          e.target.style.background = theme?.colors.background;
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={accessPages.includes(page.path)}
                        onChange={() => handleCheckbox(page.path)}
                        id={page.path}
                        style={{
                          marginRight: 'var(--spacing-md)',
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: theme?.colors.primary
                        }}
                      />
                      <label
                        htmlFor={page.path}
                        style={{
                          cursor: 'pointer',
                          fontWeight: '600',
                          color: accessPages.includes(page.path) ? theme?.colors.primary : theme?.colors.foreground,
                          flex: 1,
                          fontSize: '0.85rem'
                        }}
                      >
                        {page.name}
                      </label>
                    </div>
                  ))}
                </div>

                <div style={{ 
                  marginTop: 'var(--spacing-lg)', 
                  padding: 'var(--spacing-md)', 
                  background: theme?.colors.warningLight, 
                  borderRadius: 'var(--radius-md)', 
                  border: `1px solid ${theme?.colors.warning}` 
                }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: theme?.colors.warning, 
                    fontWeight: 500 
                  }}>
                    <strong>Note:</strong> Selected pages will be accessible to the user. Changes take effect immediately.
                  </div>
                </div>
              </ThemeCard>

              {/* Quick Stats Card */}
              <ThemeCard style={{
                background: theme?.colors.card,
                border: `2px solid ${theme?.colors.warning}`
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: theme?.colors.warning, 
                  fontSize: '1rem',
                  marginBottom: 'var(--spacing-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)'
                }}>
                  📊 Permission Summary
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 'var(--spacing-sm)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 'var(--spacing-sm)',
                    borderBottom: `1px dashed ${theme?.colors.border}`
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Pages</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.primary }}>
                      {navbarPages.length}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 'var(--spacing-sm)',
                    borderBottom: `1px dashed ${theme?.colors.border}`
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Selected Pages</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.success }}>
                      {accessPages.length}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 'var(--spacing-sm)'
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Access Level</span>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 700, 
                      color: accessPages.length === navbarPages.length ? theme?.colors.success : 
                            accessPages.length > 0 ? theme?.colors.warning : theme?.colors.error 
                    }}>
                      {accessPages.length === navbarPages.length ? 'Full Access' : 
                       accessPages.length > 0 ? 'Limited Access' : 'No Access'}
                    </span>
                  </div>
                </div>
              </ThemeCard>
            </div>
          </ThemeGrid>

          {/* Footer */}
          <div
            style={{
              marginTop: 'var(--spacing-xl)',
              padding: 'var(--spacing-lg)',
              textAlign: 'center',
              borderTop: `1px solid ${theme?.colors.border}`,
              color: theme?.colors.foregroundSecondary,
              fontSize: '0.875rem'
            }}
          >
            User Management System • Secure Access Control • {accessPages.length} of {navbarPages.length} pages selected
          </div>
        </ThemeContainer>

        <style jsx>{`
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

          .spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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
            
            .time-display {
              text-align: left !important;
            }
            
            .welcome-section h1 {
              font-size: 2rem !important;
            }

            .user-container > div:first-child {
              grid-template-columns: 1fr !important;
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