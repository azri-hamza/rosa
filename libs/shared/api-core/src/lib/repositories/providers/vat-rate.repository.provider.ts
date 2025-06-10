import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createVatRateRepository } from '../vat-rate.repository';

export const VAT_RATE_REPOSITORY = Symbol('VAT_RATE_REPOSITORY');

export const VatRateRepositoryProvider: Provider = {
  provide: VAT_RATE_REPOSITORY,
  inject: [DataSource],
  useFactory: (dataSource: DataSource) => createVatRateRepository(dataSource),
}; 