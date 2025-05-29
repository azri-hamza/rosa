import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Product, ProductRepository, PRODUCT_REPOSITORY } from '@rosa/api-core';
import { IsNull } from 'typeorm';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository
  ) {}
  
  async findAllProducts(
    page = 1, 
    limit = 10, 
    filter?: string,
    sort = 'created_at',
    order: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{ count: number; data: Product[] }> {
    const queryBuilder = this.productRepository.createQueryBuilder('product');
    
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

    if (sort) {
      queryBuilder.orderBy(`product.${sort}`, order);
    }
    
    const [products, count] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
      
    return { count, data: products };
  }
  
  async findProductById(productId: string): Promise<Product> {
    const product = await this.productRepository.findOne({where: {productId, deletedAt: IsNull()}});
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
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

  async createProduct(data: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create({
      ...data,
      productCode:
        data.productCode || (await this.generateUniqueProductCode()),
    });
    return this.productRepository.save(product);
  }

  async updateProduct(product_id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.findProductById(product_id);
    const updatedProduct = this.productRepository.merge(product, data);
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
