import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Product, ProductRepository, PRODUCT_REPOSITORY } from '@rosa/api-core';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository
  ) {}

  findAllProducts(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async findProductById(id: number): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
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

    // Check if the code already exists
    const existingProduct = await this.productRepository.findOne({
      where: { product_code: generatedCode },
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
      product_code:
        data.product_code || (await this.generateUniqueProductCode()),
    });
    return this.productRepository.save(product);
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const product = await this.findProductById(id);
    const updatedProduct = this.productRepository.merge(product, data);
    return this.productRepository.save(updatedProduct);
  }

  async deleteProduct(id: number): Promise<void> {
    const product = await this.findProductById(id);
    await this.productRepository.remove(product);
  }
}
