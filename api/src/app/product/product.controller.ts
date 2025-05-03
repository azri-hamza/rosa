import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from '@rosa/api-core';

@Controller('products')
export class ProductController {
  constructor(
    @Inject(ProductService) private readonly productService: ProductService
  ) {}

  @Get()
  getProducts(): Promise<Product[]> {
    return this.productService.findAllProducts();
  }

  @Get(':id')
  async getProductById(@Param('id') id: number): Promise<Product> {
    const product = await this.productService.findProductById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  @Post()
  createProduct(@Body() body: Partial<Product>): Promise<Product> {
    return this.productService.createProduct(body);
  }

  @Put(':id')
  async updateProduct(
    @Param('id') id: number,
    @Body() body: Partial<Product>
  ): Promise<Product> {
    const product = await this.productService.updateProduct(id, body);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: number): Promise<void> {
    const product = await this.productService.findProductById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.productService.deleteProduct(id);
  }
}
