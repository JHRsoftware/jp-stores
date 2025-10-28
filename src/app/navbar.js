"use client";
import Link from 'next/link';
import styles from './navbar.module.css';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTheme, themes } from './theme-context';

export const navbarPages = [

  // quick actions
  { name: 'Add Invoice', path: '/invoice/addInvoice', icon: '🧾', category: 'quick' },
  { name: 'Price', path: '/products/price', icon: '💰', category: 'quick' },
  { name: 'GRN', path: '/products/grn', icon: '📄', category: 'quick' },
  { name: 'Cashbook', path: '/cashbook', icon: '💵', category: 'quick' },
  { name: 'Add Item', path: '/products/items', icon: '📝', category: 'quick' },

  // Dashboard & Analytics
  { name: 'Dashboard', path: '/dashboard', icon: '📊', category: 'dashboard' },
  { name: 'Analytics', path: '/page2', icon: '📈', category: 'dashboard' },
  { name: 'Reports', path: '/page3', icon: '📋', category: 'dashboard' },
  { name: 'Performance', path: '/performance', icon: '⚡', category: 'dashboard' },
  
// Sales & Pricing
  
  
  // GRN Management
  
  { name: 'GRN List', path: '/products/grnlist', icon: '📑', category: 'grn' },
  
  // Inventory & Products
  { name: 'Qty Types', path: '/qtyTypes', icon: '📦', category: 'inventory' },
  { name: 'Category', path: '/products/category', icon: '🏷️', category: 'inventory' },
  { name: 'Suppliers', path: '/supplier', icon: '🏢', category: 'inventory' },
  { name: 'Customers', path: '/customers', icon: '👤', category: 'inventory' },
  { name: 'Item Expired Date', path: '/products/itemExpiredDate', icon: '⏰', category: 'inventory' },
  

  // User Management
   { name: 'Shop Details', path: '/shop', icon: '🏬', category: 'management' },
  { name: 'Users', path: '/manageUser', icon: '👥', category: 'management' },
  

 
];

// Category configuration with icons and display names
const categories = {
  dashboard: { name: 'Dashboard & Analytics', icon: '📊', color: '#3b82f6' },
  management: { name: 'User Management', icon: '👥', color: '#8b5cf6' },
  inventory: { name: 'Inventory $ Customers', icon: '📦', color: '#10b981' },
  grn: { name: 'GRN Management', icon: '📄', color: '#f59e0b' },
  sales: { name: 'Sales & Pricing', icon: '💰', color: '#ef4444' },
  quick: { name: 'Quick Actions', icon: '⚡', color: '#ef4444' }
};

