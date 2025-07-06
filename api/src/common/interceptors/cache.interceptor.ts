import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHEABLE_KEY, CacheableOptions, generateCacheKey } from '../decorators/cacheable.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheOptions = this.reflector.get<CacheableOptions>(
      CACHEABLE_KEY,
      context.getHandler(),
    );

    if (!cacheOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url, query, params } = request;
    
    // Generate cache key
    const cacheKey = cacheOptions.key || 
      generateCacheKey(
        `${context.getClass().name}:${context.getHandler().name}`,
        method,
        url,
        query,
        params
      );

    // Try to get from cache
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return of(cachedResult);
    }

    // If not in cache, execute the method and cache the result
    return next.handle().pipe(
      tap(async (result) => {
        const ttl = cacheOptions.ttl || 300; // 5 minutes default
        await this.cacheManager.set(cacheKey, result, ttl);
      }),
    );
  }
} 