"use client";

import { useMemo } from 'react';

// Performance monitoring utility
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
    
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  // Initialize performance observers
  initializeObservers() {
    try {
      // Observe navigation timing
      if ('performance' in window && 'getEntriesByType' in performance) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.metrics.pageLoad = {
                dns: entry.domainLookupEnd - entry.domainLookupStart,
                connection: entry.connectEnd - entry.connectStart,
                request: entry.responseStart - entry.requestStart,
                response: entry.responseEnd - entry.responseStart,
                domProcessing: entry.domContentLoadedEventStart - entry.responseEnd,
                total: entry.loadEventEnd - entry.navigationStart
              };
            }
          });
        });
        
        observer.observe({ entryTypes: ['navigation'] });
        this.observers.push(observer);
      }

      // Observe largest contentful paint
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            this.metrics.lcp = entries[entries.length - 1].startTime;
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      }
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  // Measure function execution time
  measureFunction(fn, name) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (!this.metrics.functions) this.metrics.functions = {};
    this.metrics.functions[name] = end - start;
    
    return result;
  }

  // Measure async function execution time
  async measureAsyncFunction(fn, name) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    if (!this.metrics.functions) this.metrics.functions = {};
    this.metrics.functions[name] = end - start;
    
    return result;
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : 'server'
    };
  }

  // Log performance metrics (only in development)
  logMetrics() {
    if (process.env.NODE_ENV === 'development') {
      console.table(this.getMetrics());
    }
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
let performanceMonitor = null;

if (typeof window !== 'undefined') {
  performanceMonitor = new PerformanceMonitor();
  
  // Log metrics on page load (development only)
  window.addEventListener('load', () => {
    setTimeout(() => performanceMonitor?.logMetrics(), 1000);
  });
}

// Performance decorator for functions
export function withPerformanceTracking(name) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      if (performanceMonitor) {
        if (originalMethod.constructor.name === 'AsyncFunction') {
          return await performanceMonitor.measureAsyncFunction(
            () => originalMethod.apply(this, args),
            `${name || target.constructor.name}.${propertyKey}`
          );
        } else {
          return performanceMonitor.measureFunction(
            () => originalMethod.apply(this, args),
            `${name || target.constructor.name}.${propertyKey}`
          );
        }
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// React hook for performance monitoring
export function usePerformance() {
  // Memoize returned function references so they remain stable between renders.
  // This prevents components that include these functions in useEffect deps
  // from re-running effects on every render.
  return useMemo(() => ({
    measure: (fn, name) => performanceMonitor?.measureFunction(fn, name),
    measureAsync: (fn, name) => performanceMonitor?.measureAsyncFunction(fn, name),
    getMetrics: () => performanceMonitor?.getMetrics(),
    logMetrics: () => performanceMonitor?.logMetrics()
  }), []);
}

export default performanceMonitor;