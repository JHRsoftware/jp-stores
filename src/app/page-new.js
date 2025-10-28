"use client";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const LoginPage = dynamic(() => import("./login"));

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user");
        const loginStatus = localStorage.getItem("isLoggedIn");
        if (userData && loginStatus === "true") {
          setUser(JSON.parse(userData));
          setIsLoggedIn(true);
        }
      }
      setLoading(false);
    } catch (err) {
      setError("Error reading user data");
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    try {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
      
      // Dispatch custom event to notify layout of login state change
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('loginStateChanged'));
        
        // Redirect to dashboard after successful login
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 100);
      }
    } catch (err) {
      setError("Error saving user data");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>Loading...</main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>Error: {error}</main>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Welcome to Dashboard</h1>
        <p>Select a page from the sidebar to navigate.</p>
      </main>
    </div>
  );
}

// For better maintainability, consider using TypeScript or PropTypes for type safety.