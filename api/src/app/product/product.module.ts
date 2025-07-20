import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, ProductRepositoryProvider } from '@rosa/api-core';
import { ProductService } from './product.service';
import { VatModule } from '../vat/vat.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    VatModule,
  ],
  controllers: [],
  providers: [
    ProductService,
    ProductRepositoryProvider,
  ],
  exports: [ProductService, ProductRepositoryProvider],
})
export class ProductModule {}
