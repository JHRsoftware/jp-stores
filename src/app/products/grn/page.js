"use client";
import { Suspense, lazy, useEffect, useState, useRef } from "react";
import { useSearchParams } from 'next/navigation';
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

export default function GrnPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { measureAsync } = usePerformance();

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [qty, setQty] = useState(1);
  const [perItemCost, setPerItemCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [expiredDate, setExpiredDate] = useState("");
  const [other, setOther] = useState("");
  const [grnItems, setGrnItems] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [date, setDate] = useState(() => {
    try {
      return new Date().toISOString().slice(0, 10);
    } catch (err) {
      return '';
    }
  });
  const [dueDate, setDueDate] = useState(() => {
    try {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    } catch (err) {
      return '';
    }
  });
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [grnNumber, setGrnNumber] = useState("");
  const [grnId, setGrnId] = useState(null);
  const [otherHeader, setOtherHeader] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [user, setUser] = useState(null);
  const [discount, setDiscount] = useState("");
  const [storedDiscount, setStoredDiscount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItemPriceHistory, setSelectedItemPriceHistory] = useState([]);
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false);
  const priceHistoryCache = useRef(new Map()); // Memory cache for price history
  
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

  // Focus the search input when user presses F1
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'F1') {
        try { e.preventDefault(); } catch (err) {}
        try { searchInputRef.current?.focus(); searchInputRef.current?.select?.(); } catch (err) {}
        return;
      }

      if (e.key === 'F4') {
        try { e.preventDefault(); } catch (err) {}
        setSelectedItemId('');
        setSearchTerm('');
        setSelectedItemDetails(null);
        setSelectedItemPriceHistory([]);
        setShowDropdown(false);
        setHighlightedIndex(-1);
        try { searchInputRef.current?.focus(); } catch {}
        return;
      }
      // F5: submit the GRN form (prevent default browser refresh)
      if (e.key === 'F5') {
        try { e.preventDefault(); } catch (err) {}
        try {
          // call the existing submit handler with a dummy event
          handleSubmit && handleSubmit({ preventDefault: () => {} });
        } catch (err) {
          console.error('Submit shortcut failed', err);
        }
        return;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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

  useEffect(() => {
    fetchItems();
    fetchSuppliers();
    fetchNextGrnNumber();
  }, [measureAsync]);

  // If grn_number is provided as query param, load that GRN for editing
  // Handle optional grn_number query param using a small inner client component
  // wrapped in Suspense by the caller. This avoids the prerender-time error
  // when navigation hooks are used during prerendering.
  function GrnSearchParamHandler() {
    const searchParamsLocal = useSearchParams();

    useEffect(() => {
      const grnNumberParam = searchParamsLocal?.get ? searchParamsLocal.get('grn_number') : null;
      if (grnNumberParam) {
        // load GRN and its items
        (async () => {
          setLoading(true);
          try {
            const res = await fetch(`/api/products/grn/getGrnItems?grn_number=${encodeURIComponent(grnNumberParam)}`);
            const data = await res.json();
            if (data.success) {
              const grn = data.grn || {};
              setGrnId(grn.id || null);
              setGrnNumber(grn.grn_number || grnNumberParam);
              setDate(grn.date || '');
              setDueDate(grn.due_date || '');
              setInvoiceNumber(grn.invoice_number || '');
              setPoNumber(grn.po_number || '');
              setSelectedSupplierId(grn.supplier_id || '');
              setOtherHeader(grn.other || '');
              // When opening an existing GRN for edit, do not apply stored discount to item costs.
              // Keep discount input at 0 so editing won't change item unit prices.
              setDiscount('0');
              // Preserve the stored discount so we can show a note in the UI that a discount was already applied
              setStoredDiscount(parseFloat(grn.discount || 0) || 0);

              // Map items to this page's expected shape
              const mappedItems = (data.items || []).map(it => ({
                id: it.item_id || it.id,
                item_barcode: it.item_barcode,
                item_name: it.item_name,
                qty: it.qty,
                per_item_cost: it.cost,
                original_cost: it.cost,
                expired_date: it.expired_date || it.expired_date || '',
                other: it.other || ''
              }));
              setGrnItems(mappedItems);
              showMessage('GRN loaded for editing', 'success');
            } else {
              showMessage(data.error || 'Failed to load GRN');
            }
          } catch (err) {
            showMessage('Network error loading GRN');
          } finally {
            setLoading(false);
          }
        })();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParamsLocal]);

    return null;
  }

  useEffect(() => {
    if (!selectedItemId) {
      setSelectedItemDetails(null);
      setSelectedItemPriceHistory([]);
      return;
    }
    const item = items.find(it => String(it.id) === String(selectedItemId));
    setSelectedItemDetails(item || null);
    
    // Always fetch fresh price history from database when item is selected
    fetchItemPriceHistory(selectedItemId, true); // true = force refresh from database
  }, [selectedItemId, items]);

  // Filter items based on search term - UPDATED: Better matching logic
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

  // Apply discount when discount value changes
  useEffect(() => {
    if (discount && grnItems.length > 0) {
      applyDiscount();
    } else if (!discount && grnItems.length > 0) {
      removeDiscount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discount]);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/products/item");
      const data = await res.json();
      if (data.success) setItems(data.items || []);
    } catch (err) {
      showMessage("Failed to load items");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSuppliers() {
    setSuppliersLoading(true);
    try {
      // Force fresh data from database - add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/supplier/getSuppliers?_t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Suppliers loaded from database:', data);
      
      if (data.success && Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
        showMessage(`Loaded ${data.suppliers.length} suppliers from database`, "success");
      } else {
        console.warn('Invalid supplier data structure:', data);
        setSuppliers([]);
        showMessage("No suppliers found in database");
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setSuppliers([]);
      showMessage(`Failed to load suppliers: ${err.message}`);
    } finally {
      setSuppliersLoading(false);
    }
  }

  async function fetchNextGrnNumber() {
    try {
      const res = await fetch("/api/products/grn/addGrn");
      const data = await res.json();
      let maxNum = 0;
      if (data.grns && Array.isArray(data.grns)) {
        for (const grn of data.grns) {
          const match = String(grn.grn_number).match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
      }
      setGrnNumber(`GRN-${maxNum + 1}`);
    } catch (err) {
      setGrnNumber("");
    }
  }

  async function fetchItemPriceHistory(itemId, forceRefresh = false) {
    if (!itemId) {
      setSelectedItemPriceHistory([]);
      return;
    }
    
    // Check cache first (unless force refresh)
    const cacheKey = `item_${itemId}`;
    if (!forceRefresh && priceHistoryCache.current.has(cacheKey)) {
      const cachedData = priceHistoryCache.current.get(cacheKey);
      console.log('Loading price history from memory cache for item:', itemId);
      setSelectedItemPriceHistory(cachedData);
      return;
    }
    
    setLoadingPriceHistory(true);
    try {
      // Force fresh data from database - add timestamp to prevent browser/proxy caching
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/products/grn/itemPriceHistory?item_id=${itemId}&_t=${timestamp}`, {
        cache: 'no-cache', // Prevent browser caching
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await res.json();
      
      if (data.success) {
        const priceHistory = data.priceHistory || [];
        
        // Save to memory cache
        priceHistoryCache.current.set(cacheKey, priceHistory);
        console.log('Price history loaded fresh from database and cached for item:', itemId);
        
        // Limit cache size to prevent memory issues (keep latest 50 items)
        if (priceHistoryCache.current.size > 50) {
          const firstKey = priceHistoryCache.current.keys().next().value;
          priceHistoryCache.current.delete(firstKey);
        }
        
        setSelectedItemPriceHistory(priceHistory);
      } else {
        setSelectedItemPriceHistory([]);
        console.warn('Failed to fetch price history:', data.error);
      }
    } catch (err) {
      setSelectedItemPriceHistory([]);
      console.error('Error fetching price history:', err);
    } finally {
      setLoadingPriceHistory(false);
    }
  }

  // Clear price history cache
  const clearPriceHistoryCache = () => {
    priceHistoryCache.current.clear();
    console.log('Price history cache cleared');
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle item selection from dropdown
  const handleItemSelect = (item) => {
    setSelectedItemId(item.id);
    setSearchTerm(`${item.item_barcode} - ${item.item_name}`);
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

  // Handle key events for navigation
  const handleQtyKeyPress = (e) => {
    if (e.key === 'Enter' && qty) {
      e.preventDefault();
      costInputRef.current?.focus();
      costInputRef.current?.select();
    }
  };

  const handleCostKeyPress = (e) => {
    if (e.key === 'Enter' && perItemCost) {
      e.preventDefault();
      handleAddItem();
    }
  };

  function handleAddItem() {
    if (!selectedItemId || !qty) {
      showMessage("Select item and enter quantity");
      return;
    }
    const item = items.find(it => it.id == selectedItemId);
    if (!item) return;
    
    const newItem = {
      id: item.id,
      item_barcode: item.item_barcode,
      item_name: item.item_name,
      qty,
      per_item_cost: perItemCost,
      selling_price: sellingPrice,
      market_price: marketPrice,
      wholesale_price: wholesalePrice,
      retail_price: retailPrice,
      expired_date: expiredDate,
      other,
      original_cost: perItemCost // Store original cost for discount calculations
    };
    
    setGrnItems(prev => [...prev, newItem]);
    
    // Reset form and focus back to search input
    setSelectedItemId("");
    setSearchTerm("");
    setSelectedItemPriceHistory([]);
    setQty(1);
    setPerItemCost("");
    setSellingPrice("");
    setMarketPrice("");
    setWholesalePrice("");
    setRetailPrice("");
    setExpiredDate("");
    setOther("");
    
    // Focus back to search input for next item
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    
    showMessage("Item added to GRN", "success");
  }

  function handleRemoveItem(idx) {
    setGrnItems(prev => prev.filter((_, i) => i !== idx));
    showMessage("Item removed from GRN", "success");
  }

  // Apply discount to all items - FIXED: No longer causes infinite loop
  const applyDiscount = () => {
    if (!discount || grnItems.length === 0) return;
    
    const discountValue = parseFloat(discount);
    if (isNaN(discountValue) || discountValue <= 0) return;

    setGrnItems(prev => {
      // Fixed amount discount - distribute per unit
      const totalQty = prev.reduce((sum, item) => sum + parseFloat(item.qty || 0), 0);
      if (totalQty === 0) return prev;

      const perUnitDiscount = discountValue / totalQty;
      return prev.map(item => {
        const originalCost = parseFloat(item.original_cost || item.per_item_cost);
        if (isNaN(originalCost)) return item;

        const discountedCost = originalCost - perUnitDiscount;
        return {
          ...item,
          per_item_cost: Math.max(0, discountedCost).toFixed(2)
        };
      });
    });
  };

  // Remove discount and restore original prices - FIXED: No longer causes infinite loop
  const removeDiscount = () => {
    setGrnItems(prev => prev.map(item => ({
      ...item,
      per_item_cost: item.original_cost || item.per_item_cost
    })));
  };

  // Handle discount change
  const handleDiscountChange = (e) => {
    const value = e.target.value;
    setDiscount(value);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!date) {
      showMessage("Date is required");
      return;
    }
    if (!selectedSupplierId) {
      showMessage("Supplier is required");
      return;
    }
    if (grnItems.length === 0) {
      showMessage("Add at least one item to GRN");
      return;
    }
    
    const total = grnItems.reduce((sum, it) => sum + (parseFloat(it.qty) * parseFloat(it.per_item_cost || 0)), 0);
    setLoading(true);
    
    try {
      const res = await fetch("/api/products/grn/addGrn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grnId: grnId,
          grnNumber,
          invoiceNumber,
          date,
          dueDate,
          poNumber,
          supplierId: selectedSupplierId,
          total,
          userName: user?.username || "",
          other: otherHeader,
          discount: discount || "0",
          items: grnItems.map(it => ({
            itemId: it.id,
            item_name: it.item_name,
            qty: it.qty,
            cost: it.per_item_cost,
            original_cost: it.original_cost,
            other: it.other,
            expired_date: it.expired_date
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        showMessage("GRN saved successfully!", "success");
        setGrnItems([]);
        setDate("");
        setDueDate("");
        setInvoiceNumber("");
        setPoNumber("");
        setSelectedSupplierId("");
        setOtherHeader("");
        setDiscount("");
        setSearchTerm("");
        fetchNextGrnNumber();
      } else {
        showMessage(data.error || "Failed to save GRN");
      }
    } catch (err) {
      showMessage("Network error saving GRN");
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const grandTotal = grnItems.reduce((sum, it) => sum + (parseFloat(it.qty) * parseFloat(it.per_item_cost || 0)), 0);
  const originalTotal = grnItems.reduce((sum, it) => sum + (parseFloat(it.qty) * parseFloat(it.original_cost || it.per_item_cost || 0)), 0);
  const totalDiscountAmount = originalTotal - grandTotal;
  const discountPercentage = originalTotal > 0 ? (totalDiscountAmount / originalTotal) * 100 : 0;

  // Calculate per item discount for display
  const getPerItemDiscount = () => {
    if (!discount || grnItems.length === 0) return 0;

    const discountValue = parseFloat(discount);
    const totalQty = grnItems.reduce((sum, item) => sum + parseFloat(item.qty || 0), 0);

    return totalQty > 0 ? (discountValue / totalQty).toFixed(2) : 0;
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
        <ThemeContainer className="grn-container" style={{ 
          animation: 'fadeIn 0.5s ease-out',
          maxWidth: '1400px'
        }}>
          <Suspense fallback={null}>
            <GrnSearchParamHandler />
          </Suspense>
          {/* Header Section */}
          <div className="grn-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
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
                  Create new Goods Received Notes for inventory management
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
                    clearPriceHistoryCache(); // Clear cache on page refresh
                    
                    try {
                      // Fetch fresh data from database
                      await Promise.all([
                        fetchItems(),
                        fetchSuppliers()
                      ]);
                      
                      // If an item is selected, refresh its price history
                      if (selectedItemId) {
                        await fetchItemPriceHistory(selectedItemId, true);
                      }
                      
                      showMessage("All data refreshed successfully!", "success");
                    } catch (err) {
                      console.error('Refresh error:', err);
                      showMessage("Error refreshing data", "error");
                    } finally {
                      setRefreshing(false);
                    }
                  }}
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

          {message && <MessageAlert message={message} type={messageType} />}

          {/* Main Content Grid */}
          <ThemeGrid columns="1fr 320px" gap="lg">
            {/* Left Column - Forms and Tables */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {/* GRN Header Card */}
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
                  📦 GRN Header Information
                </h3>
                
                <ThemeGrid columns="repeat(auto-fit, minmax(200px, 1fr))" gap="md" style={{ marginBottom: 'var(--spacing-md)' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary 
                    }}>
                      GRN Number *
                    </label>
                    <ThemeInput 
                      type="text" 
                      value={grnNumber} 
                      readOnly 
                      placeholder="GRN Number" 
                      required 
                      style={{
                        background: theme?.colors.backgroundSecondary,
                        color: theme?.colors.foregroundSecondary,
                        fontWeight: '500'
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
                      Supplier *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select 
                        value={selectedSupplierId} 
                        onChange={e => setSelectedSupplierId(e.target.value)} 
                        required
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-sm)',
                          paddingRight: '40px', // Space for refresh button
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${theme?.colors.border}`,
                          fontSize: '0.9rem',
                          background: theme?.colors.background,
                          color: theme?.colors.foreground
                        }}
                      >
                        <option value="">
                          {suppliers.length === 0 ? 'No suppliers found - Add suppliers first' : 'Select Supplier'}
                        </option>
                        {suppliers.map(sup => (
                          <option key={sup.id} value={sup.id}>
                            {sup.supplier_code} - {sup.name}
                            {sup.contact_number ? ` (${sup.contact_number})` : ''}
                          </option>
                        ))}
                      </select>
                      
                      <ThemeButton
                        type="button"
                        onClick={() => {
                          console.log('Refreshing suppliers...');
                          fetchSuppliers();
                        }}
                        variant="secondary"
                        style={{
                          position: 'absolute',
                          right: '2px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          padding: 'var(--spacing-xs)',
                          fontSize: '0.7rem',
                          minWidth: 'auto',
                          width: '30px',
                          height: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Refresh suppliers from database"
                      >
                        🔄
                      </ThemeButton>
                    </div>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary 
                    }}>
                      Date *
                    </label>
                    <ThemeInput 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                      placeholder="Date" 
                      required 
                      style={{ fontSize: '0.9rem' }}
                    />
                  </div>
                </ThemeGrid>
              </ThemeCard>

              {/* Add Items Card */}
              <ThemeCard 
                style={{
                  background: theme?.colors.card,
                  borderTop: `4px solid ${theme?.colors.info}`,
                  position: 'relative'
                }}
              >
                <h3 style={{ 
                  margin: '0 0 var(--spacing-lg) 0', 
                  color: theme?.colors.info, 
                  fontSize: '1.5rem', 
                  fontWeight: 600 
                }}>
                  ➕ Add Items to GRN
                </h3>

                <ThemeGrid columns="2fr 1fr 1fr 1fr auto" gap="md" style={{ marginBottom: 'var(--spacing-md)' }}>
                  {/* Item Search */}
                  <div style={{ position: 'relative' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary,
                      fontSize: '0.85rem'
                    }}>
                      Barcode/Name *
                    </label>
                    <ThemeInput 
                      ref={searchInputRef}
                      type="text" 
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Type barcode or item name and press Enter"
                      style={{ fontSize: '0.85rem' }}
                    />
                    
                    {/* Dropdown for search results */}
                    {showDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: theme?.colors.card,
                          border: `1px solid ${theme?.colors.border}`,
                          borderRadius: 'var(--radius-md)',
                          boxShadow: `0 4px 12px ${theme?.colors.shadowLight}`,
                          zIndex: 1000,
                          maxHeight: '200px',
                          overflowY: 'auto',
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
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: highlightedIndex === i ? theme?.colors.primaryLight : 
                                        (items.find(it => it.item_barcode?.toString().toLowerCase() === searchTerm.toLowerCase())?.id === item.id ? theme?.colors.successLight : theme?.colors.card)
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.85rem', color: theme?.colors.foreground }}>{item.item_name}</div>
                              <div style={{ fontSize: '0.75rem', color: theme?.colors.foregroundSecondary }}>Barcode: {item.item_barcode}</div>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: theme?.colors.foregroundSecondary }}>
                              {items.find(it => it.item_barcode?.toString().toLowerCase() === searchTerm.toLowerCase())?.id === item.id ? 'Exact Match' : 'Click to select'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary,
                      fontSize: '0.85rem'
                    }}>
                      Quantity *
                    </label>
                    <ThemeInput 
                      ref={qtyInputRef}
                      type="number" 
                      min="1" 
                      value={qty} 
                      onChange={e => setQty(e.target.value)} 
                      onKeyPress={handleQtyKeyPress}
                      placeholder="Qty" 
                      required 
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Cost */}
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
                      ref={costInputRef}
                      type="number" 
                      step="0.01" 
                      value={perItemCost} 
                      onChange={e => setPerItemCost(e.target.value)} 
                      onKeyPress={handleCostKeyPress}
                      placeholder="Cost" 
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 'var(--spacing-sm)', 
                      fontWeight: 600, 
                      color: theme?.colors.foregroundSecondary,
                      fontSize: '0.85rem'
                    }}>
                      Expiry Date
                    </label>
                    <ThemeInput 
                      type="date" 
                      value={expiredDate} 
                      onChange={e => setExpiredDate(e.target.value)} 
                      placeholder="Expired Date" 
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Add Button */}
                  <div style={{ display: 'flex', alignItems: 'end' }}>
                    <ThemeButton 
                      type="button" 
                      onClick={handleAddItem}
                      disabled={!selectedItemId || !qty}
                      variant={!selectedItemId || !qty ? "secondary" : "primary"}
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Add Item
                    </ThemeButton>
                  </div>
                </ThemeGrid>

                {/* Selected Item Details */}
                {selectedItemDetails && (
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
                      Selected Item Details
                    </h4>
                    
                    <ThemeGrid columns="repeat(auto-fit, minmax(200px, 1fr))" gap="sm" style={{ fontSize: '0.85rem' }}>
                      <div><span style={{ fontWeight: '600', color: theme?.colors.foregroundSecondary }}>Description:</span> {selectedItemDetails.item_description || '-'}</div>
                      <div><span style={{ fontWeight: '600', color: theme?.colors.foregroundSecondary }}>Type:</span> {selectedItemDetails.qty_type || '-'}</div>
                      <div><span style={{ fontWeight: '600', color: theme?.colors.foregroundSecondary }}>Category:</span> {selectedItemDetails.category || '-'}</div>
                      <div><span style={{ fontWeight: '600', color: theme?.colors.foregroundSecondary }}>Other:</span> {selectedItemDetails.other || '-'}</div>
                    </ThemeGrid>
                  </ThemeCard>
                )}
              </ThemeCard>

              {/* GRN Items Table Card */}
              <ThemeCard 
                style={{
                  background: theme?.colors.card,
                  borderTop: `4px solid ${theme?.colors.success}`
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
                    color: theme?.colors.success, 
                    fontSize: '1.5rem', 
                    fontWeight: 600 
                  }}>
                    📋 GRN Items
                  </h3>
                  {grnItems.length > 0 && (
                    <div style={{ 
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      background: theme?.colors.successLight,
                      color: theme?.colors.success,
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      {grnItems.length} items
                    </div>
                  )}
                </div>

                {grnItems.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--spacing-xl)', 
                    color: theme?.colors.foregroundSecondary,
                    background: theme?.colors.background,
                    borderRadius: 'var(--radius-lg)',
                    border: `2px dashed ${theme?.colors.border}`
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📦</div>
                    <div style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 600, 
                      marginBottom: 'var(--spacing-sm)',
                      color: theme?.colors.foreground 
                    }}>
                      No Items Added
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                      Add items to create a GRN
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
                          }}>Unit Cost</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'right', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Total Cost</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'left', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`
                          }}>Expiry</th>
                          <th style={{ 
                            padding: 'var(--spacing-md)', 
                            textAlign: 'center', 
                            fontWeight: 600, 
                            color: theme?.colors.foregroundSecondary, 
                            borderBottom: `2px solid ${theme?.colors.border}`,
                            width: '100px'
                          }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grnItems.map((it, idx) => {
                          const originalUnitCost = parseFloat(it.original_cost || it.per_item_cost);
                          const currentUnitCost = parseFloat(it.per_item_cost);
                          const hasDiscount = discount && originalUnitCost !== currentUnitCost;
                          const itemDiscount = originalUnitCost - currentUnitCost;
                          const totalItemDiscount = itemDiscount * parseFloat(it.qty);
                          
                          return (
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
                              <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                <div style={{ color: hasDiscount ? theme?.colors.error : theme?.colors.foreground, fontWeight: '500' }}>
                                  {it.per_item_cost ? `Rs. ${parseFloat(it.per_item_cost).toFixed(2)}` : '-'}
                                </div>
                                {hasDiscount && (
                                  <div style={{ fontSize: '0.7rem', color: theme?.colors.foregroundSecondary, textDecoration: 'line-through' }}>
                                    Rs. {originalUnitCost.toFixed(2)}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                <div style={{ color: theme?.colors.success, fontWeight: '600' }}>
                                  Rs. {(parseFloat(it.qty) * parseFloat(it.per_item_cost || 0)).toFixed(2)}
                                </div>
                                {hasDiscount && (
                                  <div style={{ fontSize: '0.7rem', color: theme?.colors.error }}>
                                    -Rs. {totalItemDiscount.toFixed(2)}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: 'var(--spacing-md)', color: theme?.colors.foregroundSecondary, fontSize: '0.75rem' }}>
                                {it.expired_date || '-'}
                              </td>
                              <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                <ThemeButton 
                                  type="button" 
                                  onClick={() => handleRemoveItem(idx)}
                                  variant="error"
                                  style={{
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  Remove
                                </ThemeButton>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      
                      {/* Discount Inputs and Grand Total Footer */}
                      <tfoot>
                        {/* Discount Input Row */}
                        <tr style={{ background: theme?.colors.warningLight }}>
                          <td colSpan="7" style={{ padding: 'var(--spacing-lg)', borderBottom: `2px solid ${theme?.colors.border}` }}>
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <span style={{ fontWeight: '600', color: theme?.colors.foreground, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                  💰 Apply Discount:
                                </span>
                                <ThemeInput 
                                  type="number" 
                                  step="0.01" 
                                  value={discount} 
                                  onChange={handleDiscountChange}
                                  placeholder="Discount value"
                                  style={{
                                    width: '120px',
                                    fontSize: '0.8rem'
                                  }}
                                />
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <span style={{ fontWeight: '600', color: theme?.colors.foreground, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                  Discount Type: Fixed Amount (Rs.)
                                </span>
                              </div>
                              
                              {discount && (
                                <ThemeButton 
                                  type="button" 
                                  onClick={() => setDiscount("")}
                                  variant="error"
                                  style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    fontSize: '0.8rem',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Remove Discount
                                </ThemeButton>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Grand Total Row */}
                        <tr style={{ 
                          background: theme?.colors.success,
                          color: theme?.colors.foregroundOnPrimary || '#fff'
                        }}>
                          <td colSpan="4" style={{ 
                            padding: 'var(--spacing-lg)', 
                            textAlign: 'right', 
                            fontWeight: '700', 
                            fontSize: '0.9rem',
                            borderBottomLeftRadius: 'var(--radius-md)'
                          }}>
                            {discount ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--spacing-xs)' }}>
                                <div style={{ fontSize: '0.85rem' }}>Sub Total:</div>
                                <div style={{ fontSize: '0.85rem' }}>Discount:</div>
                                <div style={{ 
                                  borderTop: `2px solid ${theme?.colors.successLight}`, 
                                  paddingTop: 'var(--spacing-sm)', 
                                  marginTop: 'var(--spacing-xs)', 
                                  fontSize: '1rem',
                                  fontWeight: '800'
                                }}>
                                  💰 GRAND TOTAL:
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '1rem', fontWeight: '800' }}>💰 GRAND TOTAL:</div>
                            )}
                          </td>
                          <td colSpan="3" style={{ 
                            padding: 'var(--spacing-lg)', 
                            textAlign: 'right', 
                            fontWeight: '700', 
                            fontSize: '0.9rem',
                            borderBottomRightRadius: 'var(--radius-md)'
                          }}>
                            {discount ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--spacing-xs)' }}>
                                <div style={{ fontSize: '0.85rem' }}>Rs. {originalTotal.toFixed(2)}</div>
                                <div style={{ color: theme?.colors.warningLight, fontSize: '0.85rem', fontWeight: '600' }}>
                                  -Rs. {totalDiscountAmount.toFixed(2)} 
                                  (Fixed)
                                </div>
                                <div style={{ 
                                  borderTop: `2px solid ${theme?.colors.successLight}`, 
                                  paddingTop: 'var(--spacing-sm)', 
                                  marginTop: 'var(--spacing-xs)', 
                                  fontSize: '1.1rem',
                                  fontWeight: '800'
                                }}>
                                  Rs. {grandTotal.toFixed(2)}
                                </div>
                                {/* If editing an existing GRN that already had a stored discount, show a small note.
                                    This note is informational only — we don't re-calculate the subtotal/grand total here. */}
                                {grnId && storedDiscount > 0 && (
                                  <div style={{ marginTop: 'var(--spacing-xs)', fontSize: '0.7rem', color: theme?.colors.successLight, opacity: 0.95 }}>
                                    Note: A stored discount of Rs. {storedDiscount.toFixed(2)} was already applied to this GRN.
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>Rs. {grandTotal.toFixed(2)}</div>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Submit Button */}
                {grnItems.length > 0 && (
                  <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center' }}>
                    <ThemeButton 
                      type="submit" 
                      onClick={handleSubmit}
                      disabled={loading || !date || !selectedSupplierId}
                      variant={loading || !date || !selectedSupplierId ? "secondary" : "success"}
                      style={{
                        padding: 'var(--spacing-md) var(--spacing-xl)',
                        fontWeight: "bold",
                        fontSize: "1rem"
                      }}
                    >
                      {loading ? 'Submitting...' : 'Submit GRN'}
                    </ThemeButton>
                  </div>
                )}
              </ThemeCard>
            </div>

            {/* Right Column - Info Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {/* Item Price History Card */}
              <ThemeCard style={{
                background: theme?.colors.card,
                border: `2px solid ${theme?.colors.success}`,
                position: 'sticky',
                top: 'var(--spacing-md)'
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: theme?.colors.success, 
                  fontSize: '1rem',
                  marginBottom: 'var(--spacing-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    💰 Item Price History
                  </div>
                  {selectedItemDetails && (
                    <ThemeButton 
                      onClick={() => {
                        if (selectedItemId) {
                          // Clear cache for this item and fetch fresh data
                          const cacheKey = `item_${selectedItemId}`;
                          priceHistoryCache.current.delete(cacheKey);
                          fetchItemPriceHistory(selectedItemId, true);
                        }
                      }}
                      disabled={loadingPriceHistory}
                      variant="secondary"
                      style={{
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)'
                      }}
                    >
                      <span className={loadingPriceHistory ? 'spin' : ''}>🔄</span>
                      {loadingPriceHistory ? 'Loading...' : 'Refresh'}
                    </ThemeButton>
                  )}
                </div>
                
                {!selectedItemDetails ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--spacing-lg)', 
                    color: theme?.colors.foregroundSecondary,
                    background: theme?.colors.background,
                    borderRadius: 'var(--radius-lg)',
                    border: `2px dashed ${theme?.colors.border}`
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>📊</div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 600, 
                      marginBottom: 'var(--spacing-xs)',
                      color: theme?.colors.foreground 
                    }}>
                      No Item Selected
                    </div>
                    <div style={{ fontSize: '0.75rem' }}>
                      Select an item to view price history
                    </div>
                  </div>
                ) : loadingPriceHistory ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--spacing-lg)', 
                    color: theme?.colors.foregroundSecondary 
                  }}>
                    <ThemeLoading />
                    <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.8rem' }}>
                      Loading price history...
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Selected Item Info */}
                    <div style={{ 
                      padding: 'var(--spacing-md)',
                      background: theme?.colors.successLight,
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--spacing-md)',
                      border: `1px solid ${theme?.colors.success}`
                    }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: theme?.colors.success,
                        fontSize: '0.85rem',
                        marginBottom: 'var(--spacing-xs)'
                      }}>
                        Current Item
                      </div>
                      <div style={{ 
                        fontWeight: '700', 
                        color: theme?.colors.foreground,
                        fontSize: '0.9rem',
                        marginBottom: 'var(--spacing-xs)'
                      }}>
                        {selectedItemDetails.item_name}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: theme?.colors.foregroundSecondary 
                      }}>
                        Barcode: {selectedItemDetails.item_barcode}
                      </div>
                    </div>

                    {/* Price History List */}
                    {selectedItemPriceHistory.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: 'var(--spacing-lg)', 
                        color: theme?.colors.foregroundSecondary,
                        background: theme?.colors.background,
                        borderRadius: 'var(--radius-lg)',
                        border: `1px dashed ${theme?.colors.border}`
                      }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-sm)' }}>📈</div>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 600,
                          color: theme?.colors.foreground,
                          marginBottom: 'var(--spacing-xs)'
                        }}>
                          No Previous GRNs Found
                        </div>
                        <div style={{ fontSize: '0.7rem' }}>
                          This item hasn't been received before
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 'var(--spacing-sm)' 
                      }}>
                        <div style={{ 
                          fontWeight: '600', 
                          color: theme?.colors.foreground,
                          fontSize: '0.85rem',
                          marginBottom: 'var(--spacing-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>Latest 3 GRN Prices</span>
                          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                            <span style={{ 
                              fontSize: '0.65rem', 
                              color: theme?.colors.success,
                              background: theme?.colors.successLight,
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${theme?.colors.success}`,
                              fontWeight: 700
                            }}>
                              🔄 FRESH DATA
                            </span>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              color: theme?.colors.foregroundSecondary,
                              background: theme?.colors.background,
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${theme?.colors.border}`
                            }}>
                              {selectedItemPriceHistory.length} record{selectedItemPriceHistory.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        
                        {selectedItemPriceHistory.map((record, index) => (
                          <div
                            key={record.grn_item_id}
                            style={{
                              padding: 'var(--spacing-md)',
                              background: index === 0 ? theme?.colors.successLight : theme?.colors.background,
                              border: `1px solid ${index === 0 ? theme?.colors.success : theme?.colors.border}`,
                              borderRadius: 'var(--radius-md)',
                              position: 'relative'
                            }}
                          >
                            {index === 0 && (
                              <div style={{
                                position: 'absolute',
                                top: 'var(--spacing-xs)',
                                right: 'var(--spacing-xs)',
                                background: theme?.colors.success,
                                color: theme?.colors.foregroundOnPrimary || '#fff',
                                fontSize: '0.6rem',
                                fontWeight: '700',
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                borderRadius: 'var(--radius-sm)'
                              }}>
                                LATEST
                              </div>
                            )}
                            
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'flex-start',
                              marginBottom: 'var(--spacing-sm)' 
                            }}>
                              <div>
                                <div style={{ 
                                  fontWeight: '700', 
                                  color: theme?.colors.success,
                                  fontSize: '1rem'
                                }}>
                                  Rs. {parseFloat(record.cost || 0).toFixed(2)}
                                </div>
                                <div style={{ 
                                  fontSize: '0.7rem', 
                                  color: theme?.colors.foregroundSecondary 
                                }}>
                                  per unit
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  fontWeight: '600',
                                  color: theme?.colors.foreground
                                }}>
                                  Qty: {record.qty}
                                </div>
                                <div style={{ 
                                  fontSize: '0.7rem', 
                                  color: theme?.colors.foregroundSecondary 
                                }}>
                                  Total: Rs. {(parseFloat(record.cost || 0) * parseFloat(record.qty || 0)).toFixed(2)}
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ 
                              paddingTop: 'var(--spacing-sm)',
                              borderTop: `1px dashed ${theme?.colors.border}`,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 'var(--spacing-xs)'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                fontSize: '0.7rem'
                              }}>
                                <span style={{ color: theme?.colors.foregroundSecondary }}>GRN:</span>
                                <span style={{ fontWeight: '600', color: theme?.colors.primary }}>
                                  {record.grn_number}
                                </span>
                              </div>
                              
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                fontSize: '0.7rem'
                              }}>
                                <span style={{ color: theme?.colors.foregroundSecondary }}>Date:</span>
                                <span style={{ fontWeight: '600', color: theme?.colors.foreground }}>
                                  {new Date(record.grn_date).toLocaleDateString()}
                                </span>
                              </div>
                              
                              {record.supplier_name && (
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  fontSize: '0.7rem'
                                }}>
                                  <span style={{ color: theme?.colors.foregroundSecondary }}>Supplier:</span>
                                  <span style={{ fontWeight: '600', color: theme?.colors.foreground }}>
                                    {record.supplier_name}
                                  </span>
                                </div>
                              )}
                              
                              {record.expired_date && (
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  fontSize: '0.7rem'
                                }}>
                                  <span style={{ color: theme?.colors.foregroundSecondary }}>Expiry:</span>
                                  <span style={{ 
                                    fontWeight: '600', 
                                    color: new Date(record.expired_date) < new Date() ? 
                                      theme?.colors.error : theme?.colors.foreground 
                                  }}>
                                    {new Date(record.expired_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {selectedItemPriceHistory.length > 0 && (
                          <div style={{ 
                            marginTop: 'var(--spacing-sm)',
                            padding: 'var(--spacing-sm)',
                            background: theme?.colors.background,
                            borderRadius: 'var(--radius-md)',
                            border: `1px dashed ${theme?.colors.border}`,
                            textAlign: 'center'
                          }}>
                            <div style={{ 
                              fontSize: '0.7rem', 
                              color: theme?.colors.foregroundSecondary,
                              marginBottom: 'var(--spacing-xs)'
                            }}>
                              Price Trend Analysis
                            </div>
                            {(() => {
                              if (selectedItemPriceHistory.length < 2) return null;
                              const latest = parseFloat(selectedItemPriceHistory[0].cost || 0);
                              const previous = parseFloat(selectedItemPriceHistory[1].cost || 0);
                              const difference = latest - previous;
                              const isIncrease = difference > 0;
                              const percentChange = previous > 0 ? Math.abs((difference / previous) * 100) : 0;
                              
                              return (
                                <div style={{ 
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  color: isIncrease ? theme?.colors.error : 
                                        difference < 0 ? theme?.colors.success : theme?.colors.foreground
                                }}>
                                  {isIncrease ? '↗️' : difference < 0 ? '↘️' : '➡️'} 
                                  {difference === 0 ? 'No change' : 
                                    `${isIncrease ? '+' : ''}Rs. ${difference.toFixed(2)} (${percentChange.toFixed(1)}%)`}
                                  {difference !== 0 && (
                                    <span style={{ color: theme?.colors.foregroundSecondary }}>
                                      {' '}from last GRN
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </ThemeCard>

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
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.8rem' }}>Clear selection</span>
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
                      F5
                    </kbd>
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.8rem' }}>Submit GRN</span>
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
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.8rem' }}>Select / Add</span>
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
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>GRN Items</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.info }}>
                      {grnItems.length}
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: 'var(--spacing-sm)',
                    borderBottom: `1px dashed ${theme?.colors.border}`
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Suppliers</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        color: suppliers.length > 0 ? theme?.colors.success : theme?.colors.error 
                      }}>
                        {suppliers.length}
                      </span>
                      <ThemeButton
                        onClick={fetchSuppliers}
                        variant="secondary"
                        disabled={suppliersLoading}
                        style={{
                          padding: '2px 6px',
                          fontSize: '0.6rem',
                          minWidth: 'auto',
                          opacity: suppliersLoading ? 0.6 : 1
                        }}
                        title={suppliersLoading ? "Loading suppliers..." : "Refresh suppliers"}
                      >
                        {suppliersLoading ? '⏳' : '🔄'}
                      </ThemeButton>
                    </div>
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
                      color: grnId ? theme?.colors.warning : theme?.colors.success 
                    }}>
                      {grnId ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </ThemeCard>

              {/* Quick Actions Card */}
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
                  ⚡ Quick Actions
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  <ThemeButton 
                    onClick={() => {
                      setSelectedItemId('');
                      setSearchTerm('');
                      setSelectedItemDetails(null);
                      setSelectedItemPriceHistory([]);
                      setShowDropdown(false);
                      setHighlightedIndex(-1);
                      searchInputRef.current?.focus();
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
                      setGrnItems([]);
                      showMessage('All items cleared from GRN', 'success');
                    }}
                    disabled={grnItems.length === 0}
                    variant="error"
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    Clear All Items
                  </ThemeButton>
                  
                  <ThemeButton 
                    onClick={() => {
                      clearPriceHistoryCache();
                      showMessage('Price history cache cleared', 'success');
                    }}
                    variant="secondary"
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    🗑️ Clear Price Cache
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
            GRN Management System • Items in current GRN: {grnItems.length} • Total: Rs. {grandTotal.toFixed(2)}
            {discount && ` • Discount: Rs. ${totalDiscountAmount.toFixed(2)}`}
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

            .grn-container > div:nth-child(2) {
              grid-template-columns: 1fr !important;
            }
            
            .grn-container > div:nth-child(2) > div:nth-child(2) {
              display: none !important;
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