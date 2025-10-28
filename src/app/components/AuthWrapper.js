"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Minimal loading component for better performance
const LoadingSpinner = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f8f9fa'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #e9ecef',
      borderTop: '4px solid #007bff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default function AuthWrapper({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user');
        const loginStatus = localStorage.getItem('isLoggedIn');
        const isLoggedIn = !!(userData && loginStatus === 'true');
        
        if (!isLoggedIn) {
          router.replace('/login'); // Use replace instead of push for better performance
          return false;
        }
        
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/login');
      return false;
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Initial auth check with faster execution
    const initialCheck = () => {
      const result = checkAuth();
      if (!result) {
        setLoading(false);
      }
    };

    initialCheck();

    // Optimized event handlers with debouncing
    let timeout;
    const handleAuthChange = () => {
      clearTimeout(timeout);
      timeout = setTimeout(checkAuth, 100); // Debounce for better performance
    };

    // Listen for auth state changes
    window.addEventListener('storage', handleAuthChange, { passive: true });
    window.addEventListener('loginStateChanged', handleAuthChange, { passive: true });
    window.addEventListener('logoutStateChanged', handleAuthChange, { passive: true });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('loginStateChanged', handleAuthChange);
      window.removeEventListener('logoutStateChanged', handleAuthChange);
    };
  }, [checkAuth]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return children;
}