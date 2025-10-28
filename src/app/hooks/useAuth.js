"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const userData = localStorage.getItem('user');
        const loginStatus = localStorage.getItem('isLoggedIn');
        const isLoggedIn = !!(userData && loginStatus === 'true');
        
        // Skip auth check for login and home pages
        if (currentPath === '/login' || currentPath === '/') {
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
        
        if (!isLoggedIn) {
          router.push('/login');
          return;
        }
        
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();

    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = () => {
      checkAuth();
    };

    // Listen for custom login/logout events (same tab)
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('loginStateChanged', handleAuthChange);
    window.addEventListener('logoutStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('loginStateChanged', handleAuthChange);
      window.removeEventListener('logoutStateChanged', handleAuthChange);
    };
  }, [router]);

  return { isAuthenticated, loading };
}