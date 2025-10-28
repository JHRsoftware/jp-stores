"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../login.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        // Save login state
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new CustomEvent('loginStateChanged'));
        window.location.href = '/dashboard'; // Force full reload for sidebar
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background Pattern */}
      <div className={styles.backgroundPattern}></div>
      
      {/* Login Card */}
      <div className={styles.loginCard}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🏪</div>
            <h1 className={styles.logoText}>POS System</h1>
          </div>
          <p className={styles.subtitle}>Inventory Management & Sales</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Welcome Back</h2>
            <p className={styles.formSubtitle}>Sign in to your account</p>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={styles.input}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className={`${styles.button} ${loading ? styles.buttonLoading : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Signing In...
              </>
            ) : (
              <>
                <span className={styles.buttonIcon}>🔐</span>
                Sign In
              </>
            )}
          </button>

          {/* Security Notice */}
          <div className={styles.securityNotice}>
            <div className={styles.securityIcon}>🔒</div>
            <span>Your credentials are securely encrypted</span>
          </div>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Harshana Inventory System • v1.0
          </p>
        </div>
      </div>
    </div>
  );
}