"use client";
import { Suspense, lazy, useEffect, useState, useRef } from "react";
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
import { useLoading } from '../../loading-context';

export default function GrnListPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { measureAsync } = usePerformance();
  const { setLoading: setGlobalLoading } = useLoading();

  const [grnList, setGrnList] = useState([]);
  const [loadedGrn, setLoadedGrn] = useState(null);
  const [loadedGrnItems, setLoadedGrnItems] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Refs for focus management
  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const costInputRef = useRef(null);

  const showMessage = (msg, type = 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

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

  // Removed auto-load for fast initial load and memory save

  // Filter items based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredItems([]);
      setShowDropdown(false);
      return;
    }

    // First, try exact barcode match
    const exactBarcodeMatch = items.find(item => 
      item.item_barcode?.toString().toLowerCase() === searchTerm.toLowerCase()
    );

    if (exactBarcodeMatch) {
      setFilteredItems([exactBarcodeMatch]);
      setShowDropdown(true);
      return;
    }

    // If no exact barcode match, try exact item name match
    const exactNameMatch = items.find(item => 
      item.item_name?.toLowerCase() === searchTerm.toLowerCase()
    );

    if (exactNameMatch) {
      setFilteredItems([exactNameMatch]);
      setShowDropdown(true);
      return;
    }

    // If no exact matches, show partial matches
    const partialMatches = items.filter(item => 
      item.item_barcode?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredItems(partialMatches);
    setShowDropdown(partialMatches.length > 0);
  }, [searchTerm, items]);

  async function fetchAllGrns() {
    setLoading(true);
    try {
      const res = await fetch("/api/products/grn/addGrn");
      const data = await res.json();
      if (data.grns) setGrnList(data.grns);
    } catch (err) {
      showMessage('Error fetching GRN list');
    } finally {
      setLoading(false);
    }
  }

  async function fetchItems() {
    try {
      const res = await fetch('/api/products/item');
      const data = await res.json();
      if (data.success) setItems(data.items || []);
    } catch (err) {
      showMessage('Error fetching items');
    }
  }

  async function fetchSuppliers() {
    try {
      const res = await fetch("/api/supplier/getSuppliers");
      const data = await res.json();
      if (data.success) setSuppliers(data.suppliers || []);
    } catch (err) {
      console.warn('Error fetching suppliers');
    }
  }

  async function handleLoadGrn(grnNumber) {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/grn/getGrnItems?grn_number=${encodeURIComponent(grnNumber)}`);
      const data = await res.json();
      if (data.success) {
        setLoadedGrn(data.grn);
        // preserve original cost and add display_cost so we can apply discounts client-side for UI
        const itemsWithCosts = (data.items || []).map(it => ({ ...it, original_cost: it.cost, display_cost: it.cost }));
        // if grn has a discount value, apply it as fixed amount distributed proportionally (server stores discount as fixed amount)
        const discountValue = parseFloat(data.grn?.discount || 0) || 0;
        if (discountValue > 0) {
          const totalQty = itemsWithCosts.reduce((s, it) => s + parseFloat(it.qty || 0), 0) || 1;
          // distribute fixed discount per item proportionally by qty
          const perUnitDiscount = discountValue / totalQty;
          itemsWithCosts.forEach(it => {
            const unitDiscount = perUnitDiscount; // simple per-unit distribution
            it.display_cost = (parseFloat(it.cost || 0) - unitDiscount).toFixed(2);
          });
        }
        setLoadedGrnItems(itemsWithCosts);
        setEditingItem(null);
        showMessage('GRN loaded successfully', 'success');
      } else {
        setLoadedGrn(null);
        setLoadedGrnItems([]);
        showMessage(data.error || "Failed to load GRN");
      }
    } catch (err) {
      setLoadedGrn(null);
      setLoadedGrnItems([]);
      showMessage("Network error loading GRN");
    } finally {
      setLoading(false);
    }
  }

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // If the user types manually, clear any previous explicit selection
    setSelectedItem(null);
  };

  // Handle item selection from dropdown
  const handleItemSelect = (item) => {
    // Set an explicit selected item so add flow can rely on it
    setSelectedItem(item);
    // Use barcode or name as the visible input so matching still works
    setSearchTerm(item.item_barcode?.toString() || item.item_name || '');
    setShowDropdown(false);
    
    // Focus on quantity input
    setTimeout(() => {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }, 100);
  };

  // Handle search input key events - UPDATED: Better auto-selection logic
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If there's an exact match, auto-select it
      const exactBarcodeMatch = items.find(item => 
        item.item_barcode?.toString().toLowerCase() === searchTerm.toLowerCase()
      );

      if (exactBarcodeMatch) {
        handleItemSelect(exactBarcodeMatch);
        return;
      }

      // If there's an exact name match, auto-select it
      const exactNameMatch = items.find(item => 
        item.item_name?.toLowerCase() === searchTerm.toLowerCase()
      );

      if (exactNameMatch) {
        handleItemSelect(exactNameMatch);
        return;
      }

      // If filtered items available, select the first one
      if (filteredItems.length > 0) {
        handleItemSelect(filteredItems[0]);
      } else {
        // If no matches, show message
        showMessage("No matching item found");
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }
  };

  // Keyboard navigation for dropdown: Arrow keys, Enter to select, Escape to close
  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showDropdown) setShowDropdown(true);
      setHighlightedIndex(prev => {
        const next = prev + 1;
        return next >= filteredItems.length ? 0 : next;
      });
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!showDropdown) setShowDropdown(true);
      setHighlightedIndex(prev => {
        const next = prev - 1;
        return next < 0 ? Math.max(0, filteredItems.length - 1) : next;
      });
      return;
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIndex(-1);
      return;
    }
    if (e.key === 'Enter') {
      // if an item is highlighted, select it
      if (showDropdown && highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
        e.preventDefault();
        handleItemSelect(filteredItems[highlightedIndex]);
        setHighlightedIndex(-1);
        setShowDropdown(false);
        return;
      }
      // otherwise delegate to existing Enter handler
      handleSearchKeyPress(e);
    }
  };

  // Update GRN header information
  const handleUpdateGrnHeader = async (field, value) => {
    if (!loadedGrn) return;

    setLoading(true);
    try {
      const res = await fetch('/api/products/grn/updateGrnHeader', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grnId: loadedGrn.id,
          field: field,
          value: value
        })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('GRN updated successfully!', 'success');
        setLoadedGrn(prev => ({ ...prev, [field]: value }));
      } else {
        showMessage(data.error || 'Failed to update GRN');
      }
    } catch (err) {
      showMessage('Network error updating GRN');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = loadedGrnItems.reduce((sum, it) => sum + (parseFloat(it.qty || 0) * parseFloat(it.display_cost || it.cost || 0)), 0);

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
        <ThemeContainer className="grn-list-container" style={{ 
          animation: 'fadeIn 0.5s ease-out',
          maxWidth: '1400px'
        }}>
          {/* Header Section */}
          <div className="grn-list-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
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
                  View, edit and manage Goods Received Notes
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
                <style>{`
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
                `}</style>
                <ThemeButton
                  onClick={async () => {
                    setRefreshing(true);
                    setGlobalLoading(true);
                    try {
                      await fetchAllGrns();
                      await fetchItems();
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
                    background: refreshing ? '#aaa' : '#1976d2',
                    color: refreshing ? '#fff' : undefined,
                    border: 'none',
                    borderRadius: 4,
                    cursor: refreshing ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    animation: refreshing ? undefined : 'blinkHighlight 1.2s linear infinite',
                  }}
                >
                  {refreshing ? 'Loading...' : 'Load'}
                </ThemeButton>
              </div>
            </div>
          </div>

          {message && <MessageAlert message={message} type={messageType} />}

          {/* Main Content Grid */}
          <ThemeGrid columns="1fr" gap="lg">
            {/* GRN List Card */}
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
                    📋 GRN List
                  </h3>
                  <button
                    onClick={async () => {
                      setRefreshing(true);
                      try {
                        await fetchAllGrns();
                        await fetchItems();
                        await fetchSuppliers();
                      } finally {
                        setRefreshing(false);
                      }
                    }}
                    disabled={refreshing}
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.9rem',
                      background: refreshing ? '#aaa' : '#1976d2',
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
                <div style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: theme?.colors.primaryLight,
                  color: theme?.colors.primary,
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}>
                  {grnList.length} GRNs
                </div>
              </div>

              {loading ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--spacing-xl)', 
                  color: theme?.colors.foregroundSecondary
                }}>
                  <ThemeLoading text="Loading GRN list..." />
                </div>
              ) : grnList.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 'var(--spacing-xl)', 
                  color: theme?.colors.foregroundSecondary,
                  background: theme?.colors.background,
                  borderRadius: 'var(--radius-lg)',
                  border: `2px dashed ${theme?.colors.border}`
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📋</div>
                  <div style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 600, 
                    marginBottom: 'var(--spacing-sm)',
                    color: theme?.colors.foreground 
                  }}>
                    No GRNs Found
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>
                    Create GRNs to see them listed here
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
                    fontSize: '0.9rem'
                  }}>
                    <thead>
                      <tr style={{ background: theme?.colors.backgroundSecondary }}>
                        <th style={{ 
                          padding: 'var(--spacing-md)', 
                          textAlign: 'left', 
                          fontWeight: 600, 
                          color: theme?.colors.foregroundSecondary, 
                          borderBottom: `2px solid ${theme?.colors.border}`
                        }}>GRN Number</th>
                        <th style={{ 
                          padding: 'var(--spacing-md)', 
                          textAlign: 'left', 
                          fontWeight: 600, 
                          color: theme?.colors.foregroundSecondary, 
                          borderBottom: `2px solid ${theme?.colors.border}`
                        }}>Date</th>
                        <th style={{ 
                          padding: 'var(--spacing-md)', 
                          textAlign: 'left', 
                          fontWeight: 600, 
                          color: theme?.colors.foregroundSecondary, 
                          borderBottom: `2px solid ${theme?.colors.border}`
                        }}>Supplier</th>
                        <th style={{ 
                          padding: 'var(--spacing-md)', 
                          textAlign: 'right', 
                          fontWeight: 600, 
                          color: theme?.colors.foregroundSecondary, 
                          borderBottom: `2px solid ${theme?.colors.border}`
                        }}>Total</th>
                        <th style={{ 
                          padding: 'var(--spacing-md)', 
                          textAlign: 'center', 
                          fontWeight: 600, 
                          color: theme?.colors.foregroundSecondary, 
                          borderBottom: `2px solid ${theme?.colors.border}`,
                          width: '200px'
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grnList.map(grn => (
                        <tr key={grn.id} style={{ 
                          borderBottom: `1px solid ${theme?.colors.border}`,
                          background: loadedGrn?.id === grn.id ? theme?.colors.primaryLight : 'transparent'
                        }}>
                          <td style={{ padding: 'var(--spacing-md)', fontWeight: '600' }}>
                            <code style={{ 
                              background: theme?.colors.backgroundSecondary, 
                              padding: 'var(--spacing-xs) var(--spacing-sm)', 
                              borderRadius: 'var(--radius-sm)', 
                              fontSize: '0.8rem',
                              color: theme?.colors.primary,
                              fontWeight: 600
                            }}>
                              {grn.grn_number}
                            </code>
                          </td>
                          <td style={{ padding: 'var(--spacing-md)', color: theme?.colors.foregroundSecondary }}>{grn.date}</td>
                          <td style={{ padding: 'var(--spacing-md)' }}>
                            {suppliers.find(s => s.id === grn.supplier_id)?.name || grn.supplier_id}
                          </td>
                          <td style={{ padding: 'var(--spacing-md)', textAlign: 'right', fontWeight: '600', color: theme?.colors.success }}>
                            Rs. {parseFloat(grn.total || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
                              <ThemeButton 
                                type="button" 
                                onClick={() => handleLoadGrn(grn.grn_number)}
                                variant="primary"
                                style={{
                                  padding: 'var(--spacing-sm) var(--spacing-md)',
                                  fontSize: '0.8rem'
                                }}
                              >
                                View Details
                              </ThemeButton>
                              <a 
                                href={`/products/grn?grn_number=${encodeURIComponent(grn.grn_number)}`}
                                style={{
                                  textDecoration: 'none'
                                }}
                              >
                                <ThemeButton 
                                  variant="success"
                                  style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  Edit Page
                                </ThemeButton>
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ThemeCard>

            {/* GRN Details Section */}
            {loadedGrn && (
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
                    📦 GRN Details: {loadedGrn.grn_number}
                  </h3>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '700', 
                    color: theme?.colors.success,
                    background: theme?.colors.successLight,
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    Total: Rs. {totalAmount.toFixed(2)}
                  </div>
                </div>

                {/* GRN Header Info - Editable */}
                <ThemeGrid columns="repeat(auto-fit, minmax(200px, 1fr))" gap="md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary,
                      fontSize: '0.85rem'
                    }}>
                      Date
                    </label>
                    <ThemeInput
                      type="date"
                      value={loadedGrn.date}
                      readOnly
                      disabled
                      style={{
                        background: theme?.colors.backgroundSecondary,
                        color: theme?.colors.foregroundSecondary
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary,
                      fontSize: '0.85rem'
                    }}>
                      Discount (Rs)
                    </label>
                    <ThemeInput
                      type="number"
                      step="0.01"
                      value={loadedGrn.discount || ''}
                      readOnly
                      disabled
                      placeholder="Discount"
                      style={{
                        background: theme?.colors.backgroundSecondary,
                        color: theme?.colors.foregroundSecondary
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary,
                      fontSize: '0.85rem'
                    }}>
                      Supplier
                    </label>
                    <select
                      value={loadedGrn.supplier_id}
                      onChange={(e) => handleUpdateGrnHeader('supplier_id', e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${theme?.colors.border}`,
                        fontSize: '0.85rem',
                        background: theme?.colors.background,
                        color: theme?.colors.foreground
                      }}
                    >
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary,
                      fontSize: '0.85rem'
                    }}>
                      Invoice Number
                    </label>
                    <ThemeInput
                      type="text"
                      value={loadedGrn.invoice_number || ''}
                      onChange={(e) => handleUpdateGrnHeader('invoice_number', e.target.value)}
                      placeholder="Invoice Number"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary,
                      fontSize: '0.85rem'
                    }}>
                      PO Number
                    </label>
                    <ThemeInput
                      type="text"
                      value={loadedGrn.po_number || ''}
                      onChange={(e) => handleUpdateGrnHeader('po_number', e.target.value)}
                      placeholder="PO Number"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary,
                      fontSize: '0.85rem'
                    }}>
                      Other Information
                    </label>
                    <ThemeInput
                      type="text"
                      value={loadedGrn.other || ''}
                      onChange={(e) => handleUpdateGrnHeader('other', e.target.value)}
                      placeholder="Other Information"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </ThemeGrid>

                {/* GRN Items Table */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-md)' 
                }}>
                  <h4 style={{ 
                    margin: 0, 
                    color: theme?.colors.foreground, 
                    fontSize: '1.25rem', 
                    fontWeight: 600 
                  }}>
                    Items
                  </h4>
                  <div style={{ 
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    background: theme?.colors.infoLight,
                    color: theme?.colors.info,
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}>
                    {loadedGrnItems.length} items
                  </div>
                </div>

                {loadedGrnItems.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--spacing-xl)', 
                    color: theme?.colors.foregroundSecondary,
                    background: theme?.colors.background,
                    borderRadius: 'var(--radius-lg)',
                    border: `2px dashed ${theme?.colors.border}`
                  }}>
                    No items in this GRN
                  </div>
                ) : (
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
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Barcode</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Name</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'right', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Qty</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'right', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Cost</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'right', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Total</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Expiry</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Other</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'center', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`,
                            width: '120px'
                          }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadedGrnItems.map((it, idx) => (
                          <tr key={idx} style={{ 
                            borderBottom: `1px solid ${theme?.colors.border}`,
                            background: idx % 2 === 0 ? theme?.colors.card : theme?.colors.background
                          }}>
                            <td style={{ padding: 'var(--spacing-md)' }}>
                              <code style={{ 
                                background: theme?.colors.backgroundSecondary, 
                                padding: 'var(--spacing-xs) var(--spacing-sm)', 
                                borderRadius: 'var(--radius-sm)', 
                                fontSize: '0.75rem',
                                color: theme?.colors.primary,
                                fontWeight: 600
                              }}>
                                {it.item_barcode}
                              </code>
                            </td>
                            <td style={{ padding: 'var(--spacing-md)', fontWeight: '500', color: theme?.colors.foreground }}>{it.item_name}</td>
                            <td style={{ padding: 'var(--spacing-md)', textAlign: 'right', fontWeight: '500', color: theme?.colors.foreground }}>{it.qty}</td>
                            <td style={{ padding: 'var(--spacing-md)', textAlign: 'right', color: theme?.colors.error, fontWeight: '500' }}>
                              Rs. {parseFloat(it.cost || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: 'var(--spacing-md)', textAlign: 'right', color: theme?.colors.success, fontWeight: '600' }}>
                              Rs. {(parseFloat(it.qty || 0) * parseFloat(it.cost || 0)).toFixed(2)}
                            </td>
                            <td style={{ padding: 'var(--spacing-md)', color: theme?.colors.foregroundSecondary, fontSize: '0.75rem' }}>
                              {it.expired_date || '-'}
                            </td>
                            <td style={{ padding: 'var(--spacing-md)', color: theme?.colors.foregroundSecondary, fontSize: '0.75rem' }}>
                              {it.other || '-'}
                            </td>
                            <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                              <div style={{ 
                                fontSize: '0.7rem', 
                                color: theme?.colors.foregroundSecondary,
                                background: theme?.colors.backgroundSecondary,
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600
                              }}>
                                Read-only
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Read-only Notice */}
                <ThemeCard 
                  style={{ 
                    background: theme?.colors.warningLight,
                    border: `1px solid ${theme?.colors.warning}`
                  }}
                >
                  <h4 style={{ 
                    margin: '0 0 var(--spacing-sm) 0', 
                    color: theme?.colors.warning, 
                    fontSize: '1rem', 
                    fontWeight: 600 
                  }}>
                    📝 Read-only View
                  </h4>
                  <div style={{ color: theme?.colors.warning, fontSize: '0.85rem' }}>
                    Adding or editing items is disabled in this view. To modify this GRN (add/remove items or change costs), click the <strong>Edit Page</strong> button to open the full GRN editor.
                  </div>
                </ThemeCard>
              </ThemeCard>
            )}
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
            GRN Management System • Total GRNs: {grnList.length}
            {loadedGrn && ` • Viewing: ${loadedGrn.grn_number}`}
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