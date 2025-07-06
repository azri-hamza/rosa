import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Product, ProductRepository, PRODUCT_REPOSITORY, VatRate, CreateProductDto, UpdateProductDto } from '@rosa/api-core';
import { IsNull } from 'typeorm';
import { VatRateService } from '../vat/vat-rate.service';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(VatRateService) private readonly vatRateService: VatRateService
  ) {}
  
  async findAll(
    page = 1, 
    limit = 10, 
    filter?: string,
    sort = 'created_at',
    order: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{ products: Product[]; total: number }> {
    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.vatRate', 'vatRate');
    
    // Only get non-deleted products
    queryBuilder.where('product.deleted_at IS NULL');
    
    if (filter) {
      queryBuilder.andWhere(
        '(product.name ILIKE :filter OR product.product_code ILIKE :filter OR product.description ILIKE :filter)',
        { filter: `%${filter}%` }
      );
    }

    if (order && !['ASC', 'DESC'].includes(order)) {
      throw new BadRequestException('Invalid order value. Use ASC or DESC.');
    }

    // Map sort fields to their actual column names to avoid TypeORM column resolution issues
    const sortFieldMap: Record<string, string> = {
      'created_at': 'product.createdAt',
      'updated_at': 'product.updatedAt',
      'name': 'product.name',
      'product_code': 'product.productCode',
      'net_price': 'product.netPrice',
      'description': 'product.description'
    };

    if (sort) {
      const mappedSort = sortFieldMap[sort] || `product.${sort}`;
      queryBuilder.orderBy(mappedSort, order);
    }
    
    const [products, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
      
    return { products, total };
  }

  async findAllProducts(
    page = 1, 
    limit = 10, 
    filter?: string,
    sort = 'created_at',
    order: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{ count: number; data: Product[] }> {
    const { products, total } = await this.findAll(page, limit, filter, sort, order);
    return { count: total, data: products };
  }
  
  async findProductById(productId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { productId, deletedAt: IsNull() },
      relations: ['vatRate']
    });
    if (!product) {
      throw new NotFoundException(`Product with UUID ${productId} not found`);
    }
    return product;
  }

  private async generateUniqueProductCode(baseCode?: string): Promise<string> {
    const prefix = 'PROD';
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const generatedCode = baseCode || `${prefix}-${timestamp}-${randomSuffix}`;

    // Check if the code already exists (including soft-deleted products)
    const existingProduct = await this.productRepository.findOne({
      where: { productCode: generatedCode },
      withDeleted: true // Include soft-deleted products in the check
    });

    if (existingProduct) {
      // If code exists, generate a new one recursively
      return this.generateUniqueProductCode();
    }

    return generatedCode;
  }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    let vatRate: VatRate | undefined;
    
    if (createProductDto.vatRateId) {
      vatRate = await this.vatRateService.findEntityById(createProductDto.vatRateId);
    }

    const product = this.productRepository.create({
      name: createProductDto.name,
      description: createProductDto.description,
      netPrice: createProductDto.netPrice,
      vatRate: vatRate,
      productCode: createProductDto.productCode || (await this.generateUniqueProductCode()),
    });

    return this.productRepository.save(product);
  }

  async updateProduct(product_id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findProductById(product_id);
    
    let vatRate: VatRate | undefined | null = product.vatRate;
    
    if (updateProductDto.vatRateId !== undefined) {
      if (updateProductDto.vatRateId === null) {
        vatRate = null;
      } else {
        vatRate = await this.vatRateService.findEntityById(updateProductDto.vatRateId);
      }
    }

    const updatedProduct = this.productRepository.merge(product, {
      ...updateProductDto,
      vatRate: vatRate
    });

    return this.productRepository.save(updatedProduct);
  }

  async deleteProduct(product_id: string): Promise<void> {
    await this.productRepository.delete(product_id);
  }

  // New method to restore a soft-deleted product
  async restoreProduct(productId: string): Promise<Product> {
    const product = await this.productRepository.findOne({ 
      where: { productId },
      withDeleted: true 
    });
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    
    if (!product.deletedAt) {
      throw new BadRequestException(`Product with ID ${productId} is not deleted`);
    }
    
    await this.productRepository.restore(productId);
    return this.findProductById(productId);
  }
}
