"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from "react";
import { ThemeProvider } from "./theme-context";
import LayoutWrapper from "./layout-wrapper";
import { LoadingProvider } from './loading-context';
import FullScreenLoader from './components/FullScreenLoader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Batch all initial operations for better performance
    const initializeApp = async () => {
      try {
        // Optimized auth check with faster execution
        const checkLoginState = () => {
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const userData = localStorage.getItem('user');
            const loginStatus = localStorage.getItem('isLoggedIn');
            const isAuthenticated = !!(userData && loginStatus === 'true');
            
            // Fast redirect for unauthorized access
            if (!isAuthenticated && currentPath !== '/login' && currentPath !== '/') {
              window.location.replace('/login'); // Use replace for better performance
              return;
            }
            
            setIsLoggedIn(isAuthenticated);
          }
          setLoading(false);
        };

        checkLoginState();
      } catch (error) {
        console.error('App initialization failed:', error);
        setLoading(false);
      }
    };

    initializeApp();

    // Debounced event handlers for better performance
    let authTimeout;
    const handleAuthChange = () => {
      clearTimeout(authTimeout);
      authTimeout = setTimeout(() => {
        const currentPath = window.location.pathname;
        const userData = localStorage.getItem('user');
        const loginStatus = localStorage.getItem('isLoggedIn');
        const isAuthenticated = !!(userData && loginStatus === 'true');
        
        if (!isAuthenticated && currentPath !== '/login' && currentPath !== '/') {
          window.location.replace('/login');
          return;
        }
        
        setIsLoggedIn(isAuthenticated);
      }, 50); // Reduced debounce time for faster response
    };

    // Use passive listeners for better performance
    window.addEventListener('storage', handleAuthChange, { passive: true });
    window.addEventListener('loginStateChanged', handleAuthChange, { passive: true });
    window.addEventListener('logoutStateChanged', handleAuthChange, { passive: true });

    return () => {
      clearTimeout(authTimeout);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('loginStateChanged', handleAuthChange);
      window.removeEventListener('logoutStateChanged', handleAuthChange);
    };
  }, []);

  // Enhanced authentication check
  const shouldHideSidebar = !isLoggedIn || loading;
  
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable}`}> 
        <ThemeProvider>
          <LoadingProvider>
            <FullScreenLoader />
            {shouldHideSidebar ? (
              children
            ) : (
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            )}
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