// Theme selector component
function ThemeSelector({ isCollapsed }) {
  const { currentTheme, changeTheme, toggleMode, themes: availableThemes } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themeColors = {
    light: '#007bff',
    dark: '#0d6efd',
    redLight: '#dc3545',
    redDark: '#ff6b7a',
    greenLight: '#28a745',
    greenDark: '#20c997',
    blueLight: '#007bff',
    blueDark: '#4dabf7'
  };

  const themeIcons = {
    light: '☀️',
    dark: '🌙',
    redLight: '🔴',
    redDark: '🌹',
    greenLight: '🟢',
    greenDark: '💚',
    blueLight: '🔵',
    blueDark: '💙'
  };

  const groupedThemes = {
    default: ['light', 'dark'],
    red: ['redLight', 'redDark'],
    green: ['greenLight', 'greenDark'],
    blue: ['blueLight', 'blueDark']
  };

  return (
    <div className={styles.themeSelector}>
      <button 
        className={styles.sidebarButton} 
        onClick={() => setShowThemeMenu(!showThemeMenu)}
        title="Theme Settings"
      >
        <span className={styles.buttonIcon}>🎨</span>
        {!isCollapsed && <span className={styles.buttonText}>Themes</span>}
      </button>
      
      {showThemeMenu && (
        <div className={`${styles.themeMenu} ${isCollapsed ? styles.themeMenuCollapsed : ''}`}>
          <div className={styles.themeMenuHeader}>
            <h4>Choose Theme</h4>
            <button 
              className={styles.themeMenuClose}
              onClick={() => setShowThemeMenu(false)}
            >
              ✕
            </button>
          </div>
          
          <div className={styles.themeGroups}>
            {Object.entries(groupedThemes).map(([groupName, themeNames]) => (
              <div key={groupName} className={styles.themeGroup}>
                <div className={styles.themeGroupLabel}>
                  {groupName === 'default' ? 'Default' : groupName.charAt(0).toUpperCase() + groupName.slice(1)}
                </div>
                <div className={styles.themeOptions}>
                  {themeNames.map(themeName => (
                    <button
                      key={themeName}
                      className={`${styles.themeOption} ${currentTheme === themeName ? styles.themeOptionActive : ''}`}
                      onClick={() => {
                        changeTheme(themeName);
                        setShowThemeMenu(false);
                      }}
                      style={{ 
                        backgroundColor: currentTheme === themeName ? themeColors[themeName] : 'transparent',
                        borderColor: themeColors[themeName]
                      }}
                      title={availableThemes[themeName]?.name}
                    >
                      <span className={styles.themeIcon}>{themeIcons[themeName]}</span>
                      {!isCollapsed && (
                        <span className={styles.themeName}>{availableThemes[themeName]?.name}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.quickToggle}>
            <button 
              className={styles.quickToggleButton}
              onClick={() => {
                toggleMode();
                setShowThemeMenu(false);
              }}
            >
              <span className={styles.buttonIcon}>
                {availableThemes[currentTheme]?.mode === 'dark' ? '☀️' : '🌙'}
              </span>
              <span>Toggle {availableThemes[currentTheme]?.mode === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ pages, onToggleCollapse }) {
  const router = useRouter();
  const { theme } = useTheme();
  // Sidebar defaults to collapsed for a compact UI; it expands on mouse hover
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({
    dashboard: true,
    management: true,
    inventory: true,
    grn: true,
    sales: true
  });

  // Collapse sidebar after route change (page navigation)
  useEffect(() => {
    // Next.js app router navigation events
    const handleRouteChange = () => {
      setIsCollapsed(true);
      if (onToggleCollapse) onToggleCollapse(true);
      window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isCollapsed: true } }));
    };
    // Listen for route changes
    router && router.events && router.events.on && router.events.on('routeChangeComplete', handleRouteChange);
    // For next/navigation router (app dir), fallback to popstate
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      router && router.events && router.events.off && router.events.off('routeChangeComplete', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [router, onToggleCollapse]);

  // Group pages by category
  const groupedPages = pages.reduce((acc, page) => {
    const category = page.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(page);
    return acc;
  }, {});

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('logoutStateChanged'));
    router.push('/login');
  };

  // Timer ref for auto-collapse
  const autoCollapseTimerRef = useRef(null);

  // Expand sidebar on mouse enter, collapse after 1s on mouse leave
  const handleMouseEnter = () => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
    setIsCollapsed(false);
    if (onToggleCollapse) onToggleCollapse(false);
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isCollapsed: false } }));
  };

  const handleMouseLeave = () => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
    }
    autoCollapseTimerRef.current = setTimeout(() => {
      setIsCollapsed(true);
      if (onToggleCollapse) onToggleCollapse(true);
      window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isCollapsed: true } }));
      autoCollapseTimerRef.current = null;
    }, 10);
  };

  // Manual toggle (button)
  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
    setIsCollapsed(newCollapsedState);
    if (onToggleCollapse) onToggleCollapse(newCollapsedState);
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { isCollapsed: newCollapsedState } }));
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
        autoCollapseTimerRef.current = null;
      }
    };
  });

  // Load user display name and keep it updated
  useEffect(() => {
    function loadUser() {
      if (typeof window === 'undefined') return;
      try {
        const d = localStorage.getItem('user');
        setUser(d ? JSON.parse(d) : null);
      } catch (e) { setUser(null); }
    }
    loadUser();
    const onChange = () => loadUser();
    window.addEventListener('storage', onChange);
    window.addEventListener('loginStateChanged', onChange);
    window.addEventListener('logoutStateChanged', onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('loginStateChanged', onChange);
      window.removeEventListener('logoutStateChanged', onChange);
    };
  }, []);

  // Load shop info for header display
  useEffect(() => {
    let mounted = true;
    async function loadShop() {
      try {
        const res = await fetch('/api/shop');
        const j = await res.json();
        if (!mounted) return;
        if (j && j.success && j.shop) {
          setShop(j.shop);
        }
      } catch (e) {
        // ignore
      }
    }
    loadShop();
    return () => { mounted = false; };
  }, []);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <>
      <nav
        className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.headerContent}>
            {!isCollapsed && shop?.name && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 className={styles.sidebarTitle} style={{ margin: 0 }}>{shop.name}</h2>
                {user && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--foregroundSecondary)', marginTop: '6px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{user.username || user.name || 'User'}</div>
                  </div>
                )}
              </div>
            )}
            <button 
              className={styles.toggleButton} 
              onClick={toggleSidebar}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? '▶️' : '◀️'}
            </button>
          </div>
        </div>
        
        <div className={styles.sidebarContent}>
          {Object.entries(groupedPages).map(([categoryKey, categoryPages]) => {
            const category = categories[categoryKey] || categories.other;
            
            return (
              <div key={categoryKey} className={styles.categorySection}>
                {/* Category Header */}
                {!isCollapsed && (
                  <div 
                    className={styles.categoryHeader}
                    onClick={() => toggleCategory(categoryKey)}
                    style={{ borderLeftColor: category.color }}
                  >
                    <span className={styles.categoryIcon}>{category.icon}</span>
                    <span className={styles.categoryName}>{category.name}</span>
                    <span className={styles.expandIcon}>
                      {expandedCategories[categoryKey] ? '▼' : '▶'}
                    </span>
                  </div>
                )}
                
                {/* Category Pages */}
                <ul className={`${styles.sidebarUl} ${!expandedCategories[categoryKey] ? styles.collapsedCategory : ''}`}>
                  {categoryPages.map(page => (
                    <li key={page.path} className={styles.sidebarItem}>
                      <Link 
                        href={page.path} 
                        className={styles.sidebarLink} 
                        title={page.name}
                        style={isCollapsed ? { justifyContent: 'center' } : {}}
                      >
                        <span className={styles.linkIcon}>{page.icon}</span>
                        {!isCollapsed && (
                          <span className={styles.linkText}>{page.name}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        
        <div className={styles.sidebarFooter}>
          <ThemeSelector isCollapsed={isCollapsed} />
          
          <button 
            className={styles.sidebarButton} 
            onClick={handleLogout}
            title="Logout"
          >
            <span className={styles.buttonIcon}>🚪</span>
            {!isCollapsed && <span className={styles.buttonText}>Logout</span>}
          </button>
        </div>
      </nav>
      
      {/* Overlay for mobile when sidebar is open */}
      {!isCollapsed && (
        <div className={styles.overlay} onClick={toggleSidebar}></div>
      )}
    </>
  );
}