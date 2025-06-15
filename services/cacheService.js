// services/cacheService.js
import config from '../config/index.js';

/**
 * Simple in-memory cache implementation
 * In a production environment, this would be replaced with Redis or another distributed cache
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0
    };
    
    // Set up periodic cleanup of expired items
    this.startCleanupInterval();
  }
  
  /**
   * Get an item from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }
    
    const cachedItem = this.cache.get(key);
    
    // Check if item has expired
    if (Date.now() > cachedItem.expiry) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      this.stats.misses++;
      return null;
    }
    
    // Return the value and update stats
    this.stats.hits++;
    return cachedItem.value;
  }
  
  /**
   * Set an item in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds
   */
  set(key, value, ttlSeconds) {
    const expiry = Date.now() + (ttlSeconds * 1000);
    
    this.cache.set(key, {
      value,
      expiry
    });
    
    this.stats.size = this.cache.size;
  }
  
  /**
   * Delete an item from cache
   * @param {string} key - Cache key
   * @returns {boolean} - True if item was deleted, false otherwise
   */
  delete(key) {
    const result = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return result;
  }
  
  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} - True if key exists and is valid
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const cachedItem = this.cache.get(key);
    if (Date.now() > cachedItem.expiry) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear all items from cache
   */
  clear() {
    this.cache.clear();
    this.stats.size = 0;
  }
  
  /**
   * Get cache statistics
   * @returns {object} - Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      hitRatio: this.stats.hits + this.stats.misses > 0 
        ? this.stats.hits / (this.stats.hits + this.stats.misses) 
        : 0
    };
  }
  
  /**
   * Start interval to clean up expired items
   * @private
   */
  startCleanupInterval() {
    // Clean up expired items every 5 minutes
    setInterval(() => {
      console.log('Running cache cleanup...');
      let removedCount = 0;
      
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiry) {
          this.cache.delete(key);
          removedCount++;
        }
      }
      
      this.stats.size = this.cache.size;
      console.log(`Cache cleanup complete. Removed ${removedCount} expired items.`);
    }, 5 * 60 * 1000);
  }
}

// Create a singleton instance
const memoryCache = new MemoryCache();

/**
 * Generic caching wrapper for async functions
 * @param {string} key - Cache key
 * @param {Function} fetchFunction - Function to fetch data if cache miss
 * @param {number} ttlSeconds - Time to live in seconds (defaults to 1 hour)
 * @returns {Promise<any>} - Cached or fresh data
 */
export async function getCachedData(key, fetchFunction, ttlSeconds = 3600) {
  // Check if data is in cache
  const cachedData = memoryCache.get(key);
  if (cachedData !== null) {
    console.log(`Cache hit for: ${key}`);
    return cachedData;
  }
  
  // Cache miss - fetch fresh data
  console.log(`Cache miss for: ${key}, fetching fresh data`);
  const freshData = await fetchFunction();
  
  // Store in cache if the data is not null/undefined
  if (freshData !== null && freshData !== undefined) {
    memoryCache.set(key, freshData, ttlSeconds);
  }
  
  return freshData;
}

/**
 * Get cache stats
 * @returns {object} - Cache statistics
 */
export function getCacheStats() {
  return memoryCache.getStats();
}

/**
 * Clear entire cache
 */
export function clearCache() {
  memoryCache.clear();
  return { success: true, message: 'Cache cleared successfully' };
}

// Export the cache instance and utility functions
export default {
  getCachedData,
  getCacheStats,
  clearCache,
  // Direct cache operations for advanced usage
  get: (key) => memoryCache.get(key),
  set: (key, value, ttlSeconds) => memoryCache.set(key, value, ttlSeconds),
  delete: (key) => memoryCache.delete(key),
  has: (key) => memoryCache.has(key)
};