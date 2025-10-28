"use client";
import React from 'react';

// High-performance in-memory cache with LRU eviction
class PerformanceCache {
  constructor(maxSize = 100, ttl = 300000) { // 5 minutes default TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.accessOrder = new Map();
    this.lastCleanup = Date.now();
    this.cleanupInterval = 60000; // Cleanup every minute
  }

  set(key, value, customTTL = null) {
    const now = Date.now();
    
    // Cleanup old entries periodically
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.cleanup();
    }

    // If cache is full, remove LRU item
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const lruKey = this.getLRUKey();
      if (lruKey) {
        this.cache.delete(lruKey);
        this.accessOrder.delete(lruKey);
      }
    }

    // Store with expiration time
    this.cache.set(key, {
      value,
      expiry: now + (customTTL || this.ttl),
      created: now
    });
    
    this.accessOrder.set(key, now);
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    // Update access time for LRU
    this.accessOrder.set(key, Date.now());
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
    this.accessOrder.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder.clear();
  }

  // Get least recently used key
  getLRUKey() {
    let oldestTime = Date.now();
    let oldestKey = null;

    for (const [key, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    const toDelete = [];

    for (const [key, item] of this.cache) {
      if (now > item.expiry) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    });

    this.lastCleanup = now;
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hitRate || 0,
      lastCleanup: this.lastCleanup
    };
  }
}

// Global cache instances
let queryCache = null;
let componentCache = null;

if (typeof window !== 'undefined') {
  queryCache = new PerformanceCache(200, 300000); // 5 minutes for API queries
  componentCache = new PerformanceCache(50, 600000); // 10 minutes for component data
}

// Cache wrapper for API calls
export async function cachedFetch(url, options = {}, cacheTime = 300000) {
  if (!queryCache) return fetch(url, options);

  const cacheKey = `${url}_${JSON.stringify(options)}`;
  
  // Check cache first
  const cached = queryCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      fromCache: true
    };
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Cache successful responses
    if (response.ok) {
      queryCache.set(cacheKey, data, cacheTime);
    }
    
    return data;
  } catch (error) {
    console.error('Cached fetch error:', error);
    throw error;
  }
}

// React hook for cached data
export function useCachedData(key, fetcher, deps = [], cacheTime = 300000) {
  // Ensure hooks are always called in the same order.
  // Initialize state based on whether componentCache is available (client only).
  const [state, setState] = React.useState(() => ({
    data: componentCache ? componentCache.get(key) : null,
    loading: componentCache ? !componentCache.has(key) : true,
    error: null
  }));

  // Use an array literal for dependencies so ESLint can statically analyze it.
  React.useEffect(() => {
    if (!componentCache) return; // nothing to do on server

    let mounted = true;

    async function loadData() {
      // Check cache first
      const cached = componentCache.get(key);
      if (cached) {
        if (mounted) {
          setState({ data: cached, loading: false, error: null });
        }
        return;
      }

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const data = await fetcher();

        if (mounted) {
          componentCache.set(key, data, cacheTime);
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (mounted) {
          setState({ data: null, loading: false, error });
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
    // deps is intentionally spread so callers can pass extra reactive deps
  }, [key, fetcher, cacheTime, ...deps]);

  return state;
}

// Cache invalidation utilities
export function invalidateCache(pattern = null) {
  if (queryCache) {
    if (pattern) {
      // Clear specific pattern
      for (const key of queryCache.cache.keys()) {
        if (key.includes(pattern)) {
          queryCache.delete(key);
        }
      }
    } else {
      queryCache.clear();
    }
  }
  
  if (componentCache) {
    if (pattern) {
      for (const key of componentCache.cache.keys()) {
        if (key.includes(pattern)) {
          componentCache.delete(key);
        }
      }
    } else {
      componentCache.clear();
    }
  }
}

// Performance-optimized data fetcher
export class DataFetcher {
  constructor() {
    this.pendingRequests = new Map();
  }

  async fetch(url, options = {}) {
    const key = `${url}_${JSON.stringify(options)}`;
    
    // If same request is already pending, return that promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = cachedFetch(url, options);
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      this.pendingRequests.delete(key);
      return result;
    } catch (error) {
      this.pendingRequests.delete(key);
      throw error;
    }
  }
}

// Global data fetcher instance
export const dataFetcher = new DataFetcher();

// Export cache instances for direct access
export { queryCache, componentCache };