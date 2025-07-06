import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const CacheConfigModule = CacheModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const isRedisEnabled = configService.get('REDIS_ENABLED', 'false') === 'true';
    
    if (isRedisEnabled) {
      // Redis configuration (when Redis is available)
      const redisStore = await import('cache-manager-redis-store');
      return {
        store: redisStore.default,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 0),
        ttl: configService.get('CACHE_TTL', 300), // 5 minutes default
        max: configService.get('CACHE_MAX_ITEMS', 100),
      };
    } else {
      // In-memory cache configuration (fallback)
      return {
        ttl: configService.get('CACHE_TTL', 300), // 5 minutes default
        max: configService.get('CACHE_MAX_ITEMS', 100), // Maximum number of items in cache
      };
    }
  },
  inject: [ConfigService],
  isGlobal: true,
}); 