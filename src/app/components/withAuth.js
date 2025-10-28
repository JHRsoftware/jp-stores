"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      const checkAuth = () => {
        // Skip authentication check for login page
        if (pathname === '/login' || pathname === '/') {
          return;
        }

        if (typeof window !== 'undefined') {
          const userData = localStorage.getItem('user');
          const loginStatus = localStorage.getItem('isLoggedIn');
          const isLoggedIn = !!(userData && loginStatus === 'true');
          
          if (!isLoggedIn) {
            router.push('/login');
            return;
          }
        }
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
    }, [router, pathname]);

    return <WrappedComponent {...props} />;
  };
}