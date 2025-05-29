import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import {
  QuoteRepositoryProvider,
  QuoteItemRepositoryProvider,
  DeliveryNoteRepositoryProvider,
  DeliveryNoteItemRepositoryProvider,
  Quote,
  QuoteItem,
  DeliveryNote,
  DeliveryNoteItem,
} from '@rosa/api-core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from '../product/product.module';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, QuoteItem, DeliveryNote, DeliveryNoteItem]),
    ProductModule,
    ClientModule
  ],
  controllers: [SalesController],
  providers: [
    SalesService,
    QuoteRepositoryProvider,
    QuoteItemRepositoryProvider,
    DeliveryNoteRepositoryProvider,
    DeliveryNoteItemRepositoryProvider,
  ],
})
export class SalesModule {}
