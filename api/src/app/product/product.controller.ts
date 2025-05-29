import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Inject,
  NotFoundException,
  Query,
  DefaultValuePipe,
  Patch,
  UseGuards
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from '@rosa/api-core';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
  constructor(
    @Inject(ProductService) private readonly productService: ProductService
  ) {}

  @Get()
  getProducts(
    @Query('page') page = 1, 
    @Query('limit') limit = 10,
    @Query('filter') filter?: string,
    @Query('sort', new DefaultValuePipe('created_at')) sort?: string,
    @Query('order', new DefaultValuePipe('DESC')) order?: 'ASC' | 'DESC'   
  ): Promise<{ count: number; data: Product[] }> {
    return this.productService.findAllProducts(page, limit, filter, sort, order);
  }

  @Get(':product_id')
  async getProductById(@Param('product_id') product_id: string): Promise<Product> {
    const product = await this.productService.findProductById(product_id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }
    return product;
  }

  @Post()
  createProduct(@Body() body: Partial<Product>): Promise<Product> {
    return this.productService.createProduct(body);
  }

  @Put(':product_id')
  async updateProduct(
    @Param('product_id') product_id: string,
    @Body() body: Partial<Product>
  ): Promise<Product> {
    const product = await this.productService.updateProduct(product_id, body);
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }
    return product;
  }

  @Delete(':product_id')
  async deleteProduct(@Param('product_id', new ParseUUIDPipe()) product_id: string): Promise<void> {
    const product = await this.productService.findProductById(product_id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }
    return this.productService.deleteProduct(product_id);
  }

  @Patch(':product_id/restore')
  async restoreProduct(@Param('product_id', new ParseUUIDPipe()) product_id: string): Promise<Product> {
    return this.productService.restoreProduct(product_id);
  }
}
