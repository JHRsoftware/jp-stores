// Optimized API utilities for super fast requests
import { dataFetcher, invalidateCache } from './cache';

// Enhanced error handling
class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'APIError';
  }
}

// Performance-optimized API client
export class FastAPI {
  constructor() {
    this.baseURL = typeof window !== 'undefined' ? window.location.origin : '';
    this.defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  // Generic request method with performance tracking
  async request(endpoint, options = {}) {
    const startTime = performance.now();
    
    try {
      const url = `${this.baseURL}/api/${endpoint.replace(/^\//, '')}`;
      const config = {
        ...this.defaultOptions,
        ...options,
        headers: {
          ...this.defaultOptions.headers,
          ...options.headers,
        },
      };

      const response = await dataFetcher.fetch(url, config);
      const endTime = performance.now();
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`API ${config.method || 'GET'} ${endpoint}: ${Math.round(endTime - startTime)}ms`);
      }

      if (!response.ok) {
        throw new APIError(
          response.statusText || 'Request failed',
          response.status,
          'REQUEST_FAILED'
        );
      }

      return response;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        error.message || 'Network error',
        500,
        'NETWORK_ERROR'
      );
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams(params).toString();
    const url = searchParams ? `${endpoint}?${searchParams}` : endpoint;
    
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // Batch requests for better performance
  async batch(requests) {
    const startTime = performance.now();
    
    try {
      const promises = requests.map(({ method, endpoint, data }) => {
        return this[method.toLowerCase()](endpoint, data);
      });
      
      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Batch API (${requests.length} requests): ${Math.round(endTime - startTime)}ms`);
      }
      
      return results.map((result, index) => ({
        ...requests[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
      }));
    } catch (error) {
      throw new APIError('Batch request failed', 500, 'BATCH_ERROR');
    }
  }
}

// Global API instance
export const api = new FastAPI();

// Specific API methods with caching
export const customerAPI = {
  async getAll() {
    const response = await api.get('customers');
    return response.customers || [];
  },

  async create(customer) {
    const response = await api.post('customers', customer);
    // Invalidate customer cache after create
    invalidateCache('customers');
    return response;
  },

  async update(customer) {
    const response = await api.put('customers', customer);
    // Invalidate customer cache after update
    invalidateCache('customers');
    return response;
  },

  async delete(id) {
    const response = await api.delete('customers', { id });
    // Invalidate customer cache after delete
    invalidateCache('customers');
    return response;
  },
};

export const productAPI = {
  async getItems() {
    const response = await api.get('products/item');
    return response.items || [];
  },

  async getCategories() {
    const response = await api.get('products/category');
    return response.categories || [];
  },

  async createItem(item) {
    const response = await api.post('products/item', item);
    invalidateCache('products');
    return response;
  },

  async updatePrice(priceData) {
    const response = await api.post('products/price', priceData);
    invalidateCache('products');
    return response;
  },
};

export const invoiceAPI = {
  async create(invoice) {
    const response = await api.post('invoice/addInvoice', invoice);
    // Invalidate related caches
    invalidateCache('invoice');
    invalidateCache('stats');
    return response;
  },

  async getStats(filterType = 'day') {
    const response = await api.post('invoice/stats', { filterType });
    return response;
  },

  async getById(id) {
    const response = await api.get(`invoice/get/${id}`);
    return response;
  },

  async update(invoice) {
    const response = await api.put('invoice/update', invoice);
    invalidateCache('invoice');
    invalidateCache('stats');
    return response;
  },
};

export const authAPI = {
  async login(credentials) {
    const response = await api.post('login', credentials);
    // Don't cache auth responses for security
    return response;
  },
};

// Utility function for handling API errors consistently
export function handleAPIError(error) {
  if (error instanceof APIError) {
    // Handle specific API errors
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Network connection failed. Please check your internet connection.';
      case 'REQUEST_FAILED':
        return error.status === 401 
          ? 'Authentication failed. Please login again.'
          : error.status === 403
          ? 'You don\'t have permission to perform this action.'
          : error.status === 404
          ? 'The requested resource was not found.'
          : error.status >= 500
          ? 'Server error. Please try again later.'
          : error.message;
      default:
        return error.message;
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}

// Optimized data loading patterns
export class DataLoader {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
  }

  async load(key, fetcher, ttl = 300000) {
    // Return cached data if available and not expired
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // If request is already pending, wait for it
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // Start new request
    const promise = fetcher().then(data => {
      this.cache.set(key, { data, timestamp: Date.now() });
      this.pending.delete(key);
      return data;
    }).catch(error => {
      this.pending.delete(key);
      throw error;
    });

    this.pending.set(key, promise);
    return promise;
  }

  invalidate(key) {
    this.cache.delete(key);
    this.pending.delete(key);
  }

  clear() {
    this.cache.clear();
    this.pending.clear();
  }
}

export const dataLoader = new DataLoader();