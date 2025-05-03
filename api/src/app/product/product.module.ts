import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, ProductRepositoryProvider } from '@rosa/api-core';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [ProductService, ProductRepositoryProvider],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}
