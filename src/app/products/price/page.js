"use client";
import React from 'react';
import { Suspense, lazy, useEffect, useState, useRef } from 'react';
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

export default function PricePage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { measureAsync } = usePerformance();

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    id: '', // price id for editing
    item_id: '',
    per_item_cost: '',
    selling_price: '',
    market_price: '',
    wholesale_price: '',
    retail_price: '',
    user_name: '',
    other: ''
  });
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [prices, setPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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

  useEffect(() => {
    fetchItems();
  }, [measureAsync]);

  // Filter items based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems([]);
    } else {
      const filtered = items.filter(item => 
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toString().includes(searchTerm)
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  const showMessage = (msg, type = 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage(null);
      setMessageType('');
    }, 5000);
  };

  async function fetchItems() {
    setLoadingItems(true);
    try {
      const res = await fetch('/api/products/item');
      if (!res.ok) throw new Error(`Failed to load items (${res.status})`);
      const data = await res.json();
      const itemsArray = data.items || data || [];
      setItems(itemsArray);
    } catch (err) {
      console.error(err);
      showMessage('Failed to load items', 'error');
    } finally {
      setLoadingItems(false);
    }
  }

  // Fetch prices for an item from the DB (no-cache)
  const fetchPrices = React.useCallback(async (itemId) => {
    setLoadingPrices(true);
    try {
      const res = await fetch(`/api/products/price?item_id=${itemId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load prices (${res.status})`);
      const data = await res.json();
      if (data.success && Array.isArray(data.prices)) {
        setPrices(data.prices);
      } else {
        setPrices([]);
      }
    } catch (err) {
      console.error(err);
      setPrices([]);
    } finally {
      setLoadingPrices(false);
    }
  }, []);

  // when item selection changes, fetch all prices for that item
  useEffect(() => {
    if (!form.item_id) {
      setPrices([]);
      return;
    }
    fetchPrices(form.item_id);
  }, [form.item_id, fetchPrices]);

  function handleChange(e) {
    const { name, value } = e.target;
    // If changing item_id, always reset to new price mode
    if (name === 'item_id') {
      setForm({
        id: '',
        item_id: value,
        per_item_cost: '',
        selling_price: '',
        market_price: '',
        wholesale_price: '',
        retail_price: '',
        user_name: getUserName(),
        other: ''
      });
      setMessage(null);
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  function handleSearchChange(e) {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    setHighlightedIndex(-1);
  }

  function handleItemSelect(item) {
    setForm(prev => ({
      ...prev,
      item_id: item.id
    }));
    setSearchTerm(`${item.item_barcode} / ${item.item_name} / ${item.id}`);
    setShowDropdown(false);
    setMessage(null);
  }

  function handleSearchKeyPress(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const searchValue = e.target.value.trim();
      
      if (searchValue) {
        // First try to find by exact barcode match
        let foundItem = items.find(item => 
          item.item_barcode?.toLowerCase() === searchValue.toLowerCase()
        );

        // If not found by barcode, try to find by name (first match)
        if (!foundItem) {
          foundItem = items.find(item => 
            item.item_name?.toLowerCase().includes(searchValue.toLowerCase())
          );
        }

        // If still not found, try by ID
        if (!foundItem) {
          foundItem = items.find(item => 
            item.id?.toString() === searchValue
          );
        }

        if (foundItem) {
          handleItemSelect(foundItem);
        } else {
          showMessage('Item not found with this barcode/name', 'error');
          setShowDropdown(true); // Show dropdown with filtered results
        }
      }
    }
  }

  // Handle arrow navigation + Enter/Escape for the dropdown
  function handleSearchKeyDown(e) {
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
      // If a dropdown item is highlighted, select it
      if (showDropdown && highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
        e.preventDefault();
        const item = filteredItems[highlightedIndex];
        if (item) handleItemSelect(item);
        setHighlightedIndex(-1);
        setShowDropdown(false);
        return;
      }
      // Otherwise fall back to previous Enter logic
      handleSearchKeyPress(e);
    }
  }

  function handleEditPrice(price) {
    setForm({
      id: price.id,
      item_id: price.item_id,
      per_item_cost: price.per_item_cost ?? '',
      selling_price: price.selling_price ?? '',
      market_price: price.market_price ?? '',
      wholesale_price: price.wholesale_price ?? '',
      retail_price: price.retail_price ?? '',
      user_name: price.user_name ?? getUserName(),
      other: price.other ?? ''
    });
    
    // Set search term to show selected item
    const selectedItem = items.find(item => item.id === price.item_id);
    if (selectedItem) {
      setSearchTerm(`${selectedItem.item_barcode} / ${selectedItem.item_name} / ${selectedItem.id}`);
    }
    
    setMessage(null);
  }

  function handleNewPrice() {
    setForm(prev => ({
      id: '',
      item_id: prev.item_id,
      per_item_cost: '',
      selling_price: '',
      market_price: '',
      wholesale_price: '',
      retail_price: '',
      user_name: getUserName(),
      other: ''
    }));
    setMessage(null);
  }

  // Refs for sequential focus when pressing Enter
  const perItemRef = useRef(null);
  const sellingRef = useRef(null);
  const marketRef = useRef(null);
  const wholesaleRef = useRef(null);
  const retailRef = useRef(null);
  const otherRef = useRef(null);
  const searchRef = useRef(null);

  // Helper to get logged-in user name from localStorage
  function getUserName() {
    try {
      if (typeof window === 'undefined') return '';
      const raw = localStorage.getItem('user');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return parsed?.name || parsed?.username || parsed?.user_name || '';
    } catch (err) {
      return '';
    }
  }

  // Initialize form.user_name from logged-in user on mount
  useEffect(() => {
    const name = getUserName();
    if (name) setForm(prev => ({ ...prev, user_name: name }));
  }, []);

  // Focus the search input when user presses F1
  useEffect(() => {
    function onKeyDown(e) {
      // F1 key
      if (e.key === 'F1') {
        try {
          e.preventDefault();
        } catch (err) {}
        if (searchRef && searchRef.current) {
          try { searchRef.current.focus(); } catch {}
        }
        return;
      }

      // F4: clear selected item and prices
      if (e.key === 'F4') {
        try { e.preventDefault(); } catch {}
        // clear selected item and related UI
        setForm(prev => ({
          id: '',
          item_id: '',
          per_item_cost: '',
          selling_price: '',
          market_price: '',
          wholesale_price: '',
          retail_price: '',
          user_name: getUserName(),
          other: ''
        }));
        setSearchTerm('');
        setShowDropdown(false);
        setFilteredItems([]);
        setPrices([]);
        setHighlightedIndex(-1);
        return;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleEnterNext(e, nextRef, finalAction) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        try { nextRef.current.focus(); } catch {}
      } else if (finalAction) {
        finalAction();
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (!form.item_id) {
      showMessage('Select an item first', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        item_id: Number(form.item_id),
        per_item_cost: form.per_item_cost === '' ? null : Number(form.per_item_cost),
        selling_price: form.selling_price === '' ? null : Number(form.selling_price),
        market_price: form.market_price === '' ? null : Number(form.market_price),
        wholesale_price: form.wholesale_price === '' ? null : Number(form.wholesale_price),
        retail_price: form.retail_price === '' ? null : Number(form.retail_price),
        user_name: form.user_name || getUserName() || null,
        other: form.other || null
      };
      let url = '/api/products/price';
      let method = 'POST';
      // If editing, send id and use POST (API will update if id exists)
      if (form.id) payload.id = form.id;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok || result.success === false) {
        throw new Error(result.error || `Server returned ${res.status}`);
      }
      showMessage(result.message || 'Price saved successfully', 'success');
      // After save, clear form fields except item_id
      setForm(prev => ({
        id: '',
        item_id: prev.item_id,
        per_item_cost: '',
        selling_price: '',
        market_price: '',
        wholesale_price: '',
        retail_price: '',
        user_name: getUserName(),
        other: ''
      }));
      // Refresh prices from DB
      if (form.item_id) await fetchPrices(form.item_id);
    } catch (err) {
      console.error(err);
      showMessage(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  // Always add a new price for the selected item, regardless of edit mode
  async function handleAddNewPrice() {
    setMessage(null);
    if (!form.item_id) {
      showMessage('Select an item first', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        item_id: Number(form.item_id),
        per_item_cost: form.per_item_cost === '' ? null : Number(form.per_item_cost),
        selling_price: form.selling_price === '' ? null : Number(form.selling_price),
        market_price: form.market_price === '' ? null : Number(form.market_price),
        wholesale_price: form.wholesale_price === '' ? null : Number(form.wholesale_price),
        retail_price: form.retail_price === '' ? null : Number(form.retail_price),
        user_name: form.user_name || getUserName() || null,
        other: form.other || null
      };
      let url = '/api/products/price';
      let method = 'POST';
      // Do NOT send id, always insert new
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok || result.success === false) {
        throw new Error(result.error || `Server returned ${res.status}`);
      }
      showMessage(result.message || 'New price added successfully', 'success');
      setForm(prev => ({
        ...prev,
        per_item_cost: '',
        selling_price: '',
        market_price: '',
        wholesale_price: '',
        retail_price: '',
        user_name: getUserName(),
        other: ''
      }));
      // Refresh prices from DB
      if (form.item_id) await fetchPrices(form.item_id);
    } catch (err) {
      console.error(err);
      showMessage(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  // Delete a price by id and refresh the list from DB
  async function handleDeletePrice(priceId) {
    if (!priceId) return;
    const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to delete this price?') : true;
    if (!confirmed) return;
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/products/price?id=${encodeURIComponent(priceId)}`, { method: 'DELETE', cache: 'no-store' });
      const result = await res.json();
      if (!res.ok || result.success === false) {
        throw new Error(result.error || `Server returned ${res.status}`);
      }
      showMessage(result.message || 'Price deleted', 'success');
      if (form.item_id) await fetchPrices(form.item_id);
    } catch (err) {
      console.error(err);
      showMessage(err.message || 'Delete failed', 'error');
    } finally {
      setSaving(false);
    }
  }

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
        <ThemeContainer className="price-container" style={{ 
          animation: 'fadeIn 0.5s ease-out',
          maxWidth: '1400px'
        }}>
          {/* Header Section */}
          <div className="price-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
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
                  Manage product pricing and cost information
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
                  onClick={() => fetchItems()}
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
            {/* Left Column - Form and Price List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {/* Price Form Card */}
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
                  💰 Update Prices
                </h3>
                
                {message && (
                  <MessageAlert message={message} type={messageType} />
                )}

                <form onSubmit={handleSubmit}>
                  {/* Item Selection */}
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{ position: 'relative' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 'var(--spacing-sm)', 
                        fontWeight: 600, 
                        color: theme?.colors.foregroundSecondary 
                      }}>
                        Search by Barcode or Item Name *
                      </label>
                      
                      {loadingItems ? (
                        <div style={{ 
                          padding: 'var(--spacing-md)', 
                          background: theme?.colors.background, 
                          borderRadius: 'var(--radius-md)', 
                          textAlign: 'center', 
                          color: theme?.colors.foregroundSecondary 
                        }}>
                          <ThemeLoading text="Loading items..." />
                        </div>
                      ) : (
                        <div style={{ position: 'relative' }}>
                          <ThemeInput
                            type="text"
                            placeholder="Type barcode and press Enter, or type item name to search..."
                            ref={searchRef}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearchKeyDown}
                            style={{
                              fontSize: '0.9rem'
                            }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                          />
                          
                          {/* Instructions */}
                          <div style={{ fontSize: '0.75rem', color: theme?.colors.foregroundSecondary, marginTop: 'var(--spacing-xs)' }}>
                            💡 Tip: Type barcode and press Enter, or type item name and select from dropdown
                          </div>
                          
                          {/* Dropdown for filtered items */}
                          {showDropdown && filteredItems.length > 0 && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: theme?.colors.card,
                                border: `1px solid ${theme?.colors.border}`,
                                borderRadius: 'var(--radius-md)',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                zIndex: 1000,
                                boxShadow: `0 4px 12px ${theme?.colors.shadowLight}`,
                                marginTop: 'var(--spacing-xs)'
                              }}
                            >
                              {filteredItems.map((item, i) => (
                                <div
                                  key={item.id}
                                  onClick={() => handleItemSelect(item)}
                                  onMouseEnter={() => setHighlightedIndex(i)}
                                  onMouseLeave={() => setHighlightedIndex(-1)}
                                  style={{
                                    padding: 'var(--spacing-sm)',
                                    cursor: 'pointer',
                                    borderBottom: `1px solid ${theme?.colors.backgroundSecondary}`,
                                    background: highlightedIndex === i ? theme?.colors.primaryLight : 
                                              (form.item_id === item.id ? theme?.colors.primaryLight : theme?.colors.card),
                                    transition: 'background 0.12s'
                                  }}
                                >
                                  <div style={{ fontWeight: '600', color: theme?.colors.foreground }}>
                                    {item.item_name}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: theme?.colors.foregroundSecondary }}>
                                    Barcode: {item.item_barcode} | ID: {item.id}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* No results message */}
                          {showDropdown && searchTerm && filteredItems.length === 0 && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: theme?.colors.card,
                                border: `1px solid ${theme?.colors.border}`,
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--spacing-md)',
                                zIndex: 1000,
                                boxShadow: `0 4px 12px ${theme?.colors.shadowLight}`,
                                marginTop: 'var(--spacing-xs)',
                                color: theme?.colors.foregroundSecondary,
                                textAlign: 'center'
                              }}
                            >
                              No items found matching "{searchTerm}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Selected Item Display */}
                    {form.item_id && (
                      <ThemeCard 
                        style={{ 
                          marginTop: 'var(--spacing-md)',
                          background: theme?.colors.primaryLight,
                          border: `1px solid ${theme?.colors.primary}`
                        }}
                      >
                        <div style={{ fontWeight: '600', color: theme?.colors.primary }}>Selected Item:</div>
                        <div style={{ color: theme?.colors.primary, fontSize: '0.85rem' }}>
                          {(() => {
                            const selectedItem = items.find(item => item.id === form.item_id);
                            return selectedItem ? 
                              `${selectedItem.item_barcode} / ${selectedItem.item_name} / ${selectedItem.id}` : 
                              'Loading...';
                          })()}
                        </div>
                      </ThemeCard>
                    )}
                  </div>

                  {/* Pricing Information */}
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 style={{ 
                      margin: '0 0 var(--spacing-md) 0', 
                      color: theme?.colors.primary, 
                      fontSize: '1.1rem',
                      fontWeight: 600
                    }}>
                      Pricing Information
                    </h4>
                    <ThemeGrid columns="repeat(auto-fit, minmax(200px, 1fr))" gap="md">
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 'var(--spacing-sm)', 
                          fontWeight: 600, 
                          color: theme?.colors.foregroundSecondary,
                          fontSize: '0.85rem'
                        }}>
                          Per Item Cost
                        </label>
                        <ThemeInput
                          name="per_item_cost"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.per_item_cost}
                          onChange={handleChange}
                          ref={perItemRef}
                          onKeyDown={(e) => handleEnterNext(e, sellingRef)}
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
                          Selling Price
                        </label>
                        <ThemeInput
                          name="selling_price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.selling_price}
                          onChange={handleChange}
                          ref={sellingRef}
                          onKeyDown={(e) => handleEnterNext(e, marketRef)}
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
                          Market Price
                        </label>
                        <ThemeInput
                          name="market_price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.market_price}
                          onChange={handleChange}
                          ref={marketRef}
                          onKeyDown={(e) => handleEnterNext(e, wholesaleRef)}
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
                          Wholesale Price
                        </label>
                        <ThemeInput
                          name="wholesale_price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.wholesale_price}
                          onChange={handleChange}
                          ref={wholesaleRef}
                          onKeyDown={(e) => handleEnterNext(e, retailRef)}
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
                          Retail Price
                        </label>
                        <ThemeInput
                          name="retail_price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.retail_price}
                          onChange={handleChange}
                          ref={retailRef}
                          onKeyDown={(e) => handleEnterNext(e, null, () => { 
                            if (form.id) document.querySelector('form').requestSubmit(); 
                            else handleAddNewPrice(); 
                          })}
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
                          User Name
                        </label>
                        <ThemeInput
                          name="user_name"
                          type="text"
                          value={form.user_name}
                          disabled
                          style={{ 
                            fontSize: '0.85rem',
                            background: theme?.colors.backgroundSecondary
                          }}
                        />
                      </div>
                    </ThemeGrid>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                    {!form.id ? (
                      <ThemeButton 
                        type="button" 
                        onClick={handleAddNewPrice} 
                        disabled={saving || !form.item_id}
                        variant={saving || !form.item_id ? "secondary" : "success"}
                        style={{
                          padding: 'var(--spacing-md) var(--spacing-lg)',
                          fontSize: '0.9rem'
                        }}
                      >
                        {saving ? 'Saving...' : 'Add New Price'}
                      </ThemeButton>
                    ) : (
                      <>
                        <ThemeButton 
                          type="submit" 
                          disabled={saving}
                          variant={saving ? "secondary" : "primary"}
                          style={{
                            padding: 'var(--spacing-md) var(--spacing-lg)',
                            fontSize: '0.9rem'
                          }}
                        >
                          {saving ? 'Updating...' : 'Update Price'}
                        </ThemeButton>
                        <ThemeButton 
                          type="button" 
                          onClick={handleNewPrice} 
                          disabled={saving}
                          variant="secondary"
                          style={{
                            padding: 'var(--spacing-md) var(--spacing-lg)',
                            fontSize: '0.9rem'
                          }}
                        >
                          New Price
                        </ThemeButton>
                      </>
                    )}
                  </div>
                </form>
              </ThemeCard>

              {/* Price List Card */}
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
                    Price List
                  </h3>
                  {form.item_id && (
                    <div style={{ 
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      background: theme?.colors.infoLight,
                      color: theme?.colors.info,
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      {prices.length} prices
                    </div>
                  )}
                </div>

                {loadingPrices ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--spacing-xl)', 
                    color: theme?.colors.foregroundSecondary
                  }}>
                    <ThemeLoading text="Loading prices..." />
                  </div>
                ) : prices.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--spacing-xl)', 
                    color: theme?.colors.foregroundSecondary,
                    background: theme?.colors.background,
                    borderRadius: 'var(--radius-lg)',
                    border: `2px dashed ${theme?.colors.border}`
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>💰</div>
                    <div style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 600, 
                      marginBottom: 'var(--spacing-sm)',
                      color: theme?.colors.foreground 
                    }}>
                      No Prices Found
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                      Select an item and add prices using the form above
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
                          }}>Cost</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Selling</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Market</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Wholesale</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Retail</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>User</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'center', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`,
                            width: '120px'
                          }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prices.map((price, idx) => (
                          <tr key={price.id ? `${price.id}-${idx}` : `row-${idx}`}
                            style={{ 
                              borderBottom: `1px solid ${theme?.colors.border}`,
                              background: form.id === price.id ? theme?.colors.primaryLight : 'transparent'
                            }}>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              color: theme?.colors.foregroundSecondary, 
                              fontWeight: 500 
                            }}>
                              {price.id}
                            </td>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              color: theme?.colors.error, 
                              fontWeight: 500 
                            }}>
                              {price.per_item_cost ? `Rs. ${parseFloat(price.per_item_cost).toFixed(2)}` : '-'}
                            </td>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              color: theme?.colors.success, 
                              fontWeight: 500 
                            }}>
                              {price.selling_price ? `Rs. ${parseFloat(price.selling_price).toFixed(2)}` : '-'}
                            </td>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              color: theme?.colors.warning, 
                              fontWeight: 500 
                            }}>
                              {price.market_price ? `Rs. ${parseFloat(price.market_price).toFixed(2)}` : '-'}
                            </td>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              color: theme?.colors.secondary, 
                              fontWeight: 500 
                            }}>
                              {price.wholesale_price ? `Rs. ${parseFloat(price.wholesale_price).toFixed(2)}` : '-'}
                            </td>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              color: theme?.colors.primary, 
                              fontWeight: 500 
                            }}>
                              {price.retail_price ? `Rs. ${parseFloat(price.retail_price).toFixed(2)}` : '-'}
                            </td>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              color: theme?.colors.foregroundSecondary, 
                              fontSize: '0.75rem' 
                            }}>
                              {price.user_name || '-'}
                            </td>
                            <td style={{ 
                              padding: 'var(--spacing-md)', 
                              textAlign: 'center', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              gap: 'var(--spacing-xs)' 
                            }}>
                              <ThemeButton 
                                type="button" 
                                onClick={() => handleEditPrice(price)} 
                                disabled={saving}
                                variant="primary"
                                style={{
                                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                                  fontSize: '0.7rem'
                                }}
                              >
                                Edit
                              </ThemeButton>
                              <ThemeButton
                                type="button"
                                onClick={() => handleDeletePrice(price.id)}
                                disabled={saving}
                                variant="error"
                                style={{
                                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                                  fontSize: '0.7rem'
                                }}
                              >
                                Delete
                              </ThemeButton>
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
                      F1
                    </kbd>
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.8rem' }}>Focus search</span>
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
                      F4
                    </kbd>
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.8rem' }}>Clear selection & prices</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', gap: 'var(--spacing-xs)' }}>
                      <kbd style={{ 
                        padding: 'var(--spacing-xs) var(--spacing-sm)', 
                        background: theme?.colors.background, 
                        borderRadius: 'var(--radius-sm)', 
                        border: `1px solid ${theme?.colors.border}`, 
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}>
                        ↑
                      </kbd>
                      <kbd style={{ 
                        padding: 'var(--spacing-xs) var(--spacing-sm)', 
                        background: theme?.colors.background, 
                        borderRadius: 'var(--radius-sm)', 
                        border: `1px solid ${theme?.colors.border}`, 
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}>
                        ↓
                      </kbd>
                    </span>
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.8rem' }}>Navigate dropdown</span>
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
                      Enter
                    </kbd>
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.8rem' }}>Select / Submit</span>
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
                      Esc
                    </kbd>
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.8rem' }}>Close dropdown</span>
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
                  💡 Tip: Press Enter in Retail Price to submit (Other is skipped).
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
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Items</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.primary }}>
                      {items.length}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 'var(--spacing-sm)',
                    borderBottom: `1px dashed ${theme?.colors.border}`
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Selected Prices</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.info }}>
                      {prices.length}
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
                      color: form.id ? theme?.colors.warning : theme?.colors.success 
                    }}>
                      {form.id ? 'Active' : 'Inactive'}
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
                      setForm(prev => ({
                        ...prev,
                        per_item_cost: '',
                        selling_price: '',
                        market_price: '',
                        wholesale_price: '',
                        retail_price: '',
                        other: ''
                      }));
                    }}
                    variant="secondary"
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    Clear Price Fields
                  </ThemeButton>
                  
                  <ThemeButton 
                    onClick={() => {
                      setSearchTerm('');
                      setShowDropdown(false);
                      setFilteredItems([]);
                    }}
                    variant="secondary"
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    Clear Search
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
            Price Management System • {form.item_id ? `Prices for selected item: ${prices.length}` : 'Select an item to view prices'}
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

            .price-container > div:first-child {
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