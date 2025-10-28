"use client";
import React from 'react';
import { Suspense, lazy, useEffect, useState, useRef, useContext } from 'react';
import AuthWrapper from '../../components/AuthWrapper';
import FastPageLoader from '../../components/FastPageLoader';
import { usePerformance } from '../../utils/performance';
import { ThemeContext } from '../../theme-context';
import { 
  ThemeCard, 
  ThemeButton, 
  ThemeInput, 
  ThemeContainer,
  ThemeGrid,
  ThemeLoading 
} from '../../components/ThemeAware';

export default function ProductRegisterPage() {
  const { theme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { measureAsync } = usePerformance();

  // Get user data from localStorage
  let user = null;
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    if (userData) user = JSON.parse(userData);
  }
  
  const [items, setItems] = useState([]);
  const [itemBarcode, setItemBarcode] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [category, setCategory] = useState('');
  const [qty, setQty] = useState('');
  const [qtyType, setQtyType] = useState('');
  const [categories, setCategories] = useState([]);
  const [qtyTypes, setQtyTypes] = useState([]);
  const [totalCost, setTotalCost] = useState('');
  const [warranty, setWarranty] = useState('');
  const [perItemCost, setPerItemCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [other, setOther] = useState('');
  const [expiredDate, setExpiredDate] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [editId, setEditId] = useState(null);
  const [editItemBarcode, setEditItemBarcode] = useState('');
  const [editItemName, setEditItemName] = useState('');
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editQtyType, setEditQtyType] = useState('');
  const [editTotalCost, setEditTotalCost] = useState('');
  const [editWarranty, setEditWarranty] = useState('');
  const [editPerItemCost, setEditPerItemCost] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editMarketPrice, setEditMarketPrice] = useState('');
  const [editWholesalePrice, setEditWholesalePrice] = useState('');
  const [editRetailPrice, setEditRetailPrice] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editOther, setEditOther] = useState('');
  const [editExpiredDate, setEditExpiredDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [f1NoteVisible, setF1NoteVisible] = useState(false);
  const f1NoteTimerRef = useRef(null);
  
  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  // Refs
  const barcodeRef = useRef(null);
  const itemNameRef = useRef(null);
  const categoryRef = useRef(null);
  const qtyRef = useRef(null);
  const qtyTypeRef = useRef(null);
  const perItemCostRef = useRef(null);
  const sellingPriceRef = useRef(null);
  const marketPriceRef = useRef(null);
  const wholesalePriceRef = useRef(null);
  const retailPriceRef = useRef(null);
  const addButtonRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Focus barcode input when user presses F1
  useEffect(() => {
    const onKeyDown = (e) => {
      try {
        const isF1 = e.key === 'F1' || e.code === 'F1' || e.keyCode === 112;
        if (isF1) {
          try { e.preventDefault(); } catch (err) {}
          barcodeRef.current?.focus();
          try { barcodeRef.current?.select?.(); } catch (err) {}
          try {
            setF1NoteVisible(true);
            if (f1NoteTimerRef.current) clearTimeout(f1NoteTimerRef.current);
            f1NoteTimerRef.current = setTimeout(() => {
              setF1NoteVisible(false);
              f1NoteTimerRef.current = null;
            }, 3500);
          } catch (err) {}
        }
        // Add Ctrl+F for search focus
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
          e.preventDefault();
          searchInputRef.current?.focus();
          try { searchInputRef.current?.select?.(); } catch (err) {}
        }
      } catch (err) {}
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (f1NoteTimerRef.current) {
        clearTimeout(f1NoteTimerRef.current);
        f1NoteTimerRef.current = null;
      }
    };
  }, []);

  // Keyboard helpers for quick form navigation
  const onBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      itemNameRef.current?.focus();
      try { itemNameRef.current?.select?.(); } catch (err) {}
    }
  };

  const onItemNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      categoryRef.current?.focus();
    }
  };

  const onCategoryKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const list = categories || [];
      if (list.length === 0) return;
      const currentIndex = Math.max(0, list.findIndex(c => c.category_name === category));
      let nextIndex = currentIndex;
      if (e.key === 'ArrowDown') nextIndex = currentIndex + 1;
      if (e.key === 'ArrowUp') nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= list.length) nextIndex = list.length - 1;
      const nextVal = list[nextIndex]?.category_name || '';
      setCategory(nextVal);
      try { if (categoryRef.current) categoryRef.current.selectedIndex = nextIndex + 0; } catch (err) {}
    } else if (e.key === 'Enter') {
      e.preventDefault();
      qtyTypeRef.current?.focus();
      try { qtyTypeRef.current?.select?.(); } catch (err) {}
    }
  };

  const onQtyTypeKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const list = qtyTypes || [];
      if (list.length === 0) return;
      const currentIndex = Math.max(0, list.findIndex(qt => qt.name === qtyType));
      let nextIndex = currentIndex;
      if (e.key === 'ArrowDown') nextIndex = currentIndex + 1;
      if (e.key === 'ArrowUp') nextIndex = currentIndex - 1;
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= list.length) nextIndex = list.length - 1;
      const nextVal = list[nextIndex]?.name || '';
      setQtyType(nextVal);
      try { if (qtyTypeRef.current) qtyTypeRef.current.selectedIndex = nextIndex; } catch (err) {}
    } else if (e.key === 'Enter') {
      e.preventDefault();
      perItemCostRef.current?.focus();
      try { perItemCostRef.current?.select?.(); } catch (err) {}
    }
  };

  const onQtyKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const cur = parseInt(qty || '0', 10) || 0;
      let next = cur;
      if (e.key === 'ArrowUp') next = cur + 1;
      if (e.key === 'ArrowDown') next = Math.max(0, cur - 1);
      setQty(String(next));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      sellingPriceRef.current?.focus();
      try { sellingPriceRef.current?.select?.(); } catch (err) {}
    }
  };

  const onPerItemCostKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      qtyRef.current?.focus();
      try { qtyRef.current?.select?.(); } catch (err) {}
    }
  };

  const onSellingPriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      marketPriceRef.current?.focus();
      try { marketPriceRef.current?.select?.(); } catch (err) {}
    }
  };

  const onMarketPriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      wholesalePriceRef.current?.focus();
      try { wholesalePriceRef.current?.select?.(); } catch (err) {}
    }
  };

  const onWholesalePriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      retailPriceRef.current?.focus();
      try { retailPriceRef.current?.select?.(); } catch (err) {}
    }
  };

  const onRetailPriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addButtonRef.current?.focus();
    }
  };

  // Removed automatic loading on mount to improve initial page load and memory usage.
  // Data (items, categories, qty types) will be loaded only when the user presses the "Load" button.

  // Auto-calculate totalCost when per-item cost or qty changes (add form)
  useEffect(() => {
    const p = parseFloat(perItemCost);
    const q = parseFloat(qty);
    if (!isNaN(p) && !isNaN(q)) {
      const tc = (p * q);
      setTotalCost(tc.toFixed(2));
    }
  }, [perItemCost, qty]);

  // Auto-calculate editTotalCost when edit per-item cost or edit qty changes (edit form)
  useEffect(() => {
    const p = parseFloat(editPerItemCost);
    const q = parseFloat(editQty);
    if (!isNaN(p) && !isNaN(q)) {
      const tc = (p * q);
      setEditTotalCost(tc.toFixed(2));
    }
  }, [editPerItemCost, editQty]);

  const showMessage = (msg, type = 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/products/category');
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch (error) {
      showMessage('Error fetching categories');
    }
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

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/products/item');
      if (!res.ok) {
        const txt = await res.text();
        console.error('[CLIENT][fetchItems] Non-OK response', res.status, txt);
        showMessage(`Error fetching items: ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.success) setItems(data.items);
      else {
        console.error('[CLIENT][fetchItems] API error', data);
        showMessage(data.error || 'Failed to fetch items');
      }
    } catch (err) {
      console.error('[CLIENT][fetchItems] Fetch failed', err);
      showMessage('Network error fetching items');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!itemBarcode.trim() || !itemName.trim() || !category || !qty || !qtyType) {
      showMessage('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch('/api/products/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_barcode: itemBarcode,
          item_name: itemName,
          item_description: itemDescription,
          category,
          qty,
          qty_type: qtyType,
          total_cost: totalCost,
          warranty,
          per_item_cost: perItemCost,
          selling_price: sellingPrice,
          market_price: marketPrice,
          wholesale_price: wholesalePrice,
          retail_price: retailPrice,
          expired_date: expiredDate,
          user_name: user?.username || '',
          other
        })
      });
      const data = await res.json();
      if (data.success) {
        // Reset form
        setItemBarcode('');
        setItemName('');
        setItemDescription('');
        setCategory('');
        setQty('');
        setQtyType('');
        setTotalCost('');
        setWarranty('');
        setPerItemCost('');
        setSellingPrice('');
        setMarketPrice('');
        setWholesalePrice('');
        setRetailPrice('');
        setOther('');
        setExpiredDate('');
        
        showMessage('Product added successfully', 'success');
        fetchItems();
        // Reset to first page after adding new item
        setCurrentPage(1);
      } else {
        if (data.error && data.error.startsWith('Barcode already exists')) {
          window.alert(data.error);
        }
        showMessage(data.error || 'Error adding product');
      }
    } catch (error) {
      showMessage('Error adding product');
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.id);
    setEditItemBarcode(item.item_barcode);
    setEditItemName(item.item_name);
    setEditItemDescription(item.item_description);
    setEditCategory(item.category);
    setEditQty(item.qty);
    setEditQtyType(item.qty_type);
    setEditTotalCost(item.total_cost);
    setEditWarranty(item.warranty);
    setEditPerItemCost(item.per_item_cost);
    setEditSellingPrice(item.selling_price);
    setEditMarketPrice(item.market_price);
    setEditWholesalePrice(item.wholesale_price);
    setEditRetailPrice(item.retail_price);
    setEditUserName(item.user_name);
    setEditOther(item.other);
    setEditExpiredDate(item.expired_date || '');
    setMessage('');
  };

  const handleEditSave = async (id) => {
    setMessage('');
    
    if (!editItemBarcode.trim() || !editItemName.trim() || !editCategory || !editQty || !editQtyType) {
      showMessage('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch('/api/products/item', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          item_barcode: editItemBarcode,
          item_name: editItemName,
          item_description: editItemDescription,
          category: editCategory,
          qty: editQty,
          qty_type: editQtyType,
          total_cost: editTotalCost,
          warranty: editWarranty,
          per_item_cost: editPerItemCost,
          selling_price: editSellingPrice,
          market_price: editMarketPrice,
          wholesale_price: editWholesalePrice,
          retail_price: editRetailPrice,
          expired_date: editExpiredDate,
          user_name: user?.username || '',
          other: editOther
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditId(null);
        setEditItemBarcode('');
        setEditItemName('');
        setEditItemDescription('');
        setEditCategory('');
        setEditQty('');
        setEditQtyType('');
        setEditTotalCost('');
        setEditWarranty('');
        setEditUserName('');
        setEditPerItemCost('');
        setEditSellingPrice('');
        setEditMarketPrice('');
        setEditWholesalePrice('');
        setEditRetailPrice('');
        setEditOther('');
        setEditExpiredDate('');
        
        showMessage('Product updated successfully', 'success');
        fetchItems();
      } else {
        showMessage(data.error || 'Error updating product');
      }
    } catch (error) {
      showMessage('Error updating product');
    }
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditItemBarcode('');
    setEditItemName('');
    setEditItemDescription('');
    setEditCategory('');
    setEditQty('');
    setEditQtyType('');
    setEditTotalCost('');
    setEditWarranty('');
    setEditUserName('');
    setEditOther('');
    setMessage('');
  };

  // Search and Pagination functions
  const filteredItems = items.filter(item => 
    item.item_barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.qty_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle numeric fields
    if (sortField === 'id' || sortField === 'qty' || sortField === 'total_cost') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

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
        <ThemeContainer className="product-container" style={{ 
          animation: 'fadeIn 0.5s ease-out',
          maxWidth: '1400px'
        }}>
          {/* Header Section */}
          <div className="product-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
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
                  Register new products and manage existing product information
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
              </div>
            </div>
          </div>

          {/* F1 transient note */}
          {f1NoteVisible && (
            <div style={{ 
              position: 'fixed', 
              top: 14, 
              right: 14, 
              zIndex: 60 
            }}>
              <ThemeCard style={{
                background: theme?.colors.card,
                border: `2px solid ${theme?.colors.primary}`,
                padding: '10px 14px'
              }}>
                <div style={{
                  color: theme?.colors.primary,
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  Press F1 to focus barcode
                </div>
              </ThemeCard>
            </div>
          )}

          {/* Main Content Grid */}
          <ThemeGrid columns="1fr 300px" gap="lg">
            {/* Left Column - Form and Product List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {/* Add Product Form Card */}
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
                  📦 Add New Product
                </h3>
                
                {message && (
                  <MessageAlert message={message} type={messageType} />
                )}

                <form onSubmit={handleAdd}>
                  {/* Basic Details Section */}
                  <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <h4 style={{ 
                      margin: '0 0 var(--spacing-md) 0', 
                      color: theme?.colors.primary, 
                      fontSize: '1.1rem',
                      fontWeight: 600
                    }}>
                      Basic Details
                    </h4>
                    <ThemeGrid columns="repeat(auto-fit, minmax(250px, 1fr))" gap="md">
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: 'var(--spacing-sm)', 
                          fontWeight: 600, 
                          color: theme?.colors.foregroundSecondary,
                          fontSize: '0.85rem'
                        }}>
                          Item Barcode *
                        </label>
                        <ThemeInput
                          type="text"
                          placeholder="Enter item barcode"
                          ref={barcodeRef}
                          value={itemBarcode}
                          onChange={e => setItemBarcode(e.target.value)}
                          onKeyDown={onBarcodeKeyDown}
                          required
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
                          Item Name *
                        </label>
                        <ThemeInput
                          ref={itemNameRef}
                          type="text"
                          placeholder="Enter item name"
                          value={itemName}
                          onChange={e => setItemName(e.target.value)}
                          onKeyDown={onItemNameKeyDown}
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
                          placeholder="Enter item description"
                          value={itemDescription}
                          onChange={e => setItemDescription(e.target.value)}
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
                          Category *
                        </label>
                        <select
                          ref={categoryRef}
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          onKeyDown={onCategoryKeyDown}
                          required
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${theme?.colors.border}`,
                            fontSize: '0.85rem',
                            background: theme?.colors.background,
                            color: theme?.colors.foreground
                          }}
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.category_name}>{cat.category_name}</option>
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
                          Quantity Type *
                        </label>
                        <select
                          ref={qtyTypeRef}
                          value={qtyType}
                          onChange={e => setQtyType(e.target.value)}
                          onKeyDown={onQtyTypeKeyDown}
                          required
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${theme?.colors.border}`,
                            fontSize: '0.85rem',
                            background: theme?.colors.background,
                            color: theme?.colors.foreground
                          }}
                        >
                          <option value="">Select Quantity Type</option>
                          {qtyTypes.map(qt => (
                            <option key={qt.id} value={qt.name}>{qt.name}</option>
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
                          Per Item Cost *
                        </label>
                        <ThemeInput
                          ref={perItemCostRef}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={perItemCost}
                          onChange={e => setPerItemCost(e.target.value)}
                          onKeyDown={onPerItemCostKeyDown}
                          required
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
                          Quantity *
                        </label>
                        <ThemeInput
                          ref={qtyRef}
                          type="number"
                          placeholder="Enter quantity"
                          value={qty}
                          onChange={e => setQty(e.target.value)}
                          onKeyDown={onQtyKeyDown}
                          required
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
                          Total Cost
                        </label>
                        <ThemeInput
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={totalCost}
                          readOnly
                          style={{ 
                            fontSize: '0.85rem',
                            background: theme?.colors.backgroundSecondary,
                            color: theme?.colors.foregroundSecondary
                          }}
                        />
                      </div>
                    </ThemeGrid>
                  </div>

                  {/* Pricing Section */}
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
                          Selling Price
                        </label>
                        <ThemeInput
                          ref={sellingPriceRef}
                          onKeyDown={onSellingPriceKeyDown}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={sellingPrice}
                          onChange={e => setSellingPrice(e.target.value)}
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
                          ref={marketPriceRef}
                          onKeyDown={onMarketPriceKeyDown}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={marketPrice}
                          onChange={e => setMarketPrice(e.target.value)}
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
                          ref={wholesalePriceRef}
                          onKeyDown={onWholesalePriceKeyDown}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={wholesalePrice}
                          onChange={e => setWholesalePrice(e.target.value)}
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
                          ref={retailPriceRef}
                          onKeyDown={onRetailPriceKeyDown}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={retailPrice}
                          onChange={e => setRetailPrice(e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                    </ThemeGrid>
                  </div>

                  {/* Other Details Section */}
                  <div style={{ marginBottom: 'var(--spacing-lg)', display: 'none' }}>
                    <h4 style={{ 
                      margin: '0 0 var(--spacing-md) 0', 
                      color: theme?.colors.primary, 
                      fontSize: '1.1rem',
                      fontWeight: 600
                    }}>
                      Other Details
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
                          Warranty
                        </label>
                        <ThemeInput
                          type="text"
                          placeholder="e.g., 1 year warranty"
                          value={warranty}
                          onChange={e => setWarranty(e.target.value)}
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
                          Expired Date
                        </label>
                        <ThemeInput
                          type="date"
                          value={expiredDate}
                          onChange={e => setExpiredDate(e.target.value)}
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
                          type="text"
                          value={user?.username || ''}
                          disabled
                          style={{ 
                            fontSize: '0.85rem',
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
                          Other Information
                        </label>
                        <ThemeInput
                          type="text"
                          placeholder="Additional information"
                          value={other}
                          onChange={e => setOther(e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                    </ThemeGrid>
                  </div>

                  <ThemeButton 
                    ref={addButtonRef}
                    type="submit"
                    variant="success"
                    style={{
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      fontSize: '0.9rem'
                    }}
                  >
                    Add Product
                  </ThemeButton>
                </form>
              </ThemeCard>

              {/* Products List Card */}
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
                    Products List ({filteredItems.length})
                    {searchTerm && (
                      <span style={{ fontSize: '14px', color: theme?.colors.foregroundSecondary, fontWeight: 'normal', marginLeft: '8px' }}>
                        (Filtered from {items.length} total)
                      </span>
                      
                    )}
                    
                <style>{`\n                  @keyframes blinkHighlight {\n                    0%, 100% { box-shadow: 0 0 0 0 #ffeb3b; background: #1976d2; }\n                    50% { box-shadow: 0 0 12px 4px #ffeb3b; background: #ffeb3b; color: #222; }\n                  }\n                `}</style>
                <ThemeButton
                  onClick={async () => {
                    setRefreshing(true);
                    try {
                      await fetchItems();
                      await fetchCategories();
                      await fetchQtyTypes();
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
                  <span className={refreshing ? 'spin' : ''}>↻</span>
                  {refreshing ? 'Loading...' : 'Load'}
                </ThemeButton>
                  </h3>
                  
                  <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search Box */}
                    <div style={{ position: 'relative' }}>
                      <ThemeInput
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search products..."
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

                {filteredItems.length === 0 ? (
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
                      {searchTerm ? 'No matching products found' : 'No Products Found'}
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                      {searchTerm ? 'Try adjusting your search terms' : 'Add your first product using the form above'}
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
                                userSelect: 'none'
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
                                userSelect: 'none'
                              }}
                              onClick={() => handleSort('item_barcode')}
                            >
                              Barcode <SortIcon field="item_barcode" />
                            </th>
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                              onClick={() => handleSort('item_name')}
                            >
                              Name <SortIcon field="item_name" />
                            </th>
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                              onClick={() => handleSort('category')}
                            >
                              Category <SortIcon field="category" />
                            </th>
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                              onClick={() => handleSort('qty')}
                            >
                              Qty <SortIcon field="qty" />
                            </th>
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                              onClick={() => handleSort('qty_type')}
                            >
                              Type <SortIcon field="qty_type" />
                            </th>
                            <th 
                              style={{ 
                                padding: 'var(--spacing-md)', 
                                textAlign: 'left', 
                                fontWeight: 600, 
                                color: theme?.colors.foregroundSecondary, 
                                borderBottom: `2px solid ${theme?.colors.border}`,
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                              onClick={() => handleSort('total_cost')}
                            >
                              Total Cost <SortIcon field="total_cost" />
                            </th>
                            <th style={{ 
                              padding: 'var(--spacing-md)', 
                              textAlign: 'center', 
                              fontWeight: 600, 
                              color: theme?.colors.foregroundSecondary, 
                              borderBottom: `2px solid ${theme?.colors.border}`, 
                              width: '120px' 
                            }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.map(item => (
                            <tr key={item.id} style={{ 
                              borderBottom: `1px solid ${theme?.colors.border}`,
                              background: editId === item.id ? theme?.colors.primaryLight : 'transparent'
                            }}>
                              <td style={{ 
                                padding: 'var(--spacing-md)', 
                                color: theme?.colors.foregroundSecondary, 
                                fontWeight: 500 
                              }}>
                                #{item.id}
                              </td>
                              
                              <td style={{ padding: 'var(--spacing-md)', fontWeight: '500' }}>
                                {editId === item.id ? (
                                  <ThemeInput
                                    type="text"
                                    value={editItemBarcode}
                                    onChange={e => setEditItemBarcode(e.target.value)}
                                    required
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '6px'
                                    }}
                                  />
                                ) : (
                                  <code style={{ 
                                    background: theme?.colors.backgroundSecondary, 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '0.7rem',
                                    fontFamily: 'monospace',
                                    color: theme?.colors.foreground
                                  }}>
                                    {item.item_barcode}
                                  </code>
                                )}
                              </td>
                              
                              <td style={{ padding: 'var(--spacing-md)', fontWeight: '600' }}>
                                {editId === item.id ? (
                                  <ThemeInput
                                    type="text"
                                    value={editItemName}
                                    onChange={e => setEditItemName(e.target.value)}
                                    required
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '6px'
                                    }}
                                  />
                                ) : (
                                  <div>
                                    {item.item_name}
                                    {item.item_description && (
                                      <div style={{ 
                                        fontSize: '0.65rem', 
                                        color: theme?.colors.foregroundSecondary, 
                                        marginTop: '2px' 
                                      }}>
                                        {item.item_description}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              
                              <td style={{ padding: 'var(--spacing-md)' }}>
                                {editId === item.id ? (
                                  <select
                                    value={editCategory}
                                    onChange={e => setEditCategory(e.target.value)}
                                    required
                                    style={{
                                      width: '100%',
                                      padding: '6px',
                                      borderRadius: '4px',
                                      border: `2px solid ${theme?.colors.primary}`,
                                      fontSize: '0.7rem',
                                      background: theme?.colors.background,
                                      color: theme?.colors.foreground
                                    }}
                                  >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                      <option key={cat.id} value={cat.category_name}>{cat.category_name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span style={{
                                    background: theme?.colors.infoLight,
                                    color: theme?.colors.info,
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    fontWeight: '500'
                                  }}>
                                    {item.category}
                                  </span>
                                )}
                              </td>
                              
                              <td style={{ padding: 'var(--spacing-md)', fontWeight: '600' }}>
                                {editId === item.id ? (
                                  <ThemeInput
                                    type="number"
                                    value={editQty}
                                    onChange={e => setEditQty(e.target.value)}
                                    required
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '6px'
                                    }}
                                  />
                                ) : (
                                  <span style={{
                                    color: item.qty <= 10 ? theme?.colors.error : theme?.colors.success,
                                    background: item.qty <= 10 ? theme?.colors.errorLight : theme?.colors.successLight,
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem'
                                  }}>
                                    {item.qty}
                                  </span>
                                )}
                              </td>
                              
                              <td style={{ padding: 'var(--spacing-md)' }}>
                                {editId === item.id ? (
                                  <select
                                    value={editQtyType}
                                    onChange={e => setEditQtyType(e.target.value)}
                                    required
                                    style={{
                                      width: '100%',
                                      padding: '6px',
                                      borderRadius: '4px',
                                      border: `2px solid ${theme?.colors.primary}`,
                                      fontSize: '0.7rem',
                                      background: theme?.colors.background,
                                      color: theme?.colors.foreground
                                    }}
                                  >
                                    <option value="">Select Type</option>
                                    {qtyTypes.map(qt => (
                                      <option key={qt.id} value={qt.name}>{qt.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span style={{
                                    background: theme?.colors.backgroundSecondary,
                                    color: theme?.colors.foreground,
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem'
                                  }}>
                                    {item.qty_type}
                                  </span>
                                )}
                              </td>
                              
                              <td style={{ 
                                padding: 'var(--spacing-md)', 
                                fontWeight: '600', 
                                color: theme?.colors.success 
                              }}>
                                {editId === item.id ? (
                                  <ThemeInput
                                    type="number"
                                    step="0.01"
                                    value={editTotalCost}
                                    onChange={e => setEditTotalCost(e.target.value)}
                                    required
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '6px'
                                    }}
                                  />
                                ) : (
                                  <span style={{
                                    background: theme?.colors.successLight,
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem'
                                  }}>
                                    Rs. {parseFloat(item.total_cost || 0).toFixed(2)}
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
                                {editId === item.id ? (
                                  <>
                                    <ThemeButton 
                                      onClick={() => handleEditSave(item.id)}
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
                                  <ThemeButton 
                                    onClick={() => handleEditClick(item)}
                                    variant="primary"
                                    style={{
                                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    Edit
                                  </ThemeButton>
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
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} entries
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
                      F1
                    </kbd>
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.8rem' }}>Focus barcode</span>
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
                    <span style={{ marginLeft: 'var(--spacing-sm)', fontSize: '0.8rem' }}>Move to next field</span>
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
                  💡 Tip: Press Enter in Retail Price to submit form.
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
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Products</span>
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
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Filtered</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.info }}>
                      {filteredItems.length}
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
                      setItemBarcode('');
                      setItemName('');
                      setItemDescription('');
                      setCategory('');
                      setQty('');
                      setQtyType('');
                      setTotalCost('');
                      setWarranty('');
                      setPerItemCost('');
                      setSellingPrice('');
                      setMarketPrice('');
                      setWholesalePrice('');
                      setRetailPrice('');
                      setOther('');
                      setExpiredDate('');
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
                      barcodeRef.current?.focus();
                      try { barcodeRef.current?.select?.(); } catch (err) {}
                    }}
                    variant="secondary"
                    style={{
                      padding: 'var(--spacing-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    Focus Barcode
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
            Product Registration System • Total Products: {items.length} • 
            {searchTerm && ` Filtered: ${filteredItems.length} •`}
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

            .product-container > div:first-child {
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