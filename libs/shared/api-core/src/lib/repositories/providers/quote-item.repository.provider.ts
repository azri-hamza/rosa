import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createQuoteItemRepository } from '../quote-item.repository';

export const QUOTE_ITEM_REPOSITORY = Symbol('QUOTE_ITEM_REPOSITORY');

export const QuoteItemRepositoryProvider: Provider = {
  provide: QUOTE_ITEM_REPOSITORY,
  inject: [DataSource],
  useFactory: (dataSource: DataSource) => createQuoteItemRepository(dataSource),
};
