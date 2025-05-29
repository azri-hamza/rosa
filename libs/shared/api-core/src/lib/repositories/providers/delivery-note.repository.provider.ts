import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createDeliveryNoteRepository } from '../delivery-note.repository';

export const DELIVERY_NOTE_REPOSITORY = Symbol('DELIVERY_NOTE_REPOSITORY');

export const DeliveryNoteRepositoryProvider: Provider = {
  provide: DELIVERY_NOTE_REPOSITORY,
  inject: [DataSource],
  useFactory: (dataSource: DataSource) => createDeliveryNoteRepository(dataSource),
}; 