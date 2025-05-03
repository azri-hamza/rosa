import { DataSource, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

export class ProductRepository extends Repository<Product> {
  constructor(dataSource: DataSource) {
    super(Product, dataSource.createEntityManager());
  }

  async findById(id: number): Promise<Product> {
    const product = await this.findOne({ where: { id } });
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findByProductId(productId: string): Promise<Product | null> {
    return this.findOne({ where: { product_id: productId } });
  }

  async findByProductCode(code: string): Promise<Product | null> {
    return this.findOne({ where: { product_code: code } });
  }
}

// Factory function for dependency injection
export const createProductRepository = (dataSource: DataSource) => {
  return new ProductRepository(dataSource);
};
