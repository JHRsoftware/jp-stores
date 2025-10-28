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
import { useLoading } from '../loading-context';

export default function SupplierPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { measureAsync } = usePerformance();
  const { setLoading: setGlobalLoading } = useLoading();

  const [name, setName] = useState('');
  const nameInputRef = useRef(null);
  const [address, setAddress] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [suppliers, setSuppliers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editSupplierCode, setEditSupplierCode] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRemark, setEditRemark] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [user, setUser] = useState(null);

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  // Refs
  const searchInputRef = useRef(null);

  // Set current time and get user
  useEffect(() => {
    const updateTime = () => {
      const t = new Date();
      setCurrentTime(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Get user from localStorage
    try {
      const userData = typeof window !== 'undefined' && localStorage.getItem('user') 
        ? JSON.parse(localStorage.getItem('user')) 
        : null;
      setUser(userData);
    } catch (err) {
      console.warn('Error getting user data:', err);
    }

    return () => clearInterval(interval);
  }, []);

  // NOTE: suppliers will not auto-load on mount to improve initial page load.
  // Load data only when the user presses the Load / Refresh button.

  // Global keydown listener for 'c' key and Ctrl+F for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'c' || e.key === 'C') && e.ctrlKey) {
        e.preventDefault();
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
      }
      // Add Ctrl+F for search focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showMessage = (msg, type = 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/supplier/getSuppliers', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.suppliers)) {
        setSuppliers([...data.suppliers]); // force new array reference
      } else {
        showMessage('Error fetching suppliers');
      }
    } catch (error) {
      showMessage('Error fetching suppliers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!name.trim()) {
      showMessage('Supplier name is required');
      return;
    }

    const created_by = user?.username || '';
    
    try {
      const res = await fetch('/api/supplier/addSupplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          created_by,
          supplier_code: supplierCode,
          contact_number: contactNumber,
          email,
          remark
        })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('Supplier added successfully!', 'success');
        setName('');
        setAddress('');
        setSupplierCode('');
        setContactNumber('');
        setEmail('');
        setRemark('');
        fetchSuppliers();
        // Reset to first page after adding new supplier
        setCurrentPage(1);
      } else {
        showMessage(data.error || 'Error adding supplier');
      }
    } catch (error) {
      showMessage('Error adding supplier');
    }
  };

  // Edit supplier handlers
  const handleEditClick = (supplier) => {
    setEditId(supplier.id);
    setEditName(supplier.name);
    setEditAddress(supplier.address);
    setEditSupplierCode(supplier.supplier_code);
    setEditContactNumber(supplier.contact_number);
    setEditEmail(supplier.email);
    setEditRemark(supplier.remark);
    setMessage('');
  };

  const handleEditSave = async (id) => {
    setMessage('');
    
    if (!editName.trim()) {
      showMessage('Supplier name is required');
      return;
    }

    try {
      const res = await fetch('/api/supplier/updateSupplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: editName,
          address: editAddress,
          supplier_code: editSupplierCode,
          contact_number: editContactNumber,
          email: editEmail,
          remark: editRemark
        })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('Supplier updated successfully!', 'success');
        setEditId(null);
        setEditName('');
        setEditAddress('');
        setEditSupplierCode('');
        setEditContactNumber('');
        setEditEmail('');
        setEditRemark('');
        fetchSuppliers();
      } else {
        showMessage(data.error || 'Error updating supplier');
      }
    } catch (error) {
      showMessage('Error updating supplier');
    }
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditName('');
    setEditAddress('');
    setEditSupplierCode('');
    setEditContactNumber('');
    setEditEmail('');
    setEditRemark('');
    setMessage('');
  };

  // Delete supplier handler
  const handleDelete = async (id) => {
    setMessage('');
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      const res = await fetch('/api/supplier/deleteSupplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('Supplier deleted successfully!', 'success');
        fetchSuppliers();
      } else {
        showMessage(data.error || 'Error deleting supplier');
      }
    } catch (error) {
      showMessage('Error deleting supplier');
    }
  };

  // Search and Pagination functions
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.supplier_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.remark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort suppliers
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle numeric fields
    if (sortField === 'id') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }
    
    // Handle string fields
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate suppliers
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSuppliers = sortedSuppliers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedSuppliers.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    buttons.push(
      <ThemeButton
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="secondary"
        style={{
          padding: '8px 12px',
          fontSize: '14px'
        }}
      >
        ← Prev
      </ThemeButton>
    );

    // First page
    if (startPage > 1) {
      buttons.push(
        <ThemeButton
          key={1}
          onClick={() => handlePageChange(1)}
          variant="secondary"
          style={{
            padding: '8px 12px',
            fontSize: '14px'
          }}
        >
          1
        </ThemeButton>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" style={{ padding: '8px 4px', color: theme?.colors.foregroundSecondary }}>
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <ThemeButton
          key={i}
          onClick={() => handlePageChange(i)}
          variant={currentPage === i ? "primary" : "secondary"}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            fontWeight: currentPage === i ? '600' : '400'
          }}
        >
          {i}
        </ThemeButton>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" style={{ padding: '8px 4px', color: theme?.colors.foregroundSecondary }}>
            ...
          </span>
        );
      }
      buttons.push(
        <ThemeButton
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          variant="secondary"
          style={{
            padding: '8px 12px',
            fontSize: '14px'
          }}
        >
          {totalPages}
        </ThemeButton>
      );
    }

    // Next button
    buttons.push(
      <ThemeButton
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="secondary"
        style={{
          padding: '8px 12px',
          fontSize: '14px'
        }}
      >
        Next →
      </ThemeButton>
    );

    return buttons;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ marginLeft: '4px', opacity: 0.3 }}>↕️</span>;
    return <span style={{ marginLeft: '4px' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
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
        <ThemeContainer className="supplier-container" style={{ 
          animation: 'fadeIn 0.5s ease-out',
          maxWidth: '1400px'
        }}>
          {/* Header Section */}
          <div className="supplier-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
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
                  Add new suppliers or manage existing supplier information
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
                      await fetchSuppliers();
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
          <ThemeGrid columns="1fr 300px" gap="lg">
            {/* Left Column - Form and Supplier List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {/* Add Supplier Form Card */}
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
                  🏢 Add New Supplier
                </h3>
                
                {message && (
                  <MessageAlert message={message} type={messageType} />
                )}

                <form onSubmit={handleSubmit}>
                  <ThemeGrid columns="repeat(auto-fit, minmax(250px, 1fr))" gap="md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)', 
                        fontWeight: 600, 
                        color: theme?.colors.foregroundSecondary,
                        fontSize: '0.85rem'
                      }}>
                        Supplier Name *
                      </label>
                      <ThemeInput
                        ref={nameInputRef}
                        type="text"
                        placeholder="Enter supplier name"
                        value={name ?? ''}
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
                        Address
                      </label>
                      <ThemeInput
                        type="text"
                        placeholder="Enter address"
                        value={address ?? ''}
                        onChange={e => setAddress(e.target.value)}
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
                        Supplier Code
                      </label>
                      <ThemeInput
                        type="text"
                        placeholder="Enter supplier code"
                        value={supplierCode ?? ''}
                        onChange={e => setSupplierCode(e.target.value)}
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
                        Contact Number
                      </label>
                      <ThemeInput
                        type="text"
                        placeholder="Enter contact number"
                        value={contactNumber ?? ''}
                        onChange={e => setContactNumber(e.target.value)}
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
                        Email
                      </label>
                      <ThemeInput
                        type="email"
                        placeholder="Enter email address"
                        value={email ?? ''}
                        onChange={e => setEmail(e.target.value)}
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
                        Remark
                      </label>
                      <ThemeInput
                        type="text"
                        placeholder="Enter remark (optional)"
                        value={remark ?? ''}
                        onChange={e => setRemark(e.target.value)}
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
                    Add Supplier
                  </ThemeButton>
                  <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.75rem', color: theme?.colors.foregroundSecondary }}>
                    💡 <strong>Quick Tip:</strong> Press <kbd style={{ 
                      background: theme?.colors.backgroundSecondary, 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem',
                      border: `1px solid ${theme?.colors.border}`
                    }}>Ctrl + C</kbd> to quickly focus on supplier name field
                  </div>
                </form>
              </ThemeCard>

              {/* Supplier List Card */}
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
                    <h3 style={{ 
                      margin: 0, 
                      color: theme?.colors.info, 
                      fontSize: '1.5rem', 
                      fontWeight: 600 
                    }}>
                      Supplier List ({filteredSuppliers.length})
                      {searchTerm && (
                        <span style={{ fontSize: '14px', color: theme?.colors.foregroundSecondary, fontWeight: 'normal', marginLeft: '8px' }}>
                          (Filtered from {suppliers.length} total)
                        </span>
                      )}
                    </h3>
                    <button
                      onClick={async () => {
                          setRefreshing(true);
                          setGlobalLoading(true);
                          try {
                            await fetchSuppliers();
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
                  
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search Box */}
                    <div style={{ position: 'relative' }}>
                      <ThemeInput
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search suppliers..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        style={{
                          padding: '10px 40px 10px 12px',
                          width: '250px',
                          fontSize: '0.85rem'
                        }}
                      />
                      <div style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        color: theme?.colors.foregroundSecondary 
                      }}>
                        🔍
                      </div>
                    </div>

                    {/* Items per page selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ 
                        fontSize: '14px', 
                        color: theme?.colors.foregroundSecondary, 
                        fontWeight: '500' 
                      }}>
                        Show:
                      </label>
                      <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${theme?.colors.border}`,
                          fontSize: '14px',
                          background: theme?.colors.background,
                          color: theme?.colors.foreground
                        }}
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>
                </div>

                {filteredSuppliers.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--spacing-xl)', 
                    color: theme?.colors.foregroundSecondary,
                    background: theme?.colors.background,
                    borderRadius: 'var(--radius-lg)',
                    border: `2px dashed ${theme?.colors.border}`
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🏢</div>
                    <div style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 600, 
                      marginBottom: 'var(--spacing-sm)',
                      color: theme?.colors.foreground 
                    }}>
                      {searchTerm ? 'No matching suppliers found' : 'No Suppliers Found'}
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                      {searchTerm ? 'Try adjusting your search terms' : 'Add your first supplier using the form above'}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: 'auto', marginBottom: 'var(--spacing-lg)' }}>
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
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none',
                                minWidth: '60px'
                              }}
                              onClick={() => handleSort('id')}
                            >
                              ID <SortIcon field="id" />
                            </th>
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none',
                                minWidth: '150px'
                              }}
                              onClick={() => handleSort('name')}
                            >
                              Name <SortIcon field="name" />
                            </th>
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none',
                                minWidth: '120px'
                              }}
                              onClick={() => handleSort('address')}
                            >
                              Address <SortIcon field="address" />
                            </th>
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none',
                                minWidth: '100px'
                              }}
                              onClick={() => handleSort('supplier_code')}
                            >
                              Code <SortIcon field="supplier_code" />
                            </th>
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none',
                                minWidth: '120px'
                              }}
                              onClick={() => handleSort('contact_number')}
                            >
                              Contact <SortIcon field="contact_number" />
                            </th>
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none',
                                minWidth: '150px'
                              }}
                              onClick={() => handleSort('email')}
                            >
                              Email <SortIcon field="email" />
                            </th>
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none',
                                minWidth: '120px'
                              }}
                              onClick={() => handleSort('remark')}
                            >
                              Remark <SortIcon field="remark" />
                            </th>
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none',
                                minWidth: '100px'
                              }}
                              onClick={() => handleSort('created_by')}
                            >
                              Added By <SortIcon field="created_by" />
                            </th>
                            <th style={{ 
                              padding: 'var(--spacing-md)', 
                              textAlign: 'center', 
                              fontWeight: 600, 
                              color: theme?.colors.foregroundSecondary, 
                              borderBottom: `2px solid ${theme?.colors.border}`, 
                              width: '140px',
                              minWidth: '140px'
                            }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentSuppliers.map(supplier => (
                            <tr key={supplier.id} style={{ 
                              borderBottom: `1px solid ${theme?.colors.border}`,
                              background: editId === supplier.id ? theme?.colors.primaryLight : 'transparent'
                            }}>
                              <td style={{ 
                                padding: 'var(--spacing-md)', 
                                color: theme?.colors.foregroundSecondary, 
                                fontWeight: 500 
                              }}>
                                #{supplier.id}
                              </td>
                              
                              <td style={{ padding: 'var(--spacing-md)' }}>
                                {editId === supplier.id ? (
                                  <ThemeInput
                                    type="text"
                                    value={editName ?? ''}
                                    onChange={e => setEditName(e.target.value)}
                                    required
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '6px'
                                    }}
                                  />
                                ) : (
                                  <span style={{ 
                                    fontWeight: '600',
                                    color: theme?.colors.primary
                                  }}>
                                    {supplier.name}
                                  </span>
                                )}
                              </td>
                              
                              <td style={{ padding: 'var(--spacing-md)' }}>
                                {editId === supplier.id ? (
                                  <ThemeInput
                                    type="text"
                                    value={editAddress ?? ''}
                                    onChange={e => setEditAddress(e.target.value)}
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '6px'
                                    }}
                                  />
                                ) : (
                                  <span style={{
                                    background: theme?.colors.backgroundSecondary,
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem'
                                  }}>
                                    {supplier.address || '-'}
                                  </span>
                                )}
                              </td>
                              
                              <td style={{ padding: 'var(--spacing-md)' }}>
                                {editId === supplier.id ? (
                                  <ThemeInput
                                    type="text"
                                    value={editSupplierCode ?? ''}
                                    onChange={e => setEditSupplierCode(e.target.value)}
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '6px'
                                    }}
                                  />
                                ) : (
                                  <code style={{ 
                                    background: theme?.colors.infoLight, 
                                    color: theme?.colors.info,
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    fontFamily: 'monospace'
                                  }}>
                                    {supplier.supplier_code || '-'}
                                  </code>
                                )}
                              </td>
                              
                              <td style={{ padding: 'var(--spacing-md)' }}>
                                {editId === supplier.id ? (
                                  <ThemeInput
                                    type="text"
                                    value={editContactNumber ?? ''}
                                    onChange={e => setEditContactNumber(e.target.value)}
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '6px'
                                    }}
                                  />
                                ) : (
                                  supplier.contact_number ? (
                                    <a 
                                      href={`tel:${supplier.contact_number}`}
                                      style={{
                                        color: theme?.colors.success,
                                        textDecoration: 'none',
                                        fontWeight: '500',
                                        background: theme?.colors.successLight,
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem'
                                      }}
                                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                    >
                                      📞 {supplier.contact_number}
                                    </a>
                                  ) : '-'
                                )}
                              </td>
                              
                              <td style={{ padding: 'var(--spacing-md)' }}>
                                {editId === supplier.id ? (
                                  <ThemeInput
                                    type="email"
                                    value={editEmail ?? ''}
                                    onChange={e => setEditEmail(e.target.value)}
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '6px'
                                    }}
                                  />
                                ) : (
                                  supplier.email ? (
                                    <a 
                                      href={`mailto:${supplier.email}`}
                                      style={{
                                        color: theme?.colors.secondary,
                                        textDecoration: 'none',
                                        fontSize: '0.7rem',
                                        background: theme?.colors.secondaryLight,
                                        padding: '4px 8px',
                                        borderRadius: '4px'
                                      }}
                                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                    >
                                      ✉️ {supplier.email}
                                    </a>
                                  ) : '-'
                                )}
                              </td>
                              
                              <td style={{ padding: 'var(--spacing-md)' }}>
                                {editId === supplier.id ? (
                                  <ThemeInput
                                    type="text"
                                    value={editRemark ?? ''}
                                    onChange={e => setEditRemark(e.target.value)}
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '6px'
                                    }}
                                  />
                                ) : (
                                  <span style={{
                                    color: theme?.colors.foregroundSecondary,
                                    fontSize: '0.7rem',
                                    fontStyle: supplier.remark ? 'normal' : 'italic'
                                  }}>
                                    {supplier.remark || 'No remark'}
                                  </span>
                                )}
                              </td>
                              
                              <td style={{ 
                                padding: 'var(--spacing-md)', 
                                color: theme?.colors.foregroundSecondary, 
                                fontSize: '0.7rem' 
                              }}>
                                <span style={{
                                  background: theme?.colors.warningLight,
                                  color: theme?.colors.warning,
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontWeight: '500'
                                }}>
                                  {supplier.created_by}
                                </span>
                              </td>
                              
                              <td style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'center',
                                display: 'flex', 
                                justifyContent: 'center', 
                                gap: 'var(--spacing-xs)' 
                              }}>
                                {editId === supplier.id ? (
                                  <>
                                    <ThemeButton 
                                      onClick={() => handleEditSave(supplier.id)}
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
                                      onClick={() => handleEditClick(supplier)}
                                      variant="primary"
                                      style={{
                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                        fontSize: '0.7rem'
                                      }}
                                    >
                                      Edit
                                    </ThemeButton>
                                    <ThemeButton
                                      onClick={() => handleDelete(supplier.id)}
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-md)',
                        padding: 'var(--spacing-md) 0',
                        borderTop: `1px solid ${theme?.colors.border}`
                      }}>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: theme?.colors.foregroundSecondary 
                        }}>
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSuppliers.length)} of {filteredSuppliers.length} entries
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          gap: 'var(--spacing-xs)', 
                          alignItems: 'center', 
                          flexWrap: 'wrap' 
                        }}>
                          {renderPaginationButtons()}
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 'var(--spacing-xs)', 
                          fontSize: '0.8rem', 
                          color: theme?.colors.foreground 
                        }}>
                          <span>Page</span>
                          <ThemeInput
                            type="number"
                            min="1"
                            max={totalPages}
                            value={currentPage}
                            onChange={(e) => {
                              const page = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                              handlePageChange(page);
                            }}
                            style={{
                              width: '60px',
                              padding: '6px',
                              textAlign: 'center',
                              fontSize: '0.8rem'
                            }}
                          />
                          <span>of {totalPages}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </ThemeCard>
            </div>

            {/* Right Column - Info Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {/* Keyboard Shortcuts Card */}
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
                  ⌨️ Keyboard Shortcuts
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: 'var(--spacing-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <kbd style={{ 
                      padding: 'var(--spacing-xs) var(--spacing-sm)', 
                      background: theme?.colors.background, 
                      borderRadius: 'var(--radius-sm)', 
                      border: `1px solid ${theme?.colors.border}`, 
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}>
                      Ctrl+C
                    </kbd>
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.8rem' }}>Focus supplier name</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <kbd style={{ 
                      padding: 'var(--spacing-xs) var(--spacing-sm)', 
                      background: theme?.colors.background, 
                      borderRadius: 'var(--radius-sm)', 
                      border: `1px solid ${theme?.colors.border}`, 
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}>
                      Ctrl+F
                    </kbd>
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.8rem' }}>Focus search</span>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: 'var(--spacing-md)', 
                  fontSize: '0.7rem', 
                  color: theme?.colors.foregroundSecondary,
                  padding: 'var(--spacing-sm)',
                  background: theme?.colors.background,
                  borderRadius: 'var(--radius-sm)'
                }}>
                  💡 Tip: Use keyboard shortcuts for faster navigation
                </div>
              </ThemeCard>

              {/* Quick Stats Card */}
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
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Suppliers</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.primary }}>
                      {suppliers.length}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 'var(--spacing-sm)',
                    borderBottom: `1px dashed ${theme?.colors.border}`
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Filtered</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.info }}>
                      {filteredSuppliers.length}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 'var(--spacing-sm)',
                    borderBottom: `1px dashed ${theme?.colors.border}`
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Current Page</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.warning }}>
                      {currentPage}/{totalPages}
                    </span>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 'var(--spacing-sm)'
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
                      setAddress('');
                      setSupplierCode('');
                      setContactNumber('');
                      setEmail('');
                      setRemark('');
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
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    variant="secondary"
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    Clear Search
                  </ThemeButton>

                  <ThemeButton 
                    onClick={() => {
                      nameInputRef.current?.focus();
                      nameInputRef.current?.select();
                    }}
                    variant="secondary"
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    Focus Supplier Name
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
            Supplier Management System • Total Suppliers: {suppliers.length} • 
            {searchTerm && ` Filtered: ${filteredSuppliers.length} •`}
            Page {currentPage} of {totalPages}
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

            .supplier-container > div:first-child {
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