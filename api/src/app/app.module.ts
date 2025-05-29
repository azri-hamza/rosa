import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../app/user/user.module';
import { SalesModule } from './sales/sales.module';
import { ProductModule } from './product/product.module';
import { User, Quote, QuoteItem, Product, Client, DeliveryNote, DeliveryNoteItem } from '@rosa/api-core';
import { join } from 'path';
import { ClientModule } from './client/client.module';
import { AuthModule } from '../auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT') ?? 5432,
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        entities: [User, Quote, QuoteItem, Product, Client, DeliveryNote, DeliveryNoteItem],
        synchronize: false,
        migrationsRun: true,
        migrations: [join(__dirname, '../migrations/*.{ts,js}')],
      }),
    }),
    UserModule,
    SalesModule,
    ProductModule,
    ClientModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
