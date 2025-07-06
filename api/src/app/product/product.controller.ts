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
import { Product, CreateProductDto, UpdateProductDto, ProductResponseDto } from '@rosa/api-core';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Cacheable } from '../../common/decorators/cacheable.decorator';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
  constructor(
    @Inject(ProductService) private readonly productService: ProductService
  ) {}

  @Get()
  @Cacheable({ ttl: 300 }) // Cache for 5 minutes
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
    };
  }

  @Get(':product_id')
  @Cacheable({ ttl: 600 }) // Cache individual products for 10 minutes
  async getProductById(@Param('product_id') product_id: string): Promise<Product> {
    const product = await this.productService.findProductById(product_id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }
    return product;
  }

  @Post()
  async createProduct(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.productService.createProduct(createProductDto);
    return {
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
    };
  }

  @Put(':product_id')
  async updateProduct(
    @Param('product_id') product_id: string,
    @Body() updateProductDto: UpdateProductDto
  ): Promise<ProductResponseDto> {
    const product = await this.productService.updateProduct(product_id, updateProductDto);
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }
    return {
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
    };
  }

  @Delete(':product_id')
  async deleteProduct(@Param('product_id') product_id: string): Promise<void> {
    await this.productService.deleteProduct(product_id);
  }

  @Patch(':product_id/restore')
  async restoreProduct(@Param('product_id', new ParseUUIDPipe()) product_id: string): Promise<Product> {
    return this.productService.restoreProduct(product_id);
  }
}
