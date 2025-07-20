import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { 
  DeliveryNote, 
  DeliveryNoteItem, 
  Product,
  QuoteRepositoryProvider,
  DeliveryNoteRepositoryProvider,
  ProductRepositoryProvider,
  DeliveryNoteItemRepositoryProvider,
  VatRateRepositoryProvider,
} from '@rosa/api-core';
import { SalesService } from './sales.service';
import { ProductService } from '../product/product.service';
import { VatModule } from '../vat/vat.module';
import { ProductModule } from '../product/product.module';
import { ClientModule } from '../client/client.module';
import { PdfService } from './pdf.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryNote, DeliveryNoteItem, Product]),
    VatModule,
    ProductModule,
    ClientModule,
  ],
  controllers: [],
  providers: [
    SalesService,
    ProductService,
    PdfService,
    QuoteRepositoryProvider,
    DeliveryNoteRepositoryProvider,
    ProductRepositoryProvider,
    DeliveryNoteItemRepositoryProvider,
    VatRateRepositoryProvider,
  ],
  exports: [SalesService],
})
export class SalesModule {}
