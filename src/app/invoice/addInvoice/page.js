"use client";
import React, { Suspense, lazy, useState, useEffect, useRef } from "react";
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

const SRI_LANKA_BANKS = [
  'Bank of Ceylon',
  'People\'s Bank',
  'Commercial Bank',
  'Hatton National Bank',
  'Sampath Bank',
  'Seylan Bank',
  'Nations Trust Bank',
  'DFCC Bank',
  'Union Bank',
  'Pan Asia Bank',
  'Amana Bank',
  'National Savings Bank',
  'HSBC',
  'Standard Chartered',
  'ICICI Bank',
  'Axis Bank',
  'Other',
];
const CARD_TYPES = ['Visa', 'Master'];

export default function AddInvoicePage() {
  const blockPriceDropdownRef = useRef(false);
  const { theme } = useTheme();
  
  // Small component to show auth check perf (polls metrics every second)
  function AuthPerfDisplay({ perf }) {
    const [authMs, setAuthMs] = React.useState(null);

    React.useEffect(() => {
      let mounted = true;
      function update() {
        try {
          const metrics = perf?.getMetrics?.() || {};
          const funcMetrics = metrics.functions || {};
          // prefer specific key names, fallback to any key containing 'auth'
          let val = funcMetrics['Auth Check'] ?? funcMetrics['auth-check'] ?? funcMetrics['authCheck'] ?? null;
          if (val == null) {
            const key = Object.keys(funcMetrics).find(k => /auth/i.test(k));
            if (key) val = funcMetrics[key];
          }
          if (mounted) setAuthMs(val != null ? Number(val) : null);
        } catch (e) {
          if (mounted) setAuthMs(null);
        }
      }
      update();
      const id = setInterval(update, 1000);
      return () => { mounted = false; clearInterval(id); };
    }, [perf]);

    if (authMs == null) return null;

    const msStr = authMs.toFixed(2) + 'ms';

    function gradeFor(time) {
      // Use the same thresholds as the PerformanceTestPage getPerformanceGrade
      // which treats times in milliseconds
      if (time < 1) return { grade: 'A+', label: 'Excellent', color: theme?.colors.success };
      if (time < 5) return { grade: 'A', label: 'Very Good', color: theme?.colors.success };
      if (time < 10) return { grade: 'B', label: 'Good', color: theme?.colors.info };
      if (time < 20) return { grade: 'C', label: 'Average', color: theme?.colors.warning };
      return { grade: 'D', label: 'Needs Improvement', color: theme?.colors.error };
    }

    const g = gradeFor(authMs);

    return (
      <div style={{ marginTop: '6px', textAlign: 'right' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: theme?.colors.foreground }}>Auth Check</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: g.color }}>{g.grade}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{msStr}</div>
        <div style={{ fontSize: '0.75rem', color: g.color }}>{g.label}</div>
      </div>
    );
  }
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { measureAsync } = usePerformance();
  const perf = usePerformance();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState("");
  const [customer, setCustomer] = useState("Unknown");
  const [customerList, setCustomerList] = useState([]);
  const [defaultCustomer, setDefaultCustomer] = useState(null);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [highlightedCustomerIdx, setHighlightedCustomerIdx] = useState(-1);
  const customerInputRef = useRef();
  
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [warranty, setWarranty] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState('');
  const [currentTime, setCurrentTime] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [itemSearch, setItemSearch] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const itemInputRef = useRef();
  const qtyInputRef = useRef();
  const priceInputRef = useRef();
  const invoiceNumberInputRef = useRef();
  const cashPaymentInputRef = useRef();
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [priceOptions, setPriceOptions] = useState([]);
  const [highlightedPriceIdx, setHighlightedPriceIdx] = useState(-1);
  const [itemPriceDetails, setItemPriceDetails] = useState([]);
  const [selectedItemObj, setSelectedItemObj] = useState(null);
  const [loadedHoldId, setLoadedHoldId] = useState(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [lastSavedInvoiceId, setLastSavedInvoiceId] = useState(null);
  const [selectedMarketPrice, setSelectedMarketPrice] = useState("");
  const [cashPayment, setCashPayment] = useState("");
  const [cardBank, setCardBank] = useState('');
  const [cardType, setCardType] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [lastBill, setLastBill] = useState(null);
  
  const cardNumberInputRef = useRef();
  const cardBankSelectRef = useRef();
  const cardTypeSelectRef = useRef();
  const cardAmountInputRef = useRef();

  // Price cache for performance
  const priceCache = useRef({});
  // Track if price was selected from dropdown or typed manually
  const [isPriceFromDropdown, setIsPriceFromDropdown] = useState(false);
  // Store the selected price row for cost calculation
  const [selectedPriceRow, setSelectedPriceRow] = useState(null);

  const showMessage = (msg, type = 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  // Set current time
  React.useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
    
    const updateTime = () => {
      const t = new Date();
      setCurrentTime(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to get today's date string YYYY-MM-DD
  function getTodayDateString() {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Build a local datetime string using provided date (YYYY-MM-DD) and current local time HH:MM:SS
  function makeLocalDateTimeString(datePart) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    // If caller didn't pass a date part, default to today's date
    const d = datePart || getTodayDateString();
    // Return 'YYYY-MM-DD HH:MM:SS' which is compatible with MySQL DATETIME
    return `${d} ${hh}:${mi}:${ss}`;
  }

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
    fetchAllItems();
  }, [measureAsync]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
  if (data.success) {
        const list = data.customers || [];
        setCustomerList(list);
        // find default 'Unknown' customer by name or code
        const found = list.find(c => (c.customer_name && c.customer_name.toLowerCase() === 'unknown') || (c.customer_code && c.customer_code.toLowerCase() === 'unknown'));
        if (found) {
          setDefaultCustomer(found);
          setSelectedCustomer(found);
          setCustomer(`${found.customer_code} - ${found.customer_name}`);
        }
      }
    } catch (error) {
      showMessage('Error fetching customers');
    }
  };

  const fetchAllItems = async () => {
    try {
      const res = await fetch('/api/products/item');
      const data = await res.json();
      if (data.success) setAllItems(data.items || []);
    } catch (error) {
      showMessage('Error fetching items');
    }
  };

  // Filter customers
  useEffect(() => {
    if (!customer) {
      setFilteredCustomers([]);
      setCustomerDropdownOpen(false);
      setHighlightedCustomerIdx(-1);
      return;
    }
    const q = customer.toLowerCase();
    const filtered = customerList.filter(cust =>
      cust.customer_code?.toLowerCase().includes(q) ||
      cust.customer_name?.toLowerCase().includes(q)
    );
    setFilteredCustomers(filtered);
    setCustomerDropdownOpen(filtered.length > 0);
    setHighlightedCustomerIdx(filtered.length > 0 ? 0 : -1);
  }, [customer, customerList]);

  // Debounce item search
  const debounceTimeout = useRef();
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (!itemSearch) setFilteredItems([]);
      else {
        const q = itemSearch.toLowerCase();
        setFilteredItems(
          allItems.filter(it =>
            it.item_barcode?.toLowerCase().includes(q) ||
            it.item_name?.toLowerCase().includes(q)
          )
        );
      }
    }, 200);
    return () => clearTimeout(debounceTimeout.current);
  }, [itemSearch, allItems]);

  // Filter items and auto-load prices when item is selected - FIXED VERSION
  useEffect(() => {
    if (!itemSearch) {
      setFilteredItems([]);
      setDropdownOpen(false);
      setPriceOptions([]);
      setHighlightedPriceIdx(-1);
      setPrice("");
      setSelectedMarketPrice("");
      setSelectedItemObj(null);
      setWarranty("");
      setIsPriceFromDropdown(false);
      setSelectedPriceRow(null);
    } else {
      const q = itemSearch.toLowerCase();
      const exactBarcodeMatch = allItems.filter(it => it.item_barcode?.toLowerCase() === q);

      // If there is an exact barcode match, show it in the dropdown but do NOT
      // automatically select it or focus/change the qty. Wait for an explicit
      // user action (Enter key or click) to select/add the item.
      if (exactBarcodeMatch.length === 1) {
        setFilteredItems(exactBarcodeMatch);
        setDropdownOpen(true);
        setHighlightedIdx(0);
        // Intentionally do NOT call setSelectedItemObj, setItemSearch or loadItemPrices
        // here so qty won't be auto-focused/changed. Selection happens via Enter/click.
      } else {
        const filtered = allItems.filter(it =>
          it.item_barcode?.toLowerCase().includes(q) ||
          it.item_name?.toLowerCase().includes(q)
        );
        setFilteredItems(filtered);
        setDropdownOpen(filtered.length > 0);
      }
    }
  }, [itemSearch, allItems]);

  // Separate function to load item prices
  const loadItemPrices = async (item) => {
    setSelectedItemObj(item);
    try {
      if (priceCache.current[item.id]) {
        setPriceOptions(priceCache.current[item.id]);
        setHighlightedPriceIdx(0);
        const firstPrice = priceCache.current[item.id][0];
        if (firstPrice?.market_price != null) {
          setPrice(firstPrice.market_price.toString());
          setSelectedMarketPrice(firstPrice.market_price.toString());
          setIsPriceFromDropdown(true);
          setSelectedPriceRow(firstPrice);
        }
      } else {
  setPriceOptions([]);
  const res = await fetch(`/api/products/price?item_id=${item.id}`, { cache: 'no-store' });
  const data = await res.json();
        if (data.success && Array.isArray(data.prices) && data.prices.length > 0) {
          priceCache.current[item.id] = data.prices;
          setPriceOptions(data.prices);
          setHighlightedPriceIdx(0);
          const firstPrice = data.prices[0];
          if (firstPrice.market_price != null) {
            setPrice(firstPrice.market_price.toString());
            setSelectedMarketPrice(firstPrice.market_price.toString());
            setIsPriceFromDropdown(true);
            setSelectedPriceRow(firstPrice);
          }
        }
      }
    } catch (error) {
      console.error('Error loading prices:', error);
      setPriceOptions([]);
    }

    // Set default quantity and focus on quantity field
    setQty(1);
    setTimeout(() => {
      if (qtyInputRef.current) {
        qtyInputRef.current.focus();
        qtyInputRef.current.select();
      }
    }, 50);
  };

  // Auto-load prices when item is selected
  const handleItemSelect = async (item) => {
    // Optimistic UI: set the selected item immediately for fast entry
    setSelectedItemObj(item);
    // Background refresh: fetch authoritative row and merge when it arrives
    (async () => {
      try {
        const res = await fetch(`/api/products/item?item_id=${item.id}`, { cache: 'no-store' });
        const j = await res.json();
        if (j && j.success && j.item) {
          const fresh = j.item;
          // Merge into allItems (replace existing entry)
          setAllItems(prev => {
            const found = prev.find(p => Number(p.id) === Number(fresh.id));
            if (found) return prev.map(p => Number(p.id) === Number(fresh.id) ? { ...p, ...fresh } : p);
            return [fresh, ...prev];
          });
          // If the currently selected item is the same one, update it to the fresh row
          setSelectedItemObj(prev => (prev && Number(prev.id) === Number(fresh.id)) ? { ...prev, ...fresh } : prev);
          // Invalidate price cache for this item so price fetches are fresh
          try { delete priceCache.current[item.id]; } catch (e) {}
        }
      } catch (err) {
        console.warn('Background refresh of selected item failed', err);
      }
    })();
    // Prefill warranty from item record (loaded from /api/products/item)
    setWarranty(item.warranty ?? "");
    setItemSearch(item.item_name);
    setFilteredItems([]);
    setDropdownOpen(false);
    setHighlightedIdx(-1);
    setIsPriceFromDropdown(false);
    setSelectedPriceRow(null);
    
    // Set default quantity to 1 when item is selected
    setQty(1);

    // Load price options for selected item (kept after refreshing selectedItemObj)
    try {
      if (priceCache.current[item.id]) {
        setPriceOptions(priceCache.current[item.id]);
        setHighlightedPriceIdx(0);
        const firstPrice = priceCache.current[item.id][0];
        if (firstPrice?.market_price != null) {
          setPrice(firstPrice.market_price.toString());
          setSelectedMarketPrice(firstPrice.market_price.toString());
          setIsPriceFromDropdown(true);
          setSelectedPriceRow(firstPrice);
        }
      } else {
        setPriceOptions([]);
        const res = await fetch(`/api/products/price?item_id=${item.id}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.prices) && data.prices.length > 0) {
          priceCache.current[item.id] = data.prices;
          setPriceOptions(data.prices);
          setHighlightedPriceIdx(0);
          const firstPrice = data.prices[0];
          if (firstPrice.market_price != null) {
            setPrice(firstPrice.market_price.toString());
            setSelectedMarketPrice(firstPrice.market_price.toString());
            setIsPriceFromDropdown(true);
            setSelectedPriceRow(firstPrice);
          }
        }
      }
    } catch (error) {
      console.error('Error loading prices:', error);
      setPriceOptions([]);
    }

    // FIX: Qty field eka focus wena thana delay ekak denna
    setTimeout(() => {
      if (qtyInputRef.current) {
        qtyInputRef.current.focus();
        qtyInputRef.current.select();
      }
    }, 50); // 50ms delay for better reliability
  };

  // Hide dropdown when exact match
  useEffect(() => {
    if (itemSearch && allItems.some(it => it.item_name === itemSearch || it.item_barcode === itemSearch)) {
      setFilteredItems([]);
      setHighlightedIdx(-1);
      setDropdownOpen(false);
    }
  }, [itemSearch, allItems]);

  useEffect(() => {
    setHighlightedIdx(filteredItems.length > 0 ? 0 : -1);
  }, [filteredItems]);

  // Item search keyboard handling - FIXED VERSION
  function handleItemSearchKeyDown(e) {
    if (filteredItems.length === 0) {
      if (e.key === 'Enter') {
        if (!itemSearch.trim()) {
          setDropdownOpen(false);
          e.preventDefault();
          return;
        }
        const found = allItems.find(it =>
          it.item_barcode === itemSearch ||
          it.item_name === itemSearch
        );
        if (found) {
          handleItemSelect(found);
          // FIX: Enter press karama qty field eka focus wenna
          setTimeout(() => {
            if (qtyInputRef.current) {
              qtyInputRef.current.focus();
              qtyInputRef.current.select();
            }
          }, 50);
        }
        setDropdownOpen(false);
        e.preventDefault();
        return;
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      setHighlightedIdx(idx => Math.min(idx + 1, filteredItems.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlightedIdx(idx => Math.max(idx - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const exactBarcode = allItems.find(it => it.item_barcode === itemSearch);
      if (exactBarcode) {
        handleItemSelect(exactBarcode);
        // FIX: Enter press karama qty field eka focus wenna
        setTimeout(() => {
          if (qtyInputRef.current) {
            qtyInputRef.current.focus();
            qtyInputRef.current.select();
          }
        }, 50);
        e.preventDefault();
        return;
      }
      if (highlightedIdx >= 0 && highlightedIdx < filteredItems.length) {
        handleItemSelect(filteredItems[highlightedIdx]);
        // FIX: Enter press karama qty field eka focus wenna
        setTimeout(() => {
          if (qtyInputRef.current) {
            qtyInputRef.current.focus();
            qtyInputRef.current.select();
          }
        }, 50);
        e.preventDefault();
      }
    }
  }

  // Price dropdown handling - Improved version
  async function handlePriceFocus() {
    if (blockPriceDropdownRef.current || !selectedItemObj) return;
    
    if (priceCache.current[selectedItemObj.id]) {
      setPriceOptions(priceCache.current[selectedItemObj.id]);
      setHighlightedPriceIdx(0);
      return;
    }

    try {
      const res = await fetch(`/api/products/price?item_id=${selectedItemObj.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.prices) && data.prices.length > 0) {
        priceCache.current[selectedItemObj.id] = data.prices;
        setPriceOptions(data.prices);
        setHighlightedPriceIdx(0);
      }
    } catch {
      setPriceOptions([]);
    }
  }

  function handlePriceKeyDown(e) {
    if (e.key === 'ArrowDown') {
      if (priceOptions.length === 0) return;
      setHighlightedPriceIdx(idx => {
        const newIdx = Math.min(idx + 1, priceOptions.length - 1);
        const opt = priceOptions[newIdx];
        setPrice(opt.market_price != null ? opt.market_price.toString() : '');
        setSelectedMarketPrice(opt.market_price != null ? opt.market_price.toString() : '');
        setIsPriceFromDropdown(true);
        setSelectedPriceRow(opt);
        return newIdx;
      });
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      if (priceOptions.length === 0) return;
      setHighlightedPriceIdx(idx => {
        const newIdx = Math.max(idx - 1, 0);
        const opt = priceOptions[newIdx];
        setPrice(opt.market_price != null ? opt.market_price.toString() : '');
        setSelectedMarketPrice(opt.market_price != null ? opt.market_price.toString() : '');
        setIsPriceFromDropdown(true);
        setSelectedPriceRow(opt);
        return newIdx;
      });
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (price && itemSearch && qty) {
        handleAddItem();
        e.preventDefault();
      }
    } else {
      // If user starts typing, mark as manual price entry
      setIsPriceFromDropdown(false);
    }
  }

  // Handle manual price change
  const handlePriceChange = (e) => {
    setPrice(e.target.value);
    setIsPriceFromDropdown(false);
  };

  // Enhanced Add item function - FIXED VERSION with ALWAYS including cost price
  function handleAddItem() {
    if (!selectedItemObj) {
      setMessage("Select a valid item from the list");
      return;
    }
    if (!qty || !price) {
      setMessage("Fill quantity and price fields");
      return;
    }

    // Check available stock before adding
    try {
      const desiredQty = Number(qty);
      const availableQty = selectedItemObj?.qty != null ? Number(selectedItemObj.qty) : null;
      if (availableQty != null && !isNaN(availableQty)) {
        if (desiredQty > availableQty) {
          // Show alert to user and prevent adding
          alert(`Insufficient stock. Available: ${availableQty}`);
          return;
        }
      }
    } catch (err) {
      // ignore parse errors and proceed
      console.warn('Stock check parse error', err);
    }

    let priceRow = selectedPriceRow;
    let marketPrice = price;
    let sellingPrice = price;
    let costPrice = '';

    // ALWAYS try to get cost price from database, regardless of how price was entered
    if (!priceRow && priceOptions.length > 0) {
      // Try to find matching price row
      priceRow = priceOptions.find(p =>
        String(p.market_price) === String(price) ||
        String(p.selling_price) === String(price) ||
        String(p.retail_price) === String(price) ||
        String(p.wholesale_price) === String(price)
      );

      // If no exact match, use the first available price row for cost price
      if (!priceRow && priceOptions.length > 0) {
        priceRow = priceOptions[0];
      }
    }

    // Set prices based on selection method
    if (isPriceFromDropdown && priceRow) {
      // Price selected from dropdown - use database prices
      marketPrice = priceRow.market_price != null ? priceRow.market_price.toString() : price;
      sellingPrice = priceRow.selling_price != null ? priceRow.selling_price.toString() : price;
    } else {
      // Price typed manually - use user entered price for market and selling
      marketPrice = price;
      sellingPrice = price;
    }

    // ALWAYS get cost price from database if available
    if (priceRow && priceRow.per_item_cost != null) {
      costPrice = priceRow.per_item_cost.toString();
    }

    blockPriceDropdownRef.current = true;
    setItems(prev => [
      ...prev,
      {
        itemName: selectedItemObj.item_name,
        qty: Number(qty),
        price: sellingPrice, // Use selling price for the main price field
        selling_price: sellingPrice,
        itemId: selectedItemObj.id,
        barcode: selectedItemObj.item_barcode,
        market_price: marketPrice,
        orig_market_price: marketPrice,
        cost: costPrice, // ALWAYS include cost price from database
        warranty: warranty || ''
      }
    ]);

    // Reset form
    setItemSearch("");
    setFilteredItems([]);
    setQty(1);
    setPrice("");
    setWarranty("");
    setSelectedMarketPrice("");
    setPriceOptions([]);
    setHighlightedPriceIdx(-1);
    setSelectedItemObj(null);
    setMessage("");
    setIsPriceFromDropdown(false);
    setSelectedPriceRow(null);

    setTimeout(() => {
      setPriceOptions([]);
      setHighlightedPriceIdx(-1);
      itemInputRef.current?.focus();
      setTimeout(() => { blockPriceDropdownRef.current = false; }, 200);
    }, 100);
  }

  function handleRemoveItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    // Invoice number is optional now
    if (!date || !selectedCustomer || items.length === 0) {
      setMessage("Fill date, select customer and add at least one item");
      setLoading(false);
      return;
    }
    // Require at least one payment (cash or card) before saving invoice
    const cash_payment_check = parseFloat(cashPayment) || 0;
    const card_payment_check = parseFloat(cardAmount) || 0;
    if ((cash_payment_check + card_payment_check) <= 0) {
      setMessage('Enter Cash Paid or Card Amount before saving the invoice');
      setLoading(false);
      // focus the cash input for convenience
      try { cashPaymentInputRef.current?.focus(); } catch (e) {}
      return;
    }
    try {
      // Compute aggregates to send to server
      const net_total = netTotal; // computed above
      const total_discount = discount; // computed above
      const total_cost = totalAddedCost; // computed above
      const total_profit = profit; // computed above
      const cash_payment = parseFloat(cashPayment) || 0;
      const card_payment = parseFloat(cardAmount) || 0;
      const card_info = cardNumber ? `${cardNumber} | ${cardBank || ''} | ${cardType || ''}` : '';
      // user info from localStorage (if available)
      let userName = '';
      try { userName = typeof window !== 'undefined' && localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username || '' : ''; } catch (err) { userName = ''; }

      let res;
      // Build a full local datetime (date + now time) to store date_time in DB
      const dateTimeString = makeLocalDateTimeString(date);

      if (editingInvoiceId) {
        res = await fetch('/api/invoice/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId: editingInvoiceId,
            invoiceNumber,
            date: dateTimeString,
            customerId: selectedCustomer ? selectedCustomer.id : null,
            customerName: customer,
            netTotal: net_total,
            totalDiscount: total_discount,
            totalCost: total_cost,
            totalProfit: total_profit,
            cashPayment: cash_payment,
            cardPayment: card_payment,
            cardInfo: card_info,
            userName,
            status: 'completed',
            items
          })
        });
      } else {
        res = await fetch('/api/invoice/addInvoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceNumber,
            date: dateTimeString,
            customerId: selectedCustomer ? selectedCustomer.id : null,
            customerName: customer,
            netTotal: net_total,
            totalDiscount: total_discount,
            totalCost: total_cost,
            totalProfit: total_profit,
            cashPayment: cash_payment,
            cardPayment: card_payment,
            cardInfo: card_info,
            userName,
            status: 'completed',
            items
          })
        });
      }
      const data = await res.json();
      if (data.success) {
        // Store the last saved invoice ID
        setLastSavedInvoiceId(data.invoiceId || editingInvoiceId);
        // If this invoice was loaded from a hold, remove the hold after successful save
        if (loadedHoldId) {
          try {
            await fetch('/api/invoice/hold/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ holdId: loadedHoldId })
            });
            setLoadedHoldId(null);
          } catch (err) {
            console.warn('Failed to delete hold after saving invoice', err);
          }
        }
        // Open thermal print in a new window/tab.
        // To avoid popup blockers we open a blank window during the user gesture
        // and navigate it after the async save returns.
        let printWin = null;
        try {
          // Try to open a blank window immediately (this is more likely to be allowed as it's still within the user action)
          printWin = window.open('about:blank', '_blank');
        } catch (err) {
          console.warn('Opening blank print window failed', err);
          printWin = null;
        }

        try {
          const printId = data.invoiceId || editingInvoiceId;
          const printUrl = `/invoice/print/${printId}?auto=1`;
          console.log('Navigating print window to:', printUrl);
          if (printWin && !printWin.closed) {
            try {
              printWin.location.href = printUrl;
            } catch (err) {
              // assigning location may fail in some cross-origin or blocked cases; fallback to window.open
              console.warn('Failed to navigate opened print window, falling back to open()', err);
              window.open(printUrl, '_blank');
            }
          } else {
            // If the blank window couldn't be opened earlier (or was closed), open normally now
            window.open(printUrl, '_blank');
          }
        } catch (err) {
          console.warn('Failed to open/route print window', err);
          if (printWin && !printWin.closed) try { printWin.close(); } catch(e) {}
        }

        // Save last bill info to show in the Last Bill Info panel
        try {
          const cashPaidVal = parseFloat(cashPayment) || 0;
          const cardPaidVal = parseFloat(cardAmount) || 0;
          const totalPaid = cashPaidVal + cardPaidVal;
          const bal = totalPaid - net_total;
          setLastBill({ netTotal: Number(net_total).toFixed(2), cashPaid: cashPaidVal.toFixed(2), cardPaid: cardPaidVal.toFixed(2), totalPaid: totalPaid.toFixed(2), balance: bal.toFixed(2), numberOfItems: items.length });
        } catch (e) {
          setLastBill({ netTotal: Number(net_total).toFixed(2), cashPaid: '0.00', cardPaid: '0.00', totalPaid: '0.00', balance: (0 - net_total).toFixed(2), numberOfItems: items.length });
        }

        // --- POST to cashbook: store invoice movement (cash/card) ---
        try {
          const savedInvoiceId = data.invoiceId || editingInvoiceId || invoiceNumber || '';
          // cashApplied and cardApplied are computed in component scope
          const cashToStore = Number(cashApplied) || 0;
          const bankToStore = Number(cardApplied) || 0;
          // other: include card details when card amount was used
          const cardInfo = cardNumber ? `${cardNumber} | ${cardBank || ''} | ${cardType || ''}` : '';
          const cbPayload = {
            date: dateTimeString,
            remark: `Invoice ${savedInvoiceId}`,
            other: cardInfo,
            cash: cashToStore,
            bank: bankToStore,
            user: userName || 'system'
          };
          // Only attempt when there's something meaningful to store (invoice id present)
          if (savedInvoiceId) {
            fetch('/api/cashbook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cbPayload)
            }).then(r => r.json()).then(j => {
              if (!j.success) console.warn('Cashbook POST failed', j.error);
            }).catch(err => console.warn('Failed to post to cashbook', err));
          }
        } catch (err) {
          console.warn('Cashbook logging failed', err);
        }

        showMessage('Invoice saved!', 'success');
        // If server returned updated item rows, merge them into local allItems
        try {
          if (data.updatedItems && Array.isArray(data.updatedItems) && data.updatedItems.length > 0) {
            const updatedMap = {};
            data.updatedItems.forEach(it => { updatedMap[Number(it.id)] = it; });
            // Merge into allItems (preserve other fields)
            setAllItems(prev => prev.map(p => {
              const upd = updatedMap[Number(p.id)];
              if (upd) {
                return { ...p, qty: upd.qty, item_name: upd.item_name ?? p.item_name, item_barcode: upd.item_barcode ?? p.item_barcode, selling_price: upd.selling_price ?? p.selling_price, market_price: upd.market_price ?? p.market_price, cost: upd.cost ?? p.cost };
              }
              return p;
            }));

            // If selectedItemObj is one of the updated items, refresh it too
            if (selectedItemObj && updatedMap[Number(selectedItemObj.id)]) {
              const u = updatedMap[Number(selectedItemObj.id)];
              setSelectedItemObj(prev => prev ? { ...prev, qty: u.qty, item_name: u.item_name ?? prev.item_name, item_barcode: u.item_barcode ?? prev.item_barcode, selling_price: u.selling_price ?? prev.selling_price, market_price: u.market_price ?? prev.market_price, cost: u.cost ?? prev.cost } : prev);
            }

            // Invalidate price cache for affected items to ensure future price fetches are fresh
            try {
              Object.keys(priceCache.current || {}).forEach(k => {
                if (updatedMap[Number(k)]) delete priceCache.current[k];
              });
            } catch (e) {
              // ignore cache invalidation errors
            }
          }
        } catch (err) {
          console.warn('Failed to merge updated items into local cache', err);
        }
        // Clear form inputs but keep lastBill visible
        setInvoiceNumber("");
        setDate(getTodayDateString());
        setCustomer(defaultCustomer ? `${defaultCustomer.customer_code} - ${defaultCustomer.customer_name}` : 'Unknown');
        setSelectedCustomer(defaultCustomer || null);
        setItems([]);
        // clear payment inputs (the persisted lastBill stores the previous values)
        setCashPayment("");
        setCardAmount("");
        setCardNumber("");
        setCardBank("");
        setCardType("");
  // Optionally clear editingInvoiceId after save
  // setEditingInvoiceId(null);
      } else {
        showMessage(data.error || 'Error saving invoice');
      }
    } catch (err) {
      showMessage('Error saving invoice');
    } finally {
      setLoading(false);
    }
  }

  // Hold invoice: save current invoice+items to invoice_hold
  async function handleHold() {
    // Require at least one item before holding
    if (!items || !Array.isArray(items) || items.length === 0) {
      alert('Add at least one item before holding the invoice');
      return;
    }
    // Invoice number is optional for holding.
    // Ensure we have sensible local values (don't rely on async setState)
    const localDate = date || getTodayDateString();
    const localSelCust = selectedCustomer || defaultCustomer || { id: null, customer_code: '', customer_name: 'Unknown' };
    const localCustomerName = selectedCustomer ? customer : (localSelCust.customer_name ? `${localSelCust.customer_code} - ${localSelCust.customer_name}` : 'Unknown');

    // Prompt for remark
    const remark = prompt('Enter a remark for this hold (optional)');

    // Build full local datetime for hold as well
    const holdDateTime = makeLocalDateTimeString(localDate);

  // Ensure items is an array when sending (defensive)
  const itemsToSend = Array.isArray(items) ? items : [items];

  const payload = {
      invoiceNumber,
      date: holdDateTime,
      customerId: localSelCust ? localSelCust.id : null,
      customerName: localCustomerName,
      netTotal: netTotal,
      totalDiscount: discount,
      totalCost: totalAddedCost,
      totalProfit: profit,
      cashPayment: parseFloat(cashPayment) || 0,
      cardPayment: parseFloat(cardAmount) || 0,
      cardInfo: cardNumber ? `${cardNumber} | ${cardBank || ''} | ${cardType || ''}` : '',
      userName: typeof window !== 'undefined' && localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username || '' : '',
      remark: remark || '',
      items: itemsToSend
    };
    try {
      const res = await fetch('/api/invoice/hold/saveHold', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        alert('Invoice held successfully (id: ' + data.holdId + ')');
        // clear current form
        setInvoiceNumber('');
        setDate(getTodayDateString());
        setCustomer(defaultCustomer ? `${defaultCustomer.customer_code} - ${defaultCustomer.customer_name}` : 'Unknown');
        setSelectedCustomer(defaultCustomer || null);
        setItems([]);
      } else alert(data.error || 'Error holding invoice');
    } catch (err) {
      console.error(err);
      alert('Error holding invoice');
    }
  }

  // Keyboard shortcut: F9 to trigger the Hold button click
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'F9') {
        e.preventDefault();
        const btn = document.getElementById('holdBtn');
        if (btn) {
          btn.click();
        } else {
          // fallback to calling the handler directly
          try { handleHold(); } catch (err) { console.error('F9 hold failed', err); }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleHold]);

  // Keyboard shortcut: F3 to trigger Delete/Clear button
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        const btn = document.getElementById('deleteBtn');
        if (btn) {
          btn.click();
        } else {
          try { handleDeleteOrClear(); } catch (err) { console.error('F3 delete failed', err); }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDeleteOrClear]);

  // Load a hold: list holds, prompt for an id, and load it into the form
  async function handleLoadHold() {
    try {
  const res = await fetch('/api/invoice/hold/list', { cache: 'no-store' });
  const data = await res.json();
      if (!data.success) return alert('Error loading holds');
      if (!data.holds || data.holds.length === 0) return alert('No holds found');
      // Build a simple selection list string
      const listStr = data.holds.map(h => `${h.id}: ${h.invoice_number || '-'} | ${h.date_time || '-'} | ${h.remark || '-'} | Rs.${h.net_total}`).join('\n');
      const pick = prompt('Holds:\n' + listStr + '\n\nEnter hold ID to load');
      if (!pick) return;
      const id = pick.trim();
  const res2 = await fetch('/api/invoice/hold/get/' + id, { cache: 'no-store' });
  const d2 = await res2.json();
      if (!d2.success) return alert(d2.error || 'Hold not found');
      const h = d2.hold;
      const its = d2.items || [];
      // Populate form
      setInvoiceNumber(h.invoice_number || '');
      // When loading a hold, set the date to today (and time to current time)
      setDate(getTodayDateString());
      // Update currentTime to now so the UI shows the current time (the interval effect will keep it updated)
      const nowForDisplay = new Date();
      setCurrentTime(nowForDisplay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      // remember which hold was loaded so we can delete it after saving
      setLoadedHoldId(h.id || null);

      // Try to find full customer object from loaded customer list
      const custId = h.customer_id;
      if (custId) {
        // First try to find in the already-loaded customerList
        let found = customerList.find(c => Number(c.id) === Number(custId));
        if (found) {
          setSelectedCustomer(found);
          setCustomer(`${found.customer_code} - ${found.customer_name}`);
          setCustomerDropdownOpen(false);
        } else {
          // If customerList is empty or not loaded yet, fetch the full customers list and try again
          if (!customerList || customerList.length === 0) {
            try {
              const allRes = await fetch('/api/customers', { cache: 'no-store' });
              const allData = await allRes.json();
              if (allData && allData.success && Array.isArray(allData.customers)) {
                setCustomerList(allData.customers);
                found = allData.customers.find(c => Number(c.id) === Number(custId));
              }
            } catch (e) {
              // ignore and fallback to single-customer fetch below
              console.warn('Failed to fetch customers list while loading hold', e);
            }
          }

          if (found) {
            setSelectedCustomer(found);
            setCustomer(`${found.customer_code} - ${found.customer_name}`);
            setCustomerDropdownOpen(false);
          } else {
            // fallback: try fetching single customer from API and add to list if available
            fetch('/api/customers/get?customer_id=' + encodeURIComponent(custId), { cache: 'no-store' })
              .then(r => r.json())
              .then(cd => {
                if (cd && cd.success && cd.customer) {
                  // Add the fetched customer to the list so the dropdown can show it
                  setCustomerList(prev => {
                    try {
                      if (prev.some(p => Number(p.id) === Number(cd.customer.id))) return prev;
                      return [...prev, cd.customer];
                    } catch (e) { return prev; }
                  });
                  setSelectedCustomer(cd.customer);
                  setCustomer(`${cd.customer.customer_code} - ${cd.customer.customer_name}`);
                  setCustomerDropdownOpen(false);
                } else {
                  // set a sensible fallback when customer record is not available
                  setSelectedCustomer(null);
                  // Prefer the hold's stored customer name if present
                  const storedName = h.customer_name || null;
                  setCustomer(storedName ? `${storedName}` : `Customer #${custId}`);
                }
              })
              .catch(() => {
                setSelectedCustomer(null);
                const storedName = h.customer_name || null;
                setCustomer(storedName ? `${storedName}` : `Customer #${custId}`);
              });
          }
        }
      } else {
  setSelectedCustomer(defaultCustomer || null);
              setCustomer(defaultCustomer ? `${defaultCustomer.customer_code} - ${defaultCustomer.customer_name}` : 'Unknown');
      }
      setItems(its.map(it => ({
        itemName: it.item_name,
        qty: Number(it.qty),
        price: it.selling_price != null ? it.selling_price : it.market_price,
        selling_price: it.selling_price,
        itemId: it.item_id,
        barcode: it.barcode,
        market_price: it.market_price,
        orig_market_price: it.market_price,
        cost: it.cost,
        warranty: it.warranty || ''
      })));
    } catch (err) { console.error(err); alert('Error loading holds'); }
  }

  // Load an existing invoice for editing
  async function handleLoadInvoice() {
    try {
      const pick = prompt('Enter Invoice ID to load for edit');
      if (!pick) return;
      const id = pick.trim();
      const res = await fetch('/api/invoice/get/' + id);
      const data = await res.json();
      if (!data.success) return alert(data.error || 'Invoice not found');
      const h = data.invoice;
      const its = data.items || [];
      setInvoiceNumber(h.invoice_number || '');
      setDate(h.date_time ? h.date_time.split('T')[0] : '');
      setEditingInvoiceId(h.id);
      // Try to find customer object in list
      if (h.customer_id) {
        const found = customerList.find(c => Number(c.id) === Number(h.customer_id));
        if (found) {
          setSelectedCustomer(found);
          setCustomer(`${found.customer_code} - ${found.customer_name}`);
        } else {
          // If we don't have full customer object, keep selectedCustomer null and show an informative string
          setSelectedCustomer(null);
          setCustomer(`Customer #${h.customer_id}`);
        }
      } else {
  setSelectedCustomer(defaultCustomer || null);
  setCustomer(defaultCustomer ? `${defaultCustomer.customer_code} - ${defaultCustomer.customer_name}` : '');
      }
      setItems(its.map(it => ({
        itemName: it.item_name,
        qty: Number(it.qty),
        price: it.selling_price != null ? it.selling_price : it.market_price,
        selling_price: it.selling_price,
        itemId: it.item_id,
        barcode: it.barcode,
        market_price: it.market_price,
        orig_market_price: it.market_price,
        cost: it.cost,
        warranty: it.warranty || ''
      })));
    } catch (err) { console.error(err); alert('Error loading invoice'); }
  }

  // Delete loaded hold (if any) or clear the invoice form
  async function handleDeleteOrClear() {
    // If a hold was loaded, delete it from DB
    if (loadedHoldId) {
      const ok = confirm('Delete this held invoice (ID: ' + loadedHoldId + ')? This will remove it permanently.');
      if (!ok) return;
      try {
        const res = await fetch('/api/invoice/hold/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ holdId: loadedHoldId })
        });
        const data = await res.json();
        if (data.success) {
          alert('Hold deleted');
          // Clear form
          setInvoiceNumber('');
          setDate(getTodayDateString());
          setCustomer(defaultCustomer ? `${defaultCustomer.customer_code} - ${defaultCustomer.customer_name}` : 'Unknown');
          setSelectedCustomer(defaultCustomer || null);
          setItems([]);
          setLoadedHoldId(null);
        } else {
          alert(data.error || 'Failed to delete hold');
        }
      } catch (err) {
        console.error('delete hold failed', err);
        alert('Failed to delete hold');
      }
    } else {
      // No loaded hold - just clear the form
      const ok = confirm('Clear the current invoice form?');
      if (!ok) return;
      setInvoiceNumber('');
      setDate(getTodayDateString());
      setCustomer(defaultCustomer ? `${defaultCustomer.customer_code} - ${defaultCustomer.customer_name}` : 'Unknown');
      setSelectedCustomer(defaultCustomer || null);
      setItems([]);
      setCashPayment('');
      setCardAmount('');
      setCardNumber('');
      setLoadedHoldId(null);
      showMessage('Form cleared', 'success');
    }
  }

  // Item price details - Load when item is selected
  useEffect(() => {
    if (selectedItemObj) {
      fetch(`/api/products/price?item_id=${selectedItemObj.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.prices)) {
            setItemPriceDetails(data.prices);
          } else {
            setItemPriceDetails([]);
          }
        })
        .catch(() => setItemPriceDetails([]));
    } else {
      setItemPriceDetails([]);
    }
  }, [selectedItemObj]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleGlobalShortcuts(e) {
      if (e.code === 'F1') {
        e.preventDefault();
        itemInputRef.current?.focus();
      }
      else if (e.code === 'F2') {
        e.preventDefault();
        setItems(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
      }
      else if (e.code === 'F5') {
        e.preventDefault();
        cashPaymentInputRef.current?.focus();
      }
      else if (e.altKey && e.code === 'KeyW') {
        e.preventDefault();
        invoiceNumberInputRef.current?.focus();
      }
      
      else if (e.code === 'F10') {
        e.preventDefault();
        // Load a hold
        try { handleLoadHold(); } catch (err) { console.warn('F10 load hold failed', err); }
      }
      // Clear item and price inputs/dropdowns when pressing F4
      else if (e.code === 'F4') {
        e.preventDefault();
        // Clear item search and dropdown
        setItemSearch("");
        setFilteredItems([]);
        setDropdownOpen(false);
        setHighlightedIdx(-1);
        setSelectedItemObj(null);

        // Clear price and price dropdown
        setPrice("");
        setPriceOptions([]);
        setHighlightedPriceIdx(-1);
        setSelectedPriceRow(null);
        setIsPriceFromDropdown(false);

        // Focus item input for quick typing
        setTimeout(() => {
          itemInputRef.current?.focus();
          itemInputRef.current?.select?.();
        }, 0);
      }
      // Add item shortcut - Ctrl + Enter in price field
      else if (e.ctrlKey && e.key === 'Enter' && document.activeElement === priceInputRef.current) {
        e.preventDefault();
        handleAddItem();
      }
    }
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  // Calculations
  const subTotal = items.reduce((sum, it) => sum + ((it.orig_market_price && it.qty) ? (parseFloat(it.qty) * parseFloat(it.orig_market_price)) : 0), 0);
  // Discount calculation - card number thiyenawa nam discount 0
  const discount = cardNumber ? 0 : (items.length === 0 ? 0 : items.reduce((sum, it) => sum + ((it.orig_market_price && it.selling_price && it.qty) ? (parseFloat(it.orig_market_price) - parseFloat(it.selling_price)) * parseFloat(it.qty) : 0), 0));
  const netTotal = subTotal - discount;
  // Total cost (sum of cost * qty for added items)
  const totalAddedCost = items.reduce((sum, it) => sum + ((it.cost != null && it.cost !== '' && it.qty) ? (parseFloat(it.cost) * parseFloat(it.qty)) : 0), 0);
  // Profit = Net Total - Total Cost
  const profit = netTotal - totalAddedCost;
  const balance = (parseFloat(cashPayment) || 0) + (parseFloat(cardAmount) || 0) - netTotal;
  // Displayed balance (never negative in UI) and cash/card applied amounts
  const displayedBalance = Math.max(balance, 0);
  // cash applied to the invoice: cash paid minus any returned change (displayed balance)
  const cashApplied = (parseFloat(cashPayment) || 0) - displayedBalance;
  const cardApplied = parseFloat(cardAmount) || 0;

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
        <ThemeContainer className="invoice-container" style={{ 
          animation: 'fadeIn 0.5s ease-out',
          maxWidth: '1500px',
          height: '100vh',
          padding: 'var(--spacing-md)',
          // local spacing overrides to make the page more compact on short screens
          // these reduce the values of CSS spacing variables used across the component
          '--spacing-xs': '4px',
          '--spacing-sm': '6px',
          '--spacing-md': '8px',
          '--spacing-lg': '10px',
          '--spacing-xl': '12px'
        }}>
          {/* Main Invoice Content */}
          <ThemeCard style={{ 
            width: 'calc(100% - 320px)', 
            height: '100%', 
            overflow: 'auto',
            background: theme?.colors.card,
            border: `2px solid ${theme?.colors.primary}`,
            position: 'relative'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: 'var(--spacing-md)', 
              right: 'var(--spacing-lg)', 
              textAlign: 'right', 
              color: theme?.colors.foreground,
              fontSize: '0.9rem'
                //display: 'none'  
            }}>
              <div><b>Date:</b> {date}</div>
              <div><b>Time:</b> {currentTime}</div>
              {/* Auth Check performance display */}
              <AuthPerfDisplay perf={perf} />
            </div>
            
            <h2 style={{ 
              textAlign: "center", 
              marginBottom: 'var(--spacing-md)', 
              color: theme?.colors.primary, 
              letterSpacing: 1,
              fontSize: '1rem',
              fontWeight: 700,
              
            }}>
              🧾 POS Invoice
            </h2>
            
            {message && <MessageAlert message={message} type={messageType} />}
            
            <form onSubmit={handleSubmit}>
              {/* Customer and Date Section */}
              <ThemeGrid columns="2fr 1fr 1fr auto" gap="md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                {/* Customer, Date, Time - all in one row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                  <label style={{ fontWeight: 600, color: theme?.colors.foregroundSecondary, fontSize: '0.85rem', marginRight: 6, whiteSpace: 'nowrap' }}>Customer</label>
                  <ThemeInput
                    ref={customerInputRef}
                    type="text"
                    value={selectedCustomer ? `${selectedCustomer.customer_code} - ${selectedCustomer.customer_name}` : customer}
                    onChange={e => {
                      setCustomer(e.target.value);
                      setSelectedCustomer(defaultCustomer || null);
                      setCustomerDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (filteredCustomers.length > 0) setCustomerDropdownOpen(true);
                    }}
                    onKeyDown={e => {
                      if (filteredCustomers.length === 0) return;
                      if (e.key === 'ArrowDown') {
                        setHighlightedCustomerIdx(idx => Math.min(idx + 1, filteredCustomers.length - 1));
                        e.preventDefault();
                      } else if (e.key === 'ArrowUp') {
                        setHighlightedCustomerIdx(idx => Math.max(idx - 1, 0));
                        e.preventDefault();
                      } else if (e.key === 'Enter') {
                        if (highlightedCustomerIdx >= 0 && highlightedCustomerIdx < filteredCustomers.length) {
                          setSelectedCustomer(filteredCustomers[highlightedCustomerIdx]);
                          setCustomer(`${filteredCustomers[highlightedCustomerIdx].customer_code} - ${filteredCustomers[highlightedCustomerIdx].customer_name}`);
                          setFilteredCustomers([]);
                          setCustomerDropdownOpen(false);
                          setHighlightedCustomerIdx(-1);
                          e.preventDefault();
                        }
                      }
                    }}
                    placeholder="Customer Name or Code"
                    required
                    style={{ fontSize: '0.9rem', padding: '6px 8px', height: 34, lineHeight: '20px', minWidth: 180 }}
                    autoComplete="off"
                  />
                  {customerDropdownOpen && filteredCustomers.length > 0 && (
                    <div style={{ 
                      position: 'absolute', 
                      zIndex: 20, 
                      background: theme?.colors.card, 
                      border: `1px solid ${theme?.colors.border}`, 
                      borderRadius: 'var(--radius-md)', 
                      width: '100%', 
                      maxHeight: 180, 
                      overflowY: 'auto', 
                      boxShadow: `0 2px 8px ${theme?.colors.shadowLight}` 
                    }}>
                      {filteredCustomers.map((cust, idx) => (
                        <div
                          key={cust.id}
                          style={{
                            padding: 'var(--spacing-sm)',
                            cursor: 'pointer',
                            borderBottom: `1px solid ${theme?.colors.backgroundSecondary}`,
                            background: idx === highlightedCustomerIdx ? theme?.colors.primaryLight : theme?.colors.card,
                            color: theme?.colors.foreground
                          }}
                          onMouseEnter={() => setHighlightedCustomerIdx(idx)}
                          onMouseDown={e => {
                            setSelectedCustomer(cust);
                            setCustomer(`${cust.customer_code} - ${cust.customer_name}`);
                            setFilteredCustomers([]);
                            setCustomerDropdownOpen(false);
                            setHighlightedCustomerIdx(-1);
                            e.preventDefault();
                          }}
                        >
                          {cust.customer_code} - {cust.customer_name}
                        </div>
                      ))}
                    </div>
                  )}
                  <label style={{ fontWeight: 600, color: theme?.colors.foregroundSecondary, fontSize: '0.85rem', marginLeft: 18, marginRight: 6, whiteSpace: 'nowrap' }}>Date</label>
                  <ThemeInput
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    style={{ fontSize: '0.9rem', padding: '6px 8px', height: 34, lineHeight: '20px', minWidth: 120 }}
                  />
                  <label style={{ fontWeight: 600, color: theme?.colors.foregroundSecondary, fontSize: '0.85rem', marginLeft: 18, marginRight: 6, whiteSpace: 'nowrap' }}>Time</label>
                  <ThemeInput
                    type="text"
                    value={currentTime}
                    readOnly
                    style={{ fontSize: '0.9rem', background: theme?.colors.backgroundSecondary, fontWeight: 600, textAlign: 'right', padding: '6px 8px', height: 34, lineHeight: '20px', minWidth: 80 }}
                  />
                </div>
              </ThemeGrid>
              
              {/* Add Item Section */}
              <ThemeCard style={{ 
                background: theme?.colors.background,
                border: `1px solid ${theme?.colors.border}`,
                marginBottom: 'var(--spacing-lg)'
              }}>
                <h4 style={{ 
                  margin: 0, 
                  marginBottom: 'var(--spacing-md)', 
                  color: theme?.colors.primary, 
                  fontWeight: 100,
                  fontSize: '1rem'
                }}>
                  ➕ Add Item
                </h4>
                
                <ThemeGrid columns="2fr 100px 80px 1fr auto" gap="md" style={{ marginBottom: 'var(--spacing-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', width: '100%', flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
                    {/* Item Input */}
                    <div style={{ position: 'relative', flex: '1 1 340px', minWidth: 220, maxWidth: 420, marginRight: '55px' }}>
                      <ThemeInput
                        type="text"
                        value={itemSearch}
                        onChange={e => {
                          setItemSearch(e.target.value);
                          setDropdownOpen(true);
                        }}
                        onFocus={() => {
                          if (filteredItems.length > 0) setDropdownOpen(true);
                        }}
                        onKeyDown={handleItemSearchKeyDown}
                        ref={itemInputRef}
                        placeholder="Search by barcode, name, or ID"
                        style={{ fontSize: '0.9rem', minWidth: 400 }}
                        autoComplete="off"
                      />
                      {dropdownOpen && filteredItems.length > 0 && (
                        <div style={{ 
                          position: 'absolute', 
                          zIndex: 10, 
                          background: theme?.colors.card, 
                          border: `1px solid ${theme?.colors.border}`, 
                          borderRadius: 'var(--radius-md)', 
                          width: '100%', 
                          maxHeight: 180, 
                          overflowY: 'auto', 
                          boxShadow: `0 2px 8px ${theme?.colors.shadowLight}` 
                        }}>
                          {filteredItems.map((it, idx) => (
                            <div
                              key={it.id}
                              style={{
                                padding: 'var(--spacing-sm)',
                                cursor: 'pointer',
                                borderBottom: `1px solid ${theme?.colors.backgroundSecondary}`,
                                background: idx === highlightedIdx ? theme?.colors.primaryLight : theme?.colors.card,
                                color: theme?.colors.foreground
                              }}
                              onMouseEnter={() => setHighlightedIdx(idx)}
                              onMouseDown={e => {
                                handleItemSelect(it);
                                e.preventDefault();
                              }}
                            >
                              {it.item_barcode} / {it.item_name} / {it.id}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Qty Input */}
                    <ThemeInput
                      ref={qtyInputRef}
                      type="text"
                      inputMode="decimal"
                      value={qty}
                      onChange={e => {
                        const val = e.target.value;
                        if (/^\d*\.?\d*$/.test(val)) setQty(val);
                      }}
                      placeholder="Qty"
                      style={{ fontSize: '0.9rem', padding: '8px 8px', height: 34, minWidth: 60, maxWidth: 100, flex: '0 1 80px' }}
                      onFocus={() => {
                        setFilteredItems([]);
                        setHighlightedIdx(-1);
                        setDropdownOpen(false);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown') {
                          e.preventDefault();
                          return;
                        }
                        if (e.key === 'Enter') {
                          priceInputRef.current?.focus();
                          priceInputRef.current?.select();
                          e.preventDefault();
                        }
                      }}
                      onWheel={e => {
                        if (document.activeElement === qtyInputRef.current) {
                          e.preventDefault();
                        }
                      }}
                    />

                    {/* Price Input with Dropdown */}
                    <div style={{ position: 'relative', flex: '1 1 120px', minWidth: 80, maxWidth: 160 }}>
                      <ThemeInput
                        ref={priceInputRef}
                        type="text"
                        inputMode="decimal"
                        value={price}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d*\.?\d*$/.test(val)) {
                            setPrice(val);
                            setIsPriceFromDropdown(false);
                          }
                        }}
                        placeholder="Selling Price"
                        style={{ fontSize: '0.9rem', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, minWidth: 80 }}
                        onFocus={handlePriceFocus}
                        onKeyDown={(e) => {
                          if (e.key === 'PageUp' || e.key === 'PageDown') {
                            e.preventDefault();
                            return;
                          }
                          handlePriceKeyDown(e);
                        }}
                        onWheel={(e) => {
                          if (document.activeElement === priceInputRef.current) {
                            e.preventDefault();
                          }
                        }}
                      />
                      {priceOptions.length > 0 && (
                        <div style={{ 
                          position: 'absolute', 
                          zIndex: 20, 
                          background: theme?.colors.card, 
                          borderLeft: `1px solid ${theme?.colors.border}`,
                          borderRight: `1px solid ${theme?.colors.border}`,
                          borderBottom: `1px solid ${theme?.colors.border}`,
                          borderRadius: 'var(--radius-md)', 
                          width: '100%', 
                          maxHeight: 150, 
                          overflowY: 'auto', 
                          boxShadow: `0 2px 8px ${theme?.colors.shadowLight}`,
                          top: 'calc(100% - 1px)',
                          left: 0,
                          marginTop: 0,
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                          borderTop: 'none'
                        }}>
                          <div style={{ 
                            padding: '0px var(--spacing-sm)', 
                            background: theme?.colors.backgroundSecondary, 
                            borderBottom: `1px solid ${theme?.colors.border}`, 
                            fontSize: '0.8rem', 
                            color: theme?.colors.foregroundSecondary, 
                            fontWeight: 600,
                            lineHeight: '1.2'
                          }}>
                            Available Prices
                          </div>
                          {priceOptions.map((opt, idx) => (
                            <div
                              key={opt.id || idx}
                              style={{
                                padding: 'var(--spacing-sm)',
                                cursor: 'pointer',
                                borderBottom: `1px solid ${theme?.colors.backgroundSecondary}`,
                                background: idx === highlightedPriceIdx ? theme?.colors.primaryLight : theme?.colors.card,
                                color: theme?.colors.foreground,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                              onMouseEnter={() => setHighlightedPriceIdx(idx)}
                              onMouseDown={e => {
                                const selectedPrice = opt.market_price != null ? opt.market_price.toString() : 
                                  opt.selling_price != null ? opt.selling_price.toString() : 
                                  opt.retail_price != null ? opt.retail_price.toString() : 
                                  opt.wholesale_price != null ? opt.wholesale_price.toString() : '';
                                setPrice(selectedPrice);
                                setSelectedMarketPrice(selectedPrice);
                                setIsPriceFromDropdown(true);
                                setSelectedPriceRow(opt);
                                setPriceOptions([]);
                                setHighlightedPriceIdx(-1);
                                setTimeout(() => {
                                  if (priceInputRef.current) {
                                    priceInputRef.current.focus();
                                    priceInputRef.current.select();
                                  }
                                }, 0);
                                e.preventDefault();
                              }}
                            >
                              <span>Rs. {opt.market_price ?? opt.selling_price ?? opt.retail_price ?? opt.wholesale_price ?? '0.00'}</span>
                              <span style={{ fontSize: '0.75rem', color: theme?.colors.foregroundSecondary }}>
                                {opt.market_price != null ? 'Market' : 
                                  opt.selling_price != null ? 'Selling' : 
                                  opt.retail_price != null ? 'Retail' : 'Wholesale'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Button */}
                    <ThemeButton
                      type="button"
                      onClick={handleAddItem}
                      variant={(!itemSearch || !qty || !price) ? "secondary" : "primary"}
                      disabled={!itemSearch || !qty || !price}
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap',
                        minWidth: 90,
                        flex: '0 0 100px'
                      }}
                    >
                      Add Item
                    </ThemeButton>
                  </div>
                </ThemeGrid>

                {/* Items Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: "100%", 
                    borderCollapse: "collapse", 
                    marginTop: 'var(--spacing-md)', 
                    fontSize: '0.8rem', 
                    background: theme?.colors.card, 
                    color: theme?.colors.foreground,
                    border: `1px solid ${theme?.colors.border}`,
                    borderRadius: 'var(--radius-md)',
                    lineHeight: 1.1
                  }}>
                    <thead>
                      <tr style={{ background: theme?.colors.backgroundSecondary }}>
                        <th style={{ padding: '4px 6px', textAlign: "left", borderBottom: `2px solid ${theme?.colors.border}` }}>Item ID</th>
                        <th style={{ padding: '4px 6px', textAlign: "left", borderBottom: `2px solid ${theme?.colors.border}` }}>Item</th>
                        <th style={{ padding: '4px 6px', textAlign: "left", borderBottom: `2px solid ${theme?.colors.border}` }}>Qty</th>
                        <th style={{ padding: '4px 6px', textAlign: "left", borderBottom: `2px solid ${theme?.colors.border}` }}>Warranty</th>
                        <th style={{ padding: '4px 6px', textAlign: "left", borderBottom: `2px solid ${theme?.colors.border}` }}>Cost</th>
                        <th style={{ padding: '4px 6px', textAlign: "left", borderBottom: `2px solid ${theme?.colors.border}` }}>Market Price</th>
                        <th style={{ padding: '4px 6px', textAlign: "left", borderBottom: `2px solid ${theme?.colors.border}` }}>Selling Price</th>
                        <th style={{ padding: '4px 6px', textAlign: "left", borderBottom: `2px solid ${theme?.colors.border}` }}>Discount</th>
                        <th style={{ padding: '4px 6px', textAlign: "left", borderBottom: `2px solid ${theme?.colors.border}` }}>Total</th>
                        <th style={{ padding: '4px 6px', textAlign: "center", borderBottom: `2px solid ${theme?.colors.border}` }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ 
                            textAlign: "center", 
                            color: theme?.colors.foregroundSecondary,
                            padding: 'var(--spacing-sm)'
                          }}>
                            No items added
                          </td>
                        </tr>
                      ) : items.map((it, idx) => (
                        <tr key={idx} style={{ 
                          borderBottom: `1px solid ${theme?.colors.border}`,
                          background: idx % 2 === 0 ? theme?.colors.card : theme?.colors.background
                        }}>
                          <td style={{ padding: '4px 6px' }}>{it.itemId ?? it.barcode ?? '-'}</td>
                          <td style={{ padding: '4px 6px' }}>{it.itemName}</td>
                          <td style={{ padding: '4px 6px' }}>{it.qty}</td>
                          <td style={{ padding: '4px 6px' }}>{it.warranty || '-'}</td>
                          <td style={{ padding: '4px 6px' }}>
                            {it.cost !== undefined && it.cost !== null && it.cost !== '' && it.qty ? 
                              (parseFloat(it.cost) * parseFloat(it.qty)).toFixed(2) : '-'}
                          </td>
                          <td style={{ padding: '4px 6px' }}>
                            {it.orig_market_price != null ? parseFloat(it.orig_market_price).toFixed(2) : '-'}
                          </td>
                          <td style={{ padding: '4px 6px' }}>
                            {it.selling_price !== undefined && it.selling_price !== '' ? parseFloat(it.selling_price).toFixed(2) : '-'}
                          </td>
                          <td style={{ padding: '4px 6px' }}>
                            {(it.orig_market_price && it.selling_price && it.qty) ? 
                              ((parseFloat(it.orig_market_price) - parseFloat(it.selling_price)) * parseFloat(it.qty)).toFixed(2) : '-'}
                          </td>
                          <td style={{ padding: '4px 6px' }}>
                            {(it.orig_market_price && it.qty) ? 
                              (parseFloat(it.qty) * parseFloat(it.orig_market_price)).toFixed(2) : '-'}
                          </td>
                          <td style={{ padding: '4px 6px', textAlign: "center" }}>
                            <ThemeButton
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              variant="error"
                              style={{
                                padding: '2px 4px',
                                fontSize: '0.72rem',
                                minHeight: '26px'
                              }}
                            >
                              Remove
                            </ThemeButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ThemeCard>

              {/* Summary Tables */}
              <ThemeGrid columns="1fr 1fr 1fr" gap="sm" style={{ marginBottom: 'var(--spacing-md)' }}>
                {/* Card Payment Table */}
                <ThemeCard style={{ background: theme?.colors.background, padding: 'var(--spacing-xs)' }}>
                  <h5 style={{ 
                    margin: '0 0 var(--spacing-xs) 0', 
                    color: theme?.colors.primary, 
                    fontSize: '0.95rem',
                    fontWeight: 600
                  }}>
                    💳 Card Payment
                  </h5>
                  <ThemeGrid columns="1fr" gap="xs">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                      <label style={{ 
                        display: 'inline-block', 
                        width: 110,
                        marginBottom: 0, 
                        fontWeight: 600, 
                        color: theme?.colors.foregroundSecondary,
                        fontSize: '0.82rem'
                      }}>
                        Card Number
                      </label>
                      <ThemeInput
                        ref={cardNumberInputRef}
                        type="text"
                        maxLength={20}
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        placeholder="Card Number"
                        style={{ fontSize: '0.82rem', padding: '6px 8px', height: 32, flex: 1 }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            cardBankSelectRef?.current?.focus?.();
                            e.preventDefault();
                          }
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                      <label style={{ 
                        display: 'inline-block', 
                        width: 110,
                        marginBottom: 0, 
                        fontWeight: 600, 
                        color: theme?.colors.foregroundSecondary,
                        fontSize: '0.82rem'
                      }}>
                        Bank
                      </label>
                      <select
                        ref={cardBankSelectRef}
                        value={cardBank}
                        onChange={e => setCardBank(e.target.value)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${theme?.colors.border}`,
                          fontSize: '0.82rem',
                          background: theme?.colors.background,
                          color: theme?.colors.foreground,
                          height: 32,
                          flex: 1
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            cardTypeSelectRef?.current?.focus?.();
                            e.preventDefault();
                          }
                        }}
                      >
                        <option value="">Select Bank</option>
                        {SRI_LANKA_BANKS.map(bank => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                      <label style={{ 
                        display: 'inline-block', 
                        width: 110,
                        marginBottom: 0, 
                        fontWeight: 600, 
                        color: theme?.colors.foregroundSecondary,
                        fontSize: '0.82rem'
                      }}>
                        Card Type
                      </label>
                      <select
                        ref={cardTypeSelectRef}
                        value={cardType}
                        onChange={e => setCardType(e.target.value)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${theme?.colors.border}`,
                          fontSize: '0.82rem',
                          background: theme?.colors.background,
                          color: theme?.colors.foreground,
                          height: 32,
                          flex: 1
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            cardAmountInputRef?.current?.focus?.();
                            e.preventDefault();
                          }
                        }}
                      >
                        <option value="">Select Card Type</option>
                        {CARD_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                      <label style={{ 
                        display: 'inline-block', 
                        width: 110,
                        marginBottom: 0, 
                        fontWeight: 600, 
                        color: theme?.colors.foregroundSecondary,
                        fontSize: '0.82rem'
                      }}>
                        Amount
                      </label>
                      <ThemeInput
                        ref={cardAmountInputRef}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={cardAmount}
                        onChange={e => setCardAmount(e.target.value)}
                        style={{ fontSize: '0.82rem', WebkitAppearance: 'textfield', MozAppearance: 'textfield', appearance: 'textfield', padding: '6px 8px', height: 32, flex: 1 }}
                        onWheel={e => {
                          // Prevent mouse wheel from changing the number when focused
                          if (document.activeElement === cardAmountInputRef.current) e.preventDefault();
                        }}
                        onKeyDown={e => {
                          // Prevent arrow/page keys from incrementing/decrementing the number
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown') {
                            e.preventDefault();
                            return;
                          }
                        }}
                      />
                    </div>
                  </ThemeGrid>
                </ThemeCard>

                {/* Discount/Items/Other Table */}
                <ThemeCard style={{ background: theme?.colors.background, padding: 'var(--spacing-xs)' }}>
                  <h5 style={{ 
                    margin: '0 0 var(--spacing-xs) 0', 
                    color: theme?.colors.primary, 
                    fontSize: '0.95rem',
                    fontWeight: 600
                  }}>
                    📊 Summary
                  </h5>
                  <ThemeGrid columns="1fr" gap="xs">
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 'var(--spacing-xs)',
                      borderBottom: `1px solid ${theme?.colors.border}`
                    }}>
                      <span style={{ fontSize: '0.8rem', color: theme?.colors.info }}>Discount</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {/* Card number thiyenawa nam discount 0 pennanna */}
                        {cardNumber ? '0.00' : (items.length === 0 ? '0.00' : items.reduce((sum, it) => sum + ((it.orig_market_price && it.selling_price && it.qty) ? (parseFloat(it.orig_market_price) - parseFloat(it.selling_price)) * parseFloat(it.qty) : 0), 0).toFixed(2))}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 'var(--spacing-xs)',
                      borderBottom: `1px solid ${theme?.colors.border}`
                    }}>
                      <span style={{ fontSize: '0.8rem' }}>Number of Items</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{items.length}</span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 'var(--spacing-xs)'
                    }}>
                      <span style={{ fontSize: '0.8rem' }}>Other</span>
                      <span style={{ fontSize: '0.8rem', color: theme?.colors.foregroundSecondary }}>-</span>
                    </div>
                  </ThemeGrid>
                </ThemeCard>

                {/* Total/Cash/Balance Table */}
                <ThemeCard style={{ background: theme?.colors.background, padding: 'var(--spacing-xs)' }}>
                  <h5 style={{ 
                    margin: '0 0 var(--spacing-xs) 0', 
                    color: theme?.colors.primary, 
                    fontSize: '0.95rem',
                    fontWeight: 600
                  }}>
                    💰 Payment
                  </h5>
                  <ThemeGrid columns="1fr" gap="xs">
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 'var(--spacing-xs)',
                      borderBottom: `1px solid ${theme?.colors.border}`
                    }}>
                      <span style={{ fontSize: '0.8rem', color: theme?.colors.primary }}>Sub Total</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.primary }}>
                        Rs. {items.reduce((sum, it) => sum + ((it.orig_market_price && it.qty) ? (parseFloat(it.qty) * parseFloat(it.orig_market_price)) : 0), 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 'var(--spacing-xs)',
                      borderBottom: `1px solid ${theme?.colors.border}`
                    }}>
                      <span style={{ fontSize: '0.8rem', color: theme?.colors.info }}>Discount</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: theme?.colors.info }}>
                        Rs. {cardNumber ? '0.00' : (items.length === 0 ? '0.00' : items.reduce((sum, it) => sum + ((it.orig_market_price && it.selling_price && it.qty) ? (parseFloat(it.orig_market_price) - parseFloat(it.selling_price)) * parseFloat(it.qty) : 0), 0).toFixed(2))}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 'var(--spacing-xs)',
                      borderBottom: `1px solid ${theme?.colors.border}`,
                      background: theme?.colors.warning + '20'
                    }}>
                      <span style={{ fontSize: '0.9rem', color: theme?.colors.warning, fontWeight: 600 }}>Net Total</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: theme?.colors.warning }}>
                        Rs. {netTotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 'var(--spacing-xs)',
                      borderBottom: `1px solid ${theme?.colors.border}`
                    }}>
                      <span style={{ fontSize: '0.8rem' }}>Cash Paid</span>
                      <ThemeInput
                        ref={cashPaymentInputRef}
                        type="number"
                        min="0"
                        step="0.01"
                        value={cashPayment}
                        onChange={e => setCashPayment(e.target.value)}
                        placeholder="Cash Payment"
                        style={{ 
                          width: '120px', 
                          fontSize: '0.8rem', 
                          textAlign: 'right',
                          padding: 'var(--spacing-xs)',
                          WebkitAppearance: 'textfield',
                          MozAppearance: 'textfield',
                          appearance: 'textfield'
                        }}
                        onKeyDown={e => {
                          // Prevent arrow/page keys from changing the value
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown') {
                            e.preventDefault();
                            return;
                          }
                          if (e.key.toLowerCase() === 'c') {
                            cardNumberInputRef.current?.focus();
                            e.preventDefault();
                          }
                        }}
                        onWheel={e => {
                          // Prevent mouse wheel from changing the number when focused
                          if (document.activeElement === cashPaymentInputRef.current) e.preventDefault();
                        }}
                      />
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: 'var(--spacing-sm)'
                    }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: balance < 0 ? theme?.colors.error : theme?.colors.success 
                      }}>
                        Balance
                      </span>
                      <ThemeInput
                        type="text"
                        value={balance < 0 ? '0.00' : balance.toFixed(2)}
                        readOnly
                        placeholder="Balance"
                        style={{ 
                          width: '120px', 
                          fontSize: '0.8rem', 
                          textAlign: 'right',
                          padding: 'var(--spacing-xs)',
                          background: theme?.colors.backgroundSecondary,
                          color: balance < 0 ? theme?.colors.error : theme?.colors.success,
                          fontWeight: 600
                        }}
                      />
                    </div>
                  </ThemeGrid>
                </ThemeCard>
              </ThemeGrid>

              {/* Action Buttons */}
              <ThemeGrid columns="1fr auto auto auto auto" gap="md">
                <ThemeButton 
                  type="submit" 
                  variant="success"
                  style={{
                    padding: 'var(--spacing-md)',
                    fontWeight: "bold",
                    fontSize: "1.1rem"
                  }}
                >
                  💾 Save Invoice
                </ThemeButton>
                
                <ThemeButton 
                  id="holdBtn" 
                  type="button" 
                  onClick={handleHold}
                  variant="warning"
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    fontWeight: 600,
                    background: 'linear-gradient(90deg, #ffb347 0%, #ffcc33 100%)',
                    color: '#222',
                    border: '2px solid #ffb347',
                    boxShadow: '0 2px 8px rgba(255,179,71,0.15)'
                  }}
                >
                  ⏸️ Hold
                </ThemeButton>
                
                <ThemeButton 
                  id="deleteBtn" 
                  type="button" 
                  onClick={handleDeleteOrClear}
                  variant="error"
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    fontWeight: 600
                  }}
                >
                  🗑️ Delete/Clear
                </ThemeButton>
                
                <ThemeButton 
                  type="button" 
                  onClick={handleLoadHold}
                  variant="primary"
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    fontWeight: 600
                  }}
                >
                  📋 Hold List
                </ThemeButton>
                
                <ThemeButton 
                  type="button" 
                  onClick={handleLoadInvoice}
                  variant="secondary"
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    fontWeight: 600,
                    background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                    color: '#222',
                    border: '2px solid #43e97b',
                    boxShadow: '0 2px 8px rgba(67,233,123,0.15)'
                  }}
                >
                  📄 Load Invoice
                </ThemeButton>
              </ThemeGrid>
            </form>
          </ThemeCard>

          {/* Right Side Panel */}
          <div style={{
            position: 'absolute',
            right: 'var(--spacing-md)',
            top: 'var(--spacing-md)',
            width: '300px',
            height: 'calc(100% - 2 * var(--spacing-md))',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            paddingLeft: '2px',
            paddingRight: '2px'
          }}>
            {/* Item Details Card */}
            <ThemeCard style={{
              background: theme?.colors.card,
              border: `1px solid ${theme?.colors.primary}`,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '4px'
            }}>
              <h3 style={{ 
                margin: '0 0 6px 0', 
                color: theme?.colors.primary, 
                fontSize: '0.95rem',
                fontWeight: 700,
                textAlign: 'center',
                borderBottom: `1px solid ${theme?.colors.primary}`,
                paddingBottom: '6px',
                lineHeight: '1'
              }}>
                <span style={{ fontSize: '1.2rem' }}>📦</span> Item Details
              </h3>
              
              <div style={{ flex: 1, overflow: 'auto', padding: '4px' }}>
                {selectedItemObj ? (
                  <>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-sm)', color: theme?.colors.foreground }}>Item Information</div>
                      <div style={{ color: theme?.colors.foreground, fontSize: '0.85rem' }}><b>Name:</b> {selectedItemObj.item_name}</div>
                      <div style={{ color: theme?.colors.foreground, fontSize: '0.85rem' }}><b>Barcode:</b> {selectedItemObj.item_barcode}</div>
                      <div style={{ color: theme?.colors.foreground, fontSize: '0.85rem' }}>
                        <b>Available Stock:</b> {selectedItemObj.qty ?? 'N/A'}{(selectedItemObj.qty_type || selectedItemObj.qtyType) ? ` (${selectedItemObj.qty_type || selectedItemObj.qtyType})` : ''}
                      </div>
                      <div style={{ color: theme?.colors.foreground, fontSize: '0.85rem' }}><b>Warranty:</b> {selectedItemObj.warranty ?? (selectedItemObj.warranty_period ?? '-')}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontWeight: 600, margin: 'var(--spacing-md) 0 var(--spacing-sm) 0', color: theme?.colors.foreground }}>Price Details</div>
                      {itemPriceDetails.length === 0 ? (
                        <div style={{ color: theme?.colors.foregroundSecondary, fontSize: '0.85rem' }}>No price information available</div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ 
                            width: '100%', 
                            fontSize: '0.75rem', 
                            background: theme?.colors.background,
                            border: `1px solid ${theme?.colors.border}`,
                            borderRadius: 'var(--radius-sm)'
                          }}>
                            <thead>
                              <tr style={{ background: theme?.colors.backgroundSecondary }}>
                                <th style={{ textAlign: 'left', fontWeight: 500, padding: 'var(--spacing-xs)' }}>Market</th>
                                <th style={{ textAlign: 'left', fontWeight: 500, padding: 'var(--spacing-xs)' }}>Selling</th>
                                <th style={{ textAlign: 'left', fontWeight: 500, padding: 'var(--spacing-xs)' }}>Retail</th>
                                <th style={{ textAlign: 'left', fontWeight: 500, padding: 'var(--spacing-xs)' }}>Wholesale</th>
                                <th style={{ textAlign: 'left', fontWeight: 500, padding: 'var(--spacing-xs)' }}>Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {itemPriceDetails.map((row, idx) => (
                                <tr key={row.id || idx} style={highlightedPriceIdx === idx ? { 
                                  background: theme?.colors.primaryLight, 
                                  fontWeight: 600 
                                } : {}}>
                                  <td style={{ padding: 'var(--spacing-xs)' }}>{row.market_price ?? '-'}</td>
                                  <td style={{ padding: 'var(--spacing-xs)' }}>{row.selling_price ?? '-'}</td>
                                  <td style={{ padding: 'var(--spacing-xs)' }}>{row.retail_price ?? '-'}</td>
                                  <td style={{ padding: 'var(--spacing-xs)' }}>{row.wholesale_price ?? '-'}</td>
                                  <td style={{ padding: 'var(--spacing-xs)' }}>{row.per_item_cost ?? '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: theme?.colors.foregroundSecondary,
                    textAlign: 'center',
                    padding: '8px'
                  }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>📦</div>
                    <div style={{ fontSize: '0.78rem', lineHeight: '1.2' }}>
                      Select an item from the list to view detailed information
                    </div>
                  </div>
                )}
              </div>
            </ThemeCard>

            {/* Last Bill Info Card (compact) */}
            <ThemeCard style={{
              background: theme?.colors.card,
              border: `2px solid ${theme?.colors.info}`,
              padding: 'var(--spacing-xs)'
            }}>
              <div style={{ 
                fontWeight: '600', 
                color: theme?.colors.info, 
                fontSize: '0.95rem',
                marginBottom: 'var(--spacing-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)'
              }}>
                ℹ️ Last Bill Info
              </div>
              
              <ThemeGrid columns="1fr" gap="xs">
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 'var(--spacing-xs)',
                  borderBottom: `1px dashed ${theme?.colors.border}`
                }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Net Total</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                    Rs. {lastBill ? Number(lastBill.netTotal).toFixed(2) : '0.00'}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 'var(--spacing-xs)',
                  borderBottom: `1px dashed ${theme?.colors.border}`
                }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Cash Paid</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                    {lastBill ? `Rs. ${Number(lastBill.cashPaid).toFixed(2)}` : '0.00'}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 'var(--spacing-xs)',
                  borderBottom: `1px dashed ${theme?.colors.border}`
                }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Card Paid</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                    {lastBill ? `Rs. ${Number(lastBill.cardPaid || 0).toFixed(2)}` : '0.00'}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 'var(--spacing-xs)',
                  borderBottom: `1px dashed ${theme?.colors.border}`
                }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Total Paid</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                    {lastBill ? `Rs. ${Number(lastBill.totalPaid || 0).toFixed(2)}` : '0.00'}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 'var(--spacing-xs)',
                  borderBottom: `1px dashed ${theme?.colors.border}`
                }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Balance</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                    {lastBill ? `Rs. ${Number(lastBill.balance).toFixed(2)}` : '0.00'}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 'var(--spacing-xs)'
                }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Number of Items</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                    {lastBill ? lastBill.numberOfItems : '0'}
                  </span>
                </div>
                {/* Last Bill Print Button */}
                {lastBill && lastSavedInvoiceId && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '6px', marginBottom: '6px' }}>
                    <ThemeButton
                      type="button"
                      variant="info"
                      style={{
                        fontSize: '0.85rem',
                        padding: '4px 12px',
                        minWidth: 90,
                        background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)',
                        color: '#fff',
                        border: '2px solid #0072ff',
                        boxShadow: '0 2px 8px rgba(0,114,255,0.15)',
                        fontWeight: 700
                      }}
                      onClick={() => {
                        const url = `/invoice/print/${lastSavedInvoiceId}?auto=1`;
                        window.open(url, '_blank');
                      }}
                    >
                      Print Last Bill
                    </ThemeButton>
                  </div>
                )}
              </ThemeGrid>
            </ThemeCard>

            {/* Cost & Profit Info Card (compact) */}
            <ThemeCard style={{
              background: theme?.colors.card,
              border: `2px solid ${theme?.colors.warning}`,
              padding: 'var(--spacing-xs)'
            }}>
              <div style={{ 
                fontWeight: '600', 
                color: theme?.colors.warning, 
                fontSize: '0.95rem',
                marginBottom: 'var(--spacing-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)'
              }}>
                💰 Cost & Profit
              </div>
              
              <ThemeGrid columns="1fr" gap="xs">
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 'var(--spacing-xs)',
                  borderBottom: `1px dashed ${theme?.colors.border}`
                }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Total Cost</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: theme?.colors.warning }}>
                    Rs. {totalAddedCost.toFixed(2)}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 'var(--spacing-xs)',
                  borderBottom: `1px dashed ${theme?.colors.border}`
                }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Profit</span>
                  <span style={{ 
                    fontSize: '0.76rem', 
                    fontWeight: 700, 
                    color: profit >= 0 ? theme?.colors.success : theme?.colors.error 
                  }}>
                    Rs. {profit.toFixed(2)}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 'var(--spacing-xs)',
                  borderBottom: `1px dashed ${theme?.colors.border}`
                }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Cash Applied</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                    Rs. {cashApplied.toFixed(2)}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: 'var(--spacing-xs)'
                }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>Card Applied</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700 }}>
                    Rs. {cardApplied.toFixed(2)}
                  </span>
                </div>
                
                {cardApplied > 0 && (
                  <div style={{ 
                    padding: 'var(--spacing-xs)',
                    background: theme?.colors.background,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    color: theme?.colors.foregroundSecondary
                  }}>
                    {cardBank && <span style={{ marginRight: 'var(--spacing-xs)' }}>{cardBank}</span>}
                    {cardType && <span>{cardType}</span>}
                  </div>
                )}
              </ThemeGrid>
            </ThemeCard>

            {/* Quick Info Card (compact) */}
            <ThemeCard style={{
              background: theme?.colors.card,
              border: `2px solid ${theme?.colors.secondary}`,
              padding: 'var(--spacing-xs)'
            }}>
              <div style={{ 
                fontWeight: '600', 
                color: theme?.colors.secondary, 
                fontSize: '0.95rem',
                marginBottom: 'var(--spacing-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)'
              }}>
                ⌨️ Quick Info
              </div>
              
              <div style={{ 
                fontSize: '0.72rem', 
                color: theme?.colors.foregroundSecondary, 
                lineHeight: '1.4',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-xs)'
              }}>
                <div>• <strong>F1</strong> - Select item search</div>
                <div>• <strong>F2</strong> - Remove last item</div>
                <div>• <strong>F3</strong> - Remove Hold / Clear</div>
                <div>• <strong>F4</strong> - Clear selected item</div>
                <div>• <strong>F5</strong> - Cash payment focus</div>
                <div>• <strong>F9</strong> - Invoice Hold</div>
                <div>• <strong>F10</strong> - Load Hold Invoice</div>
                <div>• <strong>C</strong> - Card payment (in cash field)</div>
                <div>• <strong>Enter</strong> - Add item</div>
              </div>
            </ThemeCard>
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

          @media (max-width: 1200px) {
            .invoice-container {
              flex-direction: column;
            }
            
            .invoice-container > :first-child {
              width: 100% !important;
              margin-bottom: var(--spacing-md);
            }
            
            .invoice-container > :last-child {
              position: static !important;
              width: 100% !important;
              height: auto !important;
            }
          }

          @media (max-width: 768px) {
            .invoice-container {
              padding: var(--spacing-sm);
            }
            
            .invoice-container > :last-child {
              gap: var(--spacing-sm);
            }
          }
        `}</style>
      </FastPageLoader>
    </AuthWrapper>
  );
}