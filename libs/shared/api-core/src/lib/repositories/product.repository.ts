import { DataSource, Repository, IsNull, DeleteResult, UpdateResult } from 'typeorm';
import { Product } from '../entities/product.entity';

export class ProductRepository extends Repository<Product> {
  constructor(dataSource: DataSource) {
    super(Product, dataSource.createEntityManager());
  }

  async findById(productId: string): Promise<Product> {
    const product = await this.findOne({ 
      where: { 
        productId,
        deletedAt: IsNull()
      } 
    });
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    return product;
  }

  async findByProductId(productId: string): Promise<Product | null> {
    return this.findOne({ 
      where: { 
        productId,
        deletedAt: IsNull()
      } 
    });
  }

  async findByProductCode(productCode: string): Promise<Product | null> {
    return this.findOne({ 
      where: { 
        productCode,
        deletedAt: IsNull()
      } 
    });
  }

  // Override delete to use soft delete
  override async delete(criteria: string): Promise<DeleteResult> {
    return this.softDelete({ productId: criteria });
  }

  // Method to restore a soft-deleted product
  override async restore(criteria: string): Promise<UpdateResult> {
    return super.restore({ productId: criteria });
  }
}

// Factory function for dependency injection
export const createProductRepository = (dataSource: DataSource) => {
  return new ProductRepository(dataSource);
};
