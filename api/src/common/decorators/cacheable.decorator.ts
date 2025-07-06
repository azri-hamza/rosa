import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_KEY = 'cacheable';

export interface CacheableOptions {
  ttl?: number; // Time to live in seconds
  key?: string; // Custom cache key
}

export const Cacheable = (options?: CacheableOptions) => 
  SetMetadata(CACHEABLE_KEY, options || {});

// Helper function to generate cache keys
export const generateCacheKey = (prefix: string, ...args: any[]): string => {
  const keyParts = [prefix, ...args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  )];
  return keyParts.join(':');
}; 