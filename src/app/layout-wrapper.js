"use client";
import Sidebar, { navbarPages } from './navbar';
import { useState, useEffect } from 'react';
import { useTheme } from './theme-context';
import styles from './navbar.module.css';
import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Initialize as collapsed to match sidebar default
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const { theme } = useTheme();
  
  // Check if user is logged in
  useEffect(() => {
    const checkLoginStatus = () => {
      if (typeof window !== 'undefined') {
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(loggedIn);
      }
    };
    
    checkLoginStatus();
    
    // Listen for login/logout events
    const handleStorageChange = () => checkLoginStatus();
    const handleLoginEvent = () => checkLoginStatus();
    const handleLogoutEvent = () => checkLoginStatus();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('login', handleLoginEvent);
    window.addEventListener('logout', handleLogoutEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('login', handleLoginEvent);
      window.removeEventListener('logout', handleLogoutEvent);
    };
  }, []);
  
  let user = null;
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    if (userData) user = JSON.parse(userData);
  }
  
  // Robust allowedPages logic (SSR/hydration safe)
  let allowedPagesFinal = navbarPages;
  if (typeof window !== 'undefined' && user && Array.isArray(user.accessPages)) {
    allowedPagesFinal = navbarPages.filter(page => user.accessPages.includes(page.path));
  }
  
  // Don't show sidebar on login page, print page, or if not logged in
  const showSidebar = isLoggedIn && pathname !== '/' && pathname !== '/login' && !pathname?.startsWith?.('/cashbook/print');
  
  // Listen for sidebar collapse state changes
  useEffect(() => {
    const handleSidebarToggle = (event) => {
      setIsCollapsed(event.detail.isCollapsed);
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
  }, []);
  
  if (!showSidebar) {
    // Return children without sidebar for login page or when not logged in
    return <>{children}</>;
  }
  
  return (
    <>
      <Sidebar 
        pages={allowedPagesFinal} 
        onToggleCollapse={setIsCollapsed}
      />
      <main 
        className={`${styles.mainContent} ${isCollapsed ? styles.collapsed : ''}`}
        style={{
          marginLeft: isCollapsed ? '70px' : '280px',
          padding: 'var(--spacing-lg)',
          minHeight: '100vh',
          background: 'var(--background)',
          color: 'var(--foreground)',
          transition: 'all var(--transition-normal)'
        }}
      >
        {children}
      </main>
    </>
  );
}