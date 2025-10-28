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

export default function QtyTypesPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { measureAsync } = usePerformance();

  const [qtyTypes, setQtyTypes] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
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

  // Removed automatic loading on mount to improve initial page load and memory usage.
  // Quantity types will load only when the user presses the Load button below.

  const showMessage = (msg, type = 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const fetchQtyTypes = async () => {
    try {
      const res = await fetch('/api/products/qtyTypes');
      const data = await res.json();
      if (data.success) setQtyTypes(data.qtyTypes);
    } catch (error) {
      showMessage('Error fetching quantity types');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!name.trim()) {
      showMessage('Please enter a quantity type name');
      return;
    }

    try {
      const res = await fetch('/api/products/qtyTypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        setDescription('');
        showMessage('Quantity type added successfully', 'success');
        fetchQtyTypes();
      } else {
        showMessage(data.error || 'Error adding quantity type');
      }
    } catch (error) {
      showMessage('Error adding quantity type');
    }
  };

  const handleEditClick = (qtyType) => {
    setEditId(qtyType.id);
    setEditName(qtyType.name);
    setEditDescription(qtyType.description);
    setMessage('');
  };

  const handleEditSave = async (id) => {
    setMessage('');
    
    if (!editName.trim()) {
      showMessage('Please enter a quantity type name');
      return;
    }

    try {
      const res = await fetch('/api/products/qtyTypes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName, description: editDescription })
      });
      const data = await res.json();
      if (data.success) {
        setEditId(null);
        setEditName('');
        setEditDescription('');
        showMessage('Quantity type updated successfully', 'success');
        fetchQtyTypes();
      } else {
        showMessage(data.error || 'Error updating quantity type');
      }
    } catch (error) {
      showMessage('Error updating quantity type');
    }
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditName('');
    setEditDescription('');
    setMessage('');
  };

  const handleDelete = async (id) => {
    setMessage('');
    if (!window.confirm('Are you sure you want to delete this quantity type?')) return;
    
    try {
      const res = await fetch('/api/products/qtyTypes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('Quantity type deleted successfully', 'success');
        fetchQtyTypes();
      } else {
        showMessage(data.error || 'Error deleting quantity type');
      }
    } catch (error) {
      showMessage('Error deleting quantity type');
    }
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
        <ThemeContainer className="qty-container" style={{ 
          animation: 'fadeIn 0.5s ease-out',
          maxWidth: '1400px'
        }}>
          {/* Header Section */}
          <div className="qty-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
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
                  Manage different quantity types and units for your inventory system
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
                  onClick={() => fetchQtyTypes()}
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
          <ThemeGrid columns="1fr 300px" gap="lg">
            {/* Left Column - Form and Qty Types List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {/* Add Quantity Type Card */}
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
                  ⚖️ Add New Quantity Type
                </h3>
                
                {message && (
                  <MessageAlert message={message} type={messageType} />
                )}

                <form onSubmit={handleAdd}>
                  <ThemeGrid columns="repeat(auto-fit, minmax(250px, 1fr))" gap="md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)', 
                        fontWeight: 600, 
                        color: theme?.colors.foregroundSecondary,
                        fontSize: '0.85rem'
                      }}>
                        Quantity Type Name *
                      </label>
                      <ThemeInput
                        type="text"
                        placeholder="e.g., Pieces, Kilograms, Liters, Meters"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ display: 'none' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)', 
                        fontWeight: 600, 
                        color: theme?.colors.foregroundSecondary,
                        fontSize: '0.85rem'
                      }}>
                        Description
                      </label>
                      <ThemeInput
                        type="text"
                        placeholder="e.g., Unit of measurement for items"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </ThemeGrid>

                  <ThemeButton 
                    type="submit"
                    variant="success"
                    style={{
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      fontSize: '0.9rem'
                    }}
                  >
                    Add Quantity Type
                  </ThemeButton>
                </form>
              </ThemeCard>

              {/* Quantity Types List Card */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <style>{`\n                      @keyframes blinkHighlight {\n                        0%, 100% { box-shadow: 0 0 0 0 #ffeb3b; background: #1976d2; }\n                        50% { box-shadow: 0 0 12px 4px #ffeb3b; background: #ffeb3b; color: #222; }\n                      }\n                    `}</style>
                    <h3 style={{ 
                      margin: 0, 
                      color: theme?.colors.info, 
                      fontSize: '1.5rem', 
                      fontWeight: 600 
                    }}>
                      Quantity Types List ({qtyTypes.length})
                    </h3>
                    <button
                      onClick={async () => {
                        setRefreshing(true);
                        try {
                          await fetchQtyTypes();
                        } finally {
                          setRefreshing(false);
                        }
                      }}
                      disabled={refreshing}
                      style={{
                        padding: '6px 10px',
                        fontSize: '0.9rem',
                        background: refreshing ? '#aaa' : '#1976d2',
                        color: refreshing ? '#fff' : undefined,
                        border: 'none',
                        borderRadius: 4,
                        cursor: refreshing ? 'not-allowed' : 'pointer'
                        ,animation: refreshing ? undefined : 'blinkHighlight 1.2s linear infinite'
                      }}
                    >
                      {refreshing ? 'Loading...' : 'Load'}
                    </button>
                  </div>
                </div>

                {qtyTypes.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--spacing-xl)', 
                    color: theme?.colors.foregroundSecondary,
                    background: theme?.colors.background,
                    borderRadius: 'var(--radius-lg)',
                    border: `2px dashed ${theme?.colors.border}`
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>⚖️</div>
                    <div style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 600, 
                      marginBottom: 'var(--spacing-sm)',
                      color: theme?.colors.foreground 
                    }}>
                      No Quantity Types Found
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                      Add your first quantity type using the form above
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      background: theme?.colors.background,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      fontSize: '0.8rem'
                    }}>
                      <thead>
                        <tr style={{ background: theme?.colors.backgroundSecondary }}>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`,
                            width: '80px'
                          }}>ID</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Name</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Description</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'center', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`,
                            width: '180px'
                          }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qtyTypes.map(qtyType => (
                          <tr key={qtyType.id} style={{ 
                            borderBottom: `1px solid ${theme?.colors.border}`,
                            background: editId === qtyType.id ? theme?.colors.primaryLight : 'transparent'
                          }}>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              color: theme?.colors.foregroundSecondary, 
                              fontWeight: 500 
                            }}>
                              #{qtyType.id}
                            </td>
                            <td style={{ padding: 'var(--spacing-md)', fontWeight: '600' }}>
                              {editId === qtyType.id ? (
                                <ThemeInput
                                  type="text"
                                  value={editName}
                                  onChange={e => setEditName(e.target.value)}
                                  required
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '6px'
                                  }}
                                />
                              ) : (
                                <span style={{ color: theme?.colors.primary }}>
                                  {qtyType.name}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: 'var(--spacing-md)' }}>
                              {editId === qtyType.id ? (
                                <ThemeInput
                                  type="text"
                                  value={editDescription}
                                  onChange={e => setEditDescription(e.target.value)}
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '6px'
                                  }}
                                />
                              ) : (
                                <span style={{
                                  color: theme?.colors.foregroundSecondary,
                                  fontStyle: qtyType.description ? 'normal' : 'italic'
                                }}>
                                  {qtyType.description || 'No description'}
                                </span>
                              )}
                            </td>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              textAlign: 'center',
                              display: 'flex', 
                              justifyContent: 'center', 
                              gap: 'var(--spacing-xs)' 
                            }}>
                              {editId === qtyType.id ? (
                                <>
                                  <ThemeButton 
                                    onClick={() => handleEditSave(qtyType.id)}
                                    variant="success"
                                    style={{
                                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    Save
                                  </ThemeButton>
                                  <ThemeButton 
                                    onClick={handleEditCancel}
                                    variant="secondary"
                                    style={{
                                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    Cancel
                                  </ThemeButton>
                                </>
                              ) : (
                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'center' }}>
                                  <ThemeButton 
                                    onClick={() => handleEditClick(qtyType)}
                                    variant="primary"
                                    style={{
                                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    Edit
                                  </ThemeButton>
                                  <ThemeButton
                                    onClick={() => handleDelete(qtyType.id)}
                                    variant="error"
                                    style={{
                                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    Delete
                                  </ThemeButton>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ThemeCard>
            </div>

            {/* Right Column - Info Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {/* Quick Stats Card */}
              <ThemeCard style={{
                background: theme?.colors.card,
                border: `2px solid ${theme?.colors.primary}`
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: theme?.colors.primary, 
                  fontSize: '1rem',
                  marginBottom: 'var(--spacing-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)'
                }}>
                  📊 Quick Stats
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
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Types</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.primary }}>
                      {qtyTypes.length}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 'var(--spacing-sm)',
                    borderBottom: `1px dashed ${theme?.colors.border}`
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Edit Mode</span>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 700, 
                      color: editId ? theme?.colors.warning : theme?.colors.success 
                    }}>
                      {editId ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 'var(--spacing-sm)'
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Last Updated</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.info }}>
                      Just now
                    </span>
                  </div>
                </div>
              </ThemeCard>

              {/* Common Quantity Types Card */}
              <ThemeCard style={{
                background: theme?.colors.card,
                border: `2px solid ${theme?.colors.info}`
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: theme?.colors.info, 
                  fontSize: '1rem',
                  marginBottom: 'var(--spacing-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)'
                }}>
                  📋 Common Types
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 'var(--spacing-sm)'
                }}>
                  {['Pieces', 'Kilograms', 'Liters', 'Meters', 'Boxes', 'Packets'].map(type => (
                    <div
                      key={type}
                      style={{
                        padding: 'var(--spacing-sm)',
                        background: theme?.colors.background,
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${theme?.colors.border}`,
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: theme?.colors.foreground,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setName(type)}
                      onMouseEnter={(e) => {
                        e.target.style.background = theme?.colors.primaryLight;
                        e.target.style.borderColor = theme?.colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = theme?.colors.background;
                        e.target.style.borderColor = theme?.colors.border;
                      }}
                    >
                      {type}
                    </div>
                  ))}
                </div>
                
                <div style={{ 
                  marginTop: 'var(--spacing-md)', 
                  fontSize: '0.7rem', 
                  color: theme?.colors.foregroundSecondary,
                  padding: 'var(--spacing-sm)',
                  background: theme?.colors.background,
                  borderRadius: 'var(--radius-sm)'
                }}>
                  💡 Click to quickly add common quantity types
                </div>
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
                      setName('');
                      setDescription('');
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
                    onClick={() => {
                      setName('Pieces');
                      setDescription('Individual items counted as units');
                    }}
                    variant="secondary"
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    Add Sample Type
                  </ThemeButton>

                  <ThemeButton 
                    onClick={fetchQtyTypes}
                    variant="secondary"
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    Refresh List
                  </ThemeButton>
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
            Quantity Types Management System • Total Types: {qtyTypes.length}
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

            .qty-container > div:first-child {
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