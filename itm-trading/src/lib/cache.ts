// Enterprise-grade caching system for high performance

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class EnterpriseCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 1000; // Maximum cache entries
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Remove expired entries
  cleanup(): void {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    // If not enough removed, remove oldest entries
    if (removed < 100 && this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)
        .slice(0, 100);
        
      entries.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: (this.cache.size / this.maxSize) * 100
    };
  }
}

// Singleton cache instance
export const cache = new EnterpriseCache();

// Cache decorators for functions
export function cacheable<T extends (...args: any[]) => Promise<any>>(
  ttl: number = 5 * 60 * 1000
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache first
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await method.apply(this, args);
      
      // Cache the result
      cache.set(cacheKey, result, ttl);
      
      return result;
    };
  };
}

// Cache helper functions
export const cacheHelpers = {
  // Cache with automatic key generation
  async withCache<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = cache.get<T>(key);
    if (cached !== null) return cached;
    
    const result = await fetcher();
    cache.set(key, result, ttl);
    return result;
  },

  // Invalidate related cache entries
  invalidatePattern(pattern: string): number {
    let count = 0;
    for (const key of cache['cache'].keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
        count++;
      }
    }
    return count;
  },

  // Warm up cache with data
  async warmup(entries: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>) {
    const promises = entries.map(async ({ key, fetcher, ttl }) => {
      try {
        const data = await fetcher();
        cache.set(key, data, ttl);
        return { key, success: true };
      } catch (error) {
        return { key, success: false, error };
      }
    });

    return await Promise.allSettled(promises);
  }
};

// Background cache cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 60000); // Cleanup every minute
}

export default cache;

