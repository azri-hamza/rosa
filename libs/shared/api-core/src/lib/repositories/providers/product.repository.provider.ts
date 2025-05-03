import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createProductRepository } from '../product.repository';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export const ProductRepositoryProvider: Provider = {
  provide: PRODUCT_REPOSITORY,
  inject: [DataSource],
  useFactory: (dataSource: DataSource) => createProductRepository(dataSource),
};
