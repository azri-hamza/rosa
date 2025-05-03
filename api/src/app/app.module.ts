import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../app/user/user.module';
import { SalesModule } from './sales/sales.module';
import { ProductModule } from './product/product.module';
import { User, Quote, QuoteItem, Product } from '@rosa/api-core';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT') ?? 5432,
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        entities: [User, Quote, QuoteItem, Product],
        synchronize: true,
        migrationsRun: true,
        migrations: [join(__dirname, '../migrations/*.{ts,js}')],
      }),
    }),
    UserModule,
    SalesModule,
    ProductModule,
  ],
})
export class AppModule {}
