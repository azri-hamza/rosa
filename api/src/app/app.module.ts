import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../app/user/user.module';
import { SalesModule } from './sales/sales.module';
import { ProductModule } from './product/product.module';
import { User, Quote, QuoteItem, Product, Client, DeliveryNote, DeliveryNoteItem, VatRate } from '@rosa/api-core';
import { join } from 'path';
import { ClientModule } from './client/client.module';
import { AuthModule } from '../auth/auth.module';
import { HealthModule } from './health/health.module';
import { VatModule } from './vat/vat.module';
import { V1Module } from './v1/v1.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbConfig = {
          type: 'postgres' as const,
          host: config.get<string>('DATABASE_HOST') || 'localhost',
          port: config.get<number>('DATABASE_PORT') || 5432,
          username: config.get<string>('DATABASE_USER') || 'postgres',
          password: config.get<string>('DATABASE_PASSWORD') || 'postgres',
          database: config.get<string>('DATABASE_NAME') || 'rosa_db',
          entities: [User, Quote, QuoteItem, Product, Client, DeliveryNote, DeliveryNoteItem, VatRate],
          synchronize: false,
          migrationsRun: true,
          migrations: [join(__dirname, '../migrations/*.{ts,js}')],
        };

        // Log database configuration (without password) for debugging
        console.log('Database configuration:', {
          ...dbConfig,
          password: dbConfig.password ? '[REDACTED]' : 'undefined'
        });

        // Validate required database configuration
        if (!dbConfig.username) {
          throw new Error('DATABASE_USER environment variable is required');
        }
        if (!dbConfig.password) {
          throw new Error('DATABASE_PASSWORD environment variable is required');
        }
        if (!dbConfig.database) {
          throw new Error('DATABASE_NAME environment variable is required');
        }

        return dbConfig;
      },
    }),
    UserModule,
    SalesModule,
    ProductModule,
    ClientModule,
    AuthModule,
    HealthModule,
    VatModule,
    V1Module,
  ],
})
export class AppModule {}
