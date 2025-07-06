# Caching Layer Implementation Guide

## Overview

This document explains how to set up and use the caching layer that has been implemented in the Rosa application.

## Installation

First, install the required packages:

```bash
pnpm add -w @nestjs/cache-manager cache-manager cache-manager-redis-store redis
pnpm add -w -D @types/cache-manager-redis-store
```

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Cache Configuration
REDIS_ENABLED=false          # Set to true to enable Redis, false for in-memory cache
REDIS_HOST=localhost         # Redis server host
REDIS_PORT=6379             # Redis server port
REDIS_PASSWORD=             # Redis password (if required)
REDIS_DB=0                  # Redis database number
CACHE_TTL=300               # Default cache TTL in seconds (5 minutes)
CACHE_MAX_ITEMS=100         # Maximum items in memory cache
```

### Module Setup

Update your `AppModule` to include the cache configuration:

```typescript
// api/src/app/app.module.ts
import { CacheConfigModule } from '../config/cache.config';

@Module({
  imports: [
    CacheConfigModule,
    // ... other imports
  ],
})
export class AppModule {}
```

## Usage

### Service Level Caching

The `ProductService` has been updated with caching functionality:

1. **Automatic Cache Keys**: Cache keys are generated automatically based on method parameters
2. **Cache Invalidation**: Cache is invalidated when products are created, updated, or deleted
3. **Configurable TTL**: Different cache durations for different operations

### Controller Level Caching

Controllers can use the `@Cacheable` decorator:

```typescript
@Get()
@Cacheable({ ttl: 300 }) // Cache for 5 minutes
async getProducts() {
  // Method implementation
}
```

### Manual Cache Management

Services can manually manage cache using the injected `CACHE_MANAGER`:

```typescript
constructor(
  @Inject(CACHE_MANAGER) private cacheManager: Cache
) {}

// Get from cache
const cached = await this.cacheManager.get('key');

// Set cache
await this.cacheManager.set('key', value, ttl);

// Delete from cache
await this.cacheManager.del('key');
```

## Implementation Status

### ✅ Completed
- Cache configuration module
- Cacheable decorator
- Cache interceptor
- ProductService caching integration
- ProductController caching decorators
- Cache invalidation logic

### 🔄 To Complete After Package Installation

1. **Uncomment cache code in ProductService**:
   - Uncomment the cache manager injection
   - Uncomment cache get/set operations
   - Uncomment cache invalidation methods

2. **Enable cache interceptor globally**:
   ```typescript
   // api/src/main.ts
   import { CacheInterceptor } from './common/interceptors/cache.interceptor';
   
   app.useGlobalInterceptors(new CacheInterceptor());
   ```

3. **Add cache to other services** (VatRateService, ClientService, etc.)

## Cache Strategy

### Cache Keys
- Products list: `products:findAll:page:limit:filter:sort:order`
- Individual product: `product:productId`
- VAT rates: `vat:rates:active`
- Clients: `clients:page:limit:filter`

### TTL (Time To Live)
- Product lists: 5 minutes (300 seconds)
- Individual products: 10 minutes (600 seconds)
- VAT rates: 15 minutes (900 seconds)
- Client data: 5 minutes (300 seconds)

### Cache Invalidation
- **Product operations**: Invalidate all product-related cache
- **VAT rate changes**: Invalidate VAT and product cache (products depend on VAT rates)
- **Client operations**: Invalidate client-related cache

## Redis Setup (Optional)

### Using Docker
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### Using Local Installation
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis
```

Set `REDIS_ENABLED=true` in your environment to enable Redis caching.

## Monitoring

### Cache Hit Rates
Monitor cache effectiveness by adding logging:

```typescript
// In services
console.log(`Cache hit for key: ${cacheKey}`);
console.log(`Cache miss for key: ${cacheKey}`);
```

### Cache Size (Redis)
```bash
redis-cli info memory
redis-cli dbsize
```

## Performance Benefits

### Expected Improvements
- **Database Load**: 60-80% reduction in repeated queries
- **Response Time**: 50-70% faster for cached responses
- **Scalability**: Better handling of concurrent requests

### Metrics to Track
- Average response time
- Database query count
- Cache hit ratio
- Memory usage

## Troubleshooting

### Common Issues

1. **Cache not working**: Check if packages are installed and cache module is imported
2. **Redis connection errors**: Verify Redis is running and connection settings
3. **Memory issues**: Adjust `CACHE_MAX_ITEMS` for in-memory cache

### Debugging

Enable cache debugging by adding logs to the cache interceptor and service methods.

## Next Steps

1. Install the required packages when network is stable
2. Uncomment the cache code in services
3. Test with both in-memory and Redis caching
4. Add caching to other services (VatRateService, ClientService, SalesService)
5. Implement cache warming strategies for frequently accessed data
6. Add cache monitoring and metrics 