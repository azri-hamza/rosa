import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createDeliveryNoteItemRepository } from '../delivery-note-item.repository';

export const DELIVERY_NOTE_ITEM_REPOSITORY = Symbol('DELIVERY_NOTE_ITEM_REPOSITORY');

export const DeliveryNoteItemRepositoryProvider: Provider = {
  provide: DELIVERY_NOTE_ITEM_REPOSITORY,
  inject: [DataSource],
  useFactory: (dataSource: DataSource) => createDeliveryNoteItemRepository(dataSource),
}; 