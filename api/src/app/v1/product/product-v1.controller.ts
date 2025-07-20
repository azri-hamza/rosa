import { Controller, Get, Post, Put, Delete, Body, Param, Inject, Query, DefaultValuePipe, Patch, UseGuards, NotFoundException } from '@nestjs/common';
import { ProductService } from '../../product/product.service';
import { Product, CreateProductDto, UpdateProductDto, ProductResponseDto } from '@rosa/api-core';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Cacheable } from '../../../common/decorators/cacheable.decorator';

@Controller({ path: 'products', version: '1' })
@UseGuards(JwtAuthGuard)
export class ProductV1Controller {
  constructor(
    @Inject(ProductService) private readonly productService: ProductService
  ) {}

  @Get()
  @Cacheable({ ttl: 300 })
  async getProducts(
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('limit', new DefaultValuePipe(10)) limit: number,
    @Query('filter') filter?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC'
  ) {
    const { products, total } = await this.productService.findAll(page, limit, filter, sort, order);
    const productDtos: ProductResponseDto[] = products.map(product => ({
      id: product.id,
      productId: product.productId,
      productCode: product.productCode,
      name: product.name,
      description: product.description,
      netPrice: product.netPrice,
      grossPrice: product.grossPrice,
      vatRate: product.vatRate ? {
        id: product.vatRate.id,
        name: product.vatRate.name,
        rate: product.vatRate.rate,
        percentage: product.vatRate.percentage
      } : undefined,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));
    return {
      data: productDtos,
      total,
      page,
      limit,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Get(':product_id')
  @Cacheable({ ttl: 600 }) // Cache individual products for 10 minutes
  async getProductById(@Param('product_id') product_id: string): Promise<{
    data: ProductResponseDto;
    meta: { version: string; timestamp: string };
  }> {
    const product = await this.productService.findProductById(product_id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }
    return {
      data: this.formatProductResponse(product),
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Post()
  async createProduct(@Body() createProductDto: CreateProductDto): Promise<{
    data: ProductResponseDto;
    meta: { version: string; timestamp: string };
  }> {
    const product = await this.productService.createProduct(createProductDto);
    return {
      data: this.formatProductResponse(product),
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Put(':product_id')
  async updateProduct(
    @Param('product_id') product_id: string,
    @Body() updateProductDto: UpdateProductDto
  ): Promise<{
    data: ProductResponseDto;
    meta: { version: string; timestamp: string };
  }> {
    const product = await this.productService.updateProduct(product_id, updateProductDto);
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }
    return {
      data: this.formatProductResponse(product),
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Patch(':product_id')
  async partialUpdateProduct(
    @Param('product_id') product_id: string,
    @Body() updateProductDto: Partial<UpdateProductDto>
  ): Promise<{
    data: ProductResponseDto;
    meta: { version: string; timestamp: string };
  }> {
    const product = await this.productService.updateProduct(product_id, updateProductDto);
    return {
      data: this.formatProductResponse(product),
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Delete(':product_id')
  async deleteProduct(@Param('product_id') product_id: string): Promise<{
    message: string;
    meta: { version: string; timestamp: string };
  }> {
    await this.productService.deleteProduct(product_id);
    return {
      message: 'Product deleted successfully',
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Patch(':product_id/restore')
  async restoreProduct(@Param('product_id') product_id: string): Promise<{
    data: ProductResponseDto;
    meta: { version: string; timestamp: string };
  }> {
    const product = await this.productService.restoreProduct(product_id);
    return {
      data: this.formatProductResponse(product),
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  private formatProductResponse(product: Product): ProductResponseDto {
    return {
      id: product.id || 0, // Add id field that's required in DTO
      productId: product.productId,
      productCode: product.productCode,
      name: product.name,
      description: product.description,
      netPrice: product.netPrice,
      grossPrice: product.grossPrice,
      vatRate: product.vatRate ? {
        id: product.vatRate.id,
        name: product.vatRate.name,
        rate: product.vatRate.rate,
        percentage: product.vatRate.rate * 100, // Convert rate to percentage
      } : undefined,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }
} 