import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const CacheConfigModule = CacheModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const isRedisEnabled = configService.get('REDIS_ENABLED', 'false') === 'true';
    
    if (isRedisEnabled) {
      // Modern cache-manager v6 approach using Keyv with Redis
      const { Keyv } = await import('keyv');
      const KeyvRedis = (await import('@keyv/redis')).default;
      
      const redisUrl = `redis://${configService.get('REDIS_PASSWORD') ? `:${configService.get('REDIS_PASSWORD')}@` : ''}${configService.get('REDIS_HOST', 'localhost')}:${configService.get('REDIS_PORT', 6379)}/${configService.get('REDIS_DB', 0)}`;
      const keyvRedis = new KeyvRedis(redisUrl);

      return {
        store: new Keyv({ store: keyvRedis }),
        ttl: configService.get('CACHE_TTL', 300) * 1000, // TTL in milliseconds
      };
    } else {
      // In-memory cache configuration (fallback)
      return {
        ttl: configService.get('CACHE_TTL', 300) * 1000, // Convert to milliseconds for consistency
        max: configService.get('CACHE_MAX_ITEMS', 100), // Maximum number of items in cache
      };
    }
  },
  inject: [ConfigService],
  isGlobal: true,
}); 