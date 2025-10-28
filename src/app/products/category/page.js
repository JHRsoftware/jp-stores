'use client';
import { Suspense, lazy, useState, useEffect } from 'react';
import AuthWrapper from '../../components/AuthWrapper';
import FastPageLoader from '../../components/FastPageLoader';
import { usePerformance } from '../../utils/performance';
import { useTheme } from '../../theme-context';
import { 
  ThemeCard, 
  ThemeButton, 
  ThemeInput, 
  ThemeContainer,
  ThemeGrid,
  ThemeLoading 
} from '../../components/ThemeAware';

export default function CategoryPage() {
  const { theme } = useTheme();
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [editId, setEditId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { measureAsync } = usePerformance();

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
  // Categories will load only when the user presses the Load button below.

  const showMessage = (msg, type = 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const fetchCategories = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const res = await fetch('/api/products/category');
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch (error) {
      showMessage('Error fetching categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!categoryName.trim()) {
      showMessage('Please enter a category name');
      return;
    }

    try {
      const res = await fetch('/api/products/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: categoryName })
      });
      const data = await res.json();
      if (data.success) {
        setCategoryName('');
        showMessage('Category added successfully', 'success');
        fetchCategories(true);
      } else {
        showMessage(data.error || 'Error adding category');
      }
    } catch (error) {
      showMessage('Error adding category');
    }
  };

  const handleEditClick = (cat) => {
    setEditId(cat.id);
    setEditCategoryName(cat.category_name);
    setMessage('');
  };

  const handleEditSave = async (id) => {
    setMessage('');
    
    if (!editCategoryName.trim()) {
      showMessage('Please enter a category name');
      return;
    }

    try {
      const res = await fetch('/api/products/category', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, category_name: editCategoryName })
      });
      const data = await res.json();
      if (data.success) {
        setEditId(null);
        setEditCategoryName('');
        showMessage('Category updated successfully', 'success');
        fetchCategories(true);
      } else {
        showMessage(data.error || 'Error updating category');
      }
    } catch (error) {
      showMessage('Error updating category');
    }
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditCategoryName('');
    setMessage('');
  };

  const handleDelete = async (id) => {
    setMessage('');
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const res = await fetch('/api/products/category', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('Category deleted successfully', 'success');
        fetchCategories(true);
      } else {
        showMessage(data.error || 'Error deleting category');
      }
    } catch (error) {
      showMessage('Error deleting category');
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
        <ThemeContainer className="category-container" style={{ 
          animation: 'fadeIn 0.5s ease-out',
          maxWidth: '1200px'
        }}>
          {/* Header Section */}
          <div className="category-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
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
                  Manage your product categories
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
                  onClick={() => fetchCategories(true)}
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
          <ThemeGrid columns="1fr" gap="lg">
            {/* Add Category Card */}
            <ThemeCard 
              style={{
                background: theme?.colors.card,
                borderTop: `4px solid ${theme?.colors.success}`
              }}
            >
              <h3 style={{ 
                margin: '0 0 var(--spacing-lg) 0', 
                color: theme?.colors.primary, 
                fontSize: '1.5rem', 
                fontWeight: 600 
              }}>
                📁 Add New Category
              </h3>
              
              {message && (
                <MessageAlert message={message} type={messageType} />
              )}

              <form onSubmit={handleAdd}>
                <div style={{ 
                  display: 'flex', 
                  gap: 'var(--spacing-md)',
                  alignItems: 'flex-end'
                }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary 
                    }}>
                      Category Name *
                    </label>
                    <ThemeInput
                      type="text"
                      placeholder="e.g., Electronics, Clothing, Food & Beverages"
                      value={categoryName}
                      onChange={e => setCategoryName(e.target.value)}
                      required
                      style={{
                        fontSize: '1rem',
                        background: theme?.colors.background
                      }}
                    />
                  </div>

                  <ThemeButton 
                    type="submit"
                    variant="success"
                    style={{
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      fontWeight: 600,
                      fontSize: '1rem',
                      height: 'fit-content',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Add Category
                  </ThemeButton>
                </div>
              </form>
            </ThemeCard>

            {/* Categories List Card */}
            <ThemeCard 
              style={{
                background: theme?.colors.card,
                borderTop: `4px solid ${theme?.colors.primary}`
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ 
                    margin: 0, 
                    color: theme?.colors.primary, 
                    fontSize: '1.5rem', 
                    fontWeight: 600 
                  }}>
                    Categories List
                  </h3>
                  <style>{`\n                    @keyframes blinkHighlight {\n                      0%, 100% { box-shadow: 0 0 0 0 #ffeb3b; background: #1976d2; }\n                      50% { box-shadow: 0 0 12px 4px #ffeb3b; background: #ffeb3b; color: #222; }\n                    }\n                  `}</style>
                  <button
                    onClick={async () => {
                      setRefreshing(true);
                      try {
                        await fetchCategories(true);
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
                      cursor: refreshing ? 'not-allowed' : 'pointer',
                      animation: refreshing ? undefined : 'blinkHighlight 1.2s linear infinite'
                    }}
                  >
                    {refreshing ? 'Loading...' : 'Load'}
                  </button>
                </div>
                <div style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: theme?.colors.primaryLight,
                  color: theme?.colors.primary,
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}>
                  {categories.length} categories
                </div>
              </div>

              {categories.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--spacing-xl)', 
                  color: theme?.colors.foregroundSecondary,
                  background: theme?.colors.background,
                  borderRadius: 'var(--radius-lg)',
                  border: `2px dashed ${theme?.colors.border}`
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📁</div>
                  <div style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 600, 
                    marginBottom: 'var(--spacing-sm)',
                    color: theme?.colors.foreground 
                  }}>
                    No Categories Found
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>
                    Add your first category using the form above
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    background: theme?.colors.background,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{ background: theme?.colors.background }}>
                        <th style={{ 
                          padding: 'var(--spacing-md)', 
                          textAlign: 'left', 
                          fontWeight: 600, 
                          color: theme?.colors.foregroundSecondary, 
                          borderBottom: `2px solid ${theme?.colors.border}`,
                          fontSize: '0.875rem',
                          width: '100px'
                        }}>ID</th>
                        <th style={{ 
                          padding: 'var(--spacing-md)', 
                          textAlign: 'left', 
                          fontWeight: 600, 
                          color: theme?.colors.foregroundSecondary, 
                          borderBottom: `2px solid ${theme?.colors.border}`,
                          fontSize: '0.875rem'
                        }}>Category Name</th>
                        <th style={{ 
                          padding: 'var(--spacing-md)', 
                          textAlign: 'center', 
                          fontWeight: 600, 
                          color: theme?.colors.foregroundSecondary, 
                          borderBottom: `2px solid ${theme?.colors.border}`,
                          fontSize: '0.875rem',
                          width: '200px'
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(cat => (
                        <tr key={cat.id} style={{ 
                          borderBottom: `1px solid ${theme?.colors.border}`,
                          background: editId === cat.id ? theme?.colors.primaryLight : 'transparent',
                          transition: 'background-color 0.2s ease'
                        }}>
                          <td style={{ 
                            padding: 'var(--spacing-md)', 
                            color: theme?.colors.foregroundSecondary, 
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          }}>
                            #{cat.id}
                          </td>
                          
                          <td style={{ padding: 'var(--spacing-md)' }}>
                            {editId === cat.id ? (
                              <ThemeInput
                                type="text"
                                value={editCategoryName}
                                onChange={e => setEditCategoryName(e.target.value)}
                                required
                                style={{
                                  width: '100%',
                                  fontSize: '0.875rem',
                                  background: theme?.colors.background,
                                  border: `2px solid ${theme?.colors.primary}`
                                }}
                              />
                            ) : (
                              <span style={{ 
                                fontWeight: 600, 
                                color: theme?.colors.foreground,
                                fontSize: '0.9rem'
                              }}>
                                {cat.category_name}
                              </span>
                            )}
                          </td>
                          
                          <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                            {editId === cat.id ? (
                              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
                                <ThemeButton 
                                  onClick={() => handleEditSave(cat.id)}
                                  variant="success"
                                  style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  Save
                                </ThemeButton>
                                <ThemeButton 
                                  onClick={handleEditCancel}
                                  variant="secondary"
                                  style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  Cancel
                                </ThemeButton>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
                                <ThemeButton 
                                  onClick={() => handleEditClick(cat)}
                                  variant="primary"
                                  style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  Edit
                                </ThemeButton>
                                <ThemeButton 
                                  onClick={() => handleDelete(cat.id)}
                                  variant="error"
                                  style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    fontSize: '0.8rem'
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
            Category Management System • Total Categories: {categories.length}
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

            form > div {
              flex-direction: column !important;
              align-items: stretch !important;
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