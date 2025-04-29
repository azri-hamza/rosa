import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createQuoteRepository } from '../quote.repository';

export const QUOTE_REPOSITORY = Symbol('QUOTE_REPOSITORY');

export const QuoteRepositoryProvider: Provider = {
  provide: QUOTE_REPOSITORY,
  inject: [DataSource],
  useFactory: (dataSource: DataSource) => createQuoteRepository(dataSource),
};
