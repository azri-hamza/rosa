import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createClientRepository } from '../client.repository';

export const CLIENT_REPOSITORY = Symbol('CLIENT_REPOSITORY');

export const ClientRepositoryProvider: Provider = {
  provide: CLIENT_REPOSITORY,
  inject: [DataSource],
  useFactory: (dataSource: DataSource) => createClientRepository(dataSource),
}; 