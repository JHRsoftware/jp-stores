'use client';
import { Suspense, lazy, useState, useEffect } from 'react';
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
import { useLoading } from '../loading-context';

export default function CustomerPage() {
  const { theme } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [vatNo, setVatNo] = useState('');
  const [svatNo, setSvatNo] = useState('');
  const [other, setOther] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [editId, setEditId] = useState(null);
  const [editCustomerCode, setEditCustomerCode] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editVatNo, setEditVatNo] = useState('');
  const [editSvatNo, setEditSvatNo] = useState('');
  const [editOther, setEditOther] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  // Don't auto-load on mount to keep page fast; load on user action
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { measureAsync } = usePerformance();
  const { setLoading: setGlobalLoading } = useLoading();

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

  // NOTE: customers will not auto-load on mount. Use the Load/Refresh button to fetch data on demand.

  const showMessage = (msg, type = 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const fetchCustomers = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) setCustomers(data.customers);
    } catch (error) {
      showMessage('Error fetching customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!customerCode.trim() || !customerName.trim()) {
      showMessage('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_code: customerCode,
          customer_name: customerName,
          address,
          contact_number: contactNumber,
          email,
          vat_no: vatNo,
          svat_no: svatNo,
          other
        })
      });
      const data = await res.json();
      if (data.success) {
        setCustomerCode('');
        setCustomerName('');
        setAddress('');
        setContactNumber('');
        setEmail('');
        setVatNo('');
        setSvatNo('');
        setOther('');
        showMessage('Customer added successfully', 'success');
        fetchCustomers(true);
      } else {
        showMessage(data.error || 'Error adding customer');
      }
    } catch (error) {
      showMessage('Error adding customer');
    }
  };

  const handleEditClick = (customer) => {
    setEditId(customer.id);
    setEditCustomerCode(customer.customer_code);
    setEditCustomerName(customer.customer_name);
    setEditAddress(customer.address);
    setEditContactNumber(customer.contact_number);
    setEditEmail(customer.email);
    setEditVatNo(customer.vat_no);
    setEditSvatNo(customer.svat_no);
    setEditOther(customer.other);
    setMessage('');
  };

  const handleEditSave = async (id) => {
    setMessage('');
    
    if (!editCustomerCode.trim() || !editCustomerName.trim()) {
      showMessage('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          customer_code: editCustomerCode,
          customer_name: editCustomerName,
          address: editAddress,
          contact_number: editContactNumber,
          email: editEmail,
          vat_no: editVatNo,
          svat_no: editSvatNo,
          other: editOther
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditId(null);
        setEditCustomerCode('');
        setEditCustomerName('');
        setEditAddress('');
        setEditContactNumber('');
        setEditEmail('');
        setEditVatNo('');
        setEditSvatNo('');
        setEditOther('');
        showMessage('Customer updated successfully', 'success');
        fetchCustomers(true);
      } else {
        showMessage(data.error || 'Error updating customer');
      }
    } catch (error) {
      showMessage('Error updating customer');
    }
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditCustomerCode('');
    setEditCustomerName('');
    setEditAddress('');
    setEditContactNumber('');
    setEditEmail('');
    setEditVatNo('');
    setEditSvatNo('');
    setEditOther('');
    setMessage('');
  };

  const handleDelete = async (id) => {
    setMessage('');
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const res = await fetch('/api/customers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('Customer deleted successfully', 'success');
        fetchCustomers(true);
      } else {
        showMessage(data.error || 'Error deleting customer');
      }
    } catch (error) {
      showMessage('Error deleting customer');
    }
  };

  // Filtered and paginated customers
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };
  
  const handlePageClick = (pageNum) => {
    setCurrentPage(pageNum);
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
        <ThemeContainer className="customer-container" style={{ 
          animation: 'fadeIn 0.5s ease-out',
          maxWidth: '1400px'
        }}>
          {/* Header Section */}
          <div className="customer-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
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
                  Manage your customer information
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
                  onClick={async () => {
                    setRefreshing(true);
                    setGlobalLoading(true);
                    try {
                      await fetchCustomers(true);
                    } finally {
                      setRefreshing(false);
                      setGlobalLoading(false);
                    }
                  }}
                  disabled={refreshing}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    whiteSpace: 'nowrap',
                    height: 'fit-content',
                    background: refreshing ? '#9e9e9e' : '#1976d2',
                    color: '#fff',
                    border: 'none',
                    cursor: refreshing ? 'not-allowed' : 'pointer',
                    animation: refreshing ? undefined : 'blinkHighlight 1.2s linear infinite'
                  }}
                >
                  <span className={refreshing ? 'spin' : ''}>↻</span>
                  {refreshing ? 'Loading...' : 'Load'}
                </ThemeButton>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <ThemeGrid columns="1fr" gap="lg">
            {/* Add Customer Card */}
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
                👥 Add New Customer
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
                      color: theme?.colors.foregroundSecondary 
                    }}>
                      Customer Code *
                    </label>
                    <ThemeInput
                      type="text"
                      placeholder="e.g., CUST001"
                      value={customerCode}
                      onChange={e => setCustomerCode(e.target.value)}
                      required
                      style={{
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary 
                    }}>
                      Customer Name *
                    </label>
                    <ThemeInput
                      type="text"
                      placeholder="Enter customer name"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      required
                      style={{
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary 
                    }}>
                      Address
                    </label>
                    <ThemeInput
                      type="text"
                      placeholder="Enter address"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      style={{
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary 
                    }}>
                      Contact Number
                    </label>
                    <ThemeInput
                      type="text"
                      placeholder="Enter contact number"
                      value={contactNumber}
                      onChange={e => setContactNumber(e.target.value)}
                      style={{
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </ThemeGrid>

                <ThemeButton 
                  type="submit"
                  variant="success"
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}
                >
                  Add Customer
                </ThemeButton>
              </form>
            </ThemeCard>

            {/* Customers List Card */}
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
                    Customers List
                  </h3>
                  <button
                    onClick={async () => {
                      setRefreshing(true);
                      setGlobalLoading(true);
                      try {
                        await fetchCustomers(true);
                      } finally {
                        setRefreshing(false);
                        setGlobalLoading(false);
                      }
                    }}
                    disabled={refreshing}
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.9rem',
                      background: refreshing ? '#9e9e9e' : '#1976d2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: refreshing ? 'not-allowed' : 'pointer',
                      animation: refreshing ? undefined : 'blinkHighlight 1.2s linear infinite',
                      marginLeft: 8
                    }}
                  >
                    {refreshing ? 'Loading...' : 'Load'}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <div style={{ 
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    background: theme?.colors.primaryLight,
                    color: theme?.colors.primary,
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}>
                    {filteredCustomers.length} customers
                  </div>
                  <ThemeInput
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    style={{
                      width: '220px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {filteredCustomers.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--spacing-xl)', 
                  color: theme?.colors.foregroundSecondary,
                  background: theme?.colors.background,
                  borderRadius: 'var(--radius-lg)',
                  border: `2px dashed ${theme?.colors.border}`
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>👥</div>
                  <div style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 600, 
                    marginBottom: 'var(--spacing-sm)',
                    color: theme?.colors.foreground 
                  }}>
                    No Customers Found
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>
                    {searchTerm ? 'Try adjusting your search terms' : 'Add your first customer using the form above'}
                  </div>
                </div>
              ) : (
                <>
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
                        <tr style={{ background: theme?.colors.background }}>
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
                            borderBottom: `2px solid ${theme?.colors.border}`,
                            width: '120px'
                          }}>Code</th>
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
                          }}>Address</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`,
                            width: '140px'
                          }}>Contact</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'center', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`,
                            width: '140px'
                          }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCustomers.map(customer => (
                          <tr key={customer.id} style={{ 
                            borderBottom: `1px solid ${theme?.colors.border}`,
                            background: editId === customer.id ? theme?.colors.primaryLight : 'transparent',
                            transition: 'background-color 0.2s ease'
                          }}>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              color: theme?.colors.foregroundSecondary, 
                              fontWeight: 500
                            }}>
                              #{customer.id}
                            </td>
                            
                            <td style={{ padding: 'var(--spacing-md)' }}>
                              {editId === customer.id ? (
                                <ThemeInput
                                  type="text"
                                  value={editCustomerCode}
                                  onChange={e => setEditCustomerCode(e.target.value)}
                                  required
                                  style={{
                                    width: '100%',
                                    fontSize: '0.8rem',
                                    padding: 'var(--spacing-sm)',
                                    border: `2px solid ${theme?.colors.primary}`
                                  }}
                                />
                              ) : (
                                <code style={{ 
                                  background: theme?.colors.background, 
                                  padding: '4px 8px', 
                                  borderRadius: '4px', 
                                  fontSize: '0.75rem', 
                                  fontWeight: 600,
                                  color: theme?.colors.primary
                                }}>
                                  {customer.customer_code}
                                </code>
                              )}
                            </td>
                            
                            <td style={{ padding: 'var(--spacing-md)', fontWeight: 600 }}>
                              {editId === customer.id ? (
                                <ThemeInput
                                  type="text"
                                  value={editCustomerName}
                                  onChange={e => setEditCustomerName(e.target.value)}
                                  required
                                  style={{
                                    width: '100%',
                                    fontSize: '0.8rem',
                                    padding: 'var(--spacing-sm)',
                                    border: `2px solid ${theme?.colors.primary}`
                                  }}
                                />
                              ) : (
                                <span style={{ color: theme?.colors.foreground }}>
                                  {customer.customer_name}
                                </span>
                              )}
                            </td>
                            
                            <td style={{ padding: 'var(--spacing-md)', color: theme?.colors.foregroundSecondary }}>
                              {editId === customer.id ? (
                                <ThemeInput
                                  type="text"
                                  value={editAddress}
                                  onChange={e => setEditAddress(e.target.value)}
                                  style={{
                                    width: '100%',
                                    fontSize: '0.8rem',
                                    padding: 'var(--spacing-sm)',
                                    border: `2px solid ${theme?.colors.primary}`
                                  }}
                                />
                              ) : (
                                customer.address || '-'
                              )}
                            </td>
                            
                            <td style={{ padding: 'var(--spacing-md)' }}>
                              {editId === customer.id ? (
                                <ThemeInput
                                  type="text"
                                  value={editContactNumber}
                                  onChange={e => setEditContactNumber(e.target.value)}
                                  style={{
                                    width: '100%',
                                    fontSize: '0.8rem',
                                    padding: 'var(--spacing-sm)',
                                    border: `2px solid ${theme?.colors.primary}`
                                  }}
                                />
                              ) : (
                                customer.contact_number || '-'
                              )}
                            </td>
                            
                            <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                              {editId === customer.id ? (
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
                                  <ThemeButton 
                                    onClick={() => handleEditSave(customer.id)}
                                    variant="success"
                                    style={{
                                      padding: 'var(--spacing-sm) var(--spacing-md)',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    Save
                                  </ThemeButton>
                                  <ThemeButton 
                                    onClick={handleEditCancel}
                                    variant="secondary"
                                    style={{
                                      padding: 'var(--spacing-sm) var(--spacing-md)',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    Cancel
                                  </ThemeButton>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
                                  <ThemeButton 
                                    onClick={() => handleEditClick(customer)}
                                    variant="primary"
                                    style={{
                                      padding: 'var(--spacing-sm) var(--spacing-md)',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    Edit
                                  </ThemeButton>
                                  <ThemeButton 
                                    onClick={() => handleDelete(customer.id)}
                                    variant="error"
                                    style={{
                                      padding: 'var(--spacing-sm) var(--spacing-md)',
                                      fontSize: '0.75rem'
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      marginTop: 'var(--spacing-lg)', 
                      gap: 'var(--spacing-sm)',
                      flexWrap: 'wrap'
                    }}>
                      <ThemeButton 
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        variant="secondary"
                        style={{
                          padding: 'var(--spacing-sm) var(--spacing-md)',
                          fontSize: '0.8rem'
                        }}
                      >
                        Previous
                      </ThemeButton>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <ThemeButton
                          key={num}
                          onClick={() => handlePageClick(num)}
                          variant={num === currentPage ? "primary" : "secondary"}
                          style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            fontSize: '0.8rem',
                            minWidth: '40px'
                          }}
                        >
                          {num}
                        </ThemeButton>
                      ))}
                      
                      <ThemeButton 
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        variant="secondary"
                        style={{
                          padding: 'var(--spacing-sm) var(--spacing-md)',
                          fontSize: '0.8rem'
                        }}
                      >
                        Next
                      </ThemeButton>
                    </div>
                  )}
                </>
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
            Customer Management System • Total Customers: {customers.length}
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

          @keyframes blinkHighlight {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(255,197,24,0);
              background: #1976d2;
              color: #fff;
              transform: translateY(0) scale(1);
            }
            50% {
              box-shadow: 0 0 18px 6px rgba(255,197,24,0.45);
              background: #ffd54a;
              color: #111;
              transform: translateY(-1px) scale(1.02);
            }
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

            table {
              font-size: 0.7rem !important;
            }

            th, td {
              padding: var(--spacing-sm) !important;
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