import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Product, ProductRepository, PRODUCT_REPOSITORY, VatRate, CreateProductDto, UpdateProductDto } from '@rosa/api-core';
import { IsNull } from 'typeorm';
import { VatRateService } from '../vat/vat-rate.service';
// import { generateCacheKey } from '../../common/decorators/cacheable.decorator';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(VatRateService) private readonly vatRateService: VatRateService,
    // Note: CACHE_MANAGER will be injected when packages are installed
    // @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}
  
  async findAll(
    page = 1, 
    limit = 10, 
    filter?: string,
    sort = 'created_at',
    order: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{ products: Product[]; total: number }> {
    // Generate cache key for this query
    // const cacheKey = generateCacheKey('products:findAll', page, limit, filter, sort, order);
    
    // TODO: Uncomment when cache packages are installed
    // Check cache first
    // const cached = await this.cacheManager.get<{ products: Product[]; total: number }>(cacheKey);
    // if (cached) {
    //   return cached;
    // }

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

    const result = { products, total };
    
    // TODO: Uncomment when cache packages are installed
    // Cache the result for 5 minutes
    // await this.cacheManager.set(cacheKey, result, 300);
      
    return result;
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

    const savedProduct = await this.productRepository.save(product);
    
    // Invalidate products cache after creation
    await this.invalidateProductsCache();
    
    return savedProduct;
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

    const savedProduct = await this.productRepository.save(updatedProduct);
    
    // Invalidate cache after update
    await this.invalidateProductsCache();
    await this.invalidateProductCache(product_id);
    
    return savedProduct;
  }

  async deleteProduct(product_id: string): Promise<void> {
    await this.productRepository.delete(product_id);
    
    // Invalidate cache after deletion
    await this.invalidateProductsCache();
    await this.invalidateProductCache(product_id);
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
    
    // Invalidate cache after restoration
    await this.invalidateProductsCache();
    
    return this.findProductById(productId);
  }

  // Cache management methods
  private async invalidateProductsCache(): Promise<void> {
    // TODO: Uncomment when cache packages are installed
    // const keys = await this.cacheManager.store.keys('products:*');
    // await Promise.all(keys.map(key => this.cacheManager.del(key)));
    
    // For now, just log that cache would be invalidated
    console.log('Cache invalidation triggered for products');
  }

  private async invalidateProductCache(productId: string): Promise<void> {
    // TODO: Uncomment when cache packages are installed
    // const cacheKey = generateCacheKey('product', productId);
    // await this.cacheManager.del(cacheKey);
    
    // For now, just log that cache would be invalidated
    console.log(`Cache invalidation triggered for product: ${productId}`);
  }
}
