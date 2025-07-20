import { Module } from '@nestjs/common';
import { ProductV1Controller } from './product/product-v1.controller';
import { ClientV1Controller } from './client/client-v1.controller';
import { SalesV1Controller } from './sales/sales-v1.controller';
import { UserV1Controller } from './user/user-v1.controller';
import { VatV1Controller } from './vat/vat-v1.controller';

// Import services from the original modules
import { ProductService } from '../product/product.service';
import { ClientService } from '../client/client.service';
import { SalesService } from '../sales/sales.service';
import { UserService } from '../user/user.service';
import { VatRateService } from '../vat/vat-rate.service';
import { PdfService } from '../sales/pdf.service';

// Import repository providers
import { 
  ProductRepositoryProvider,
  ClientRepositoryProvider,
  UserRepositoryProvider,
  VatRateRepositoryProvider,
  QuoteRepositoryProvider,
  DeliveryNoteRepositoryProvider,
  QuoteItemRepositoryProvider,
  DeliveryNoteItemRepositoryProvider
} from '@rosa/api-core';

@Module({
  controllers: [
    ProductV1Controller,
    ClientV1Controller,
    SalesV1Controller,
    UserV1Controller,
    VatV1Controller,
  ],
  providers: [
    // Services
    ProductService,
    ClientService,
    SalesService,
    UserService,
    VatRateService,
    PdfService,
    
    // Repository providers
    ProductRepositoryProvider,
    ClientRepositoryProvider,
    UserRepositoryProvider,
    VatRateRepositoryProvider,
    QuoteRepositoryProvider,
    DeliveryNoteRepositoryProvider,
    QuoteItemRepositoryProvider,
    DeliveryNoteItemRepositoryProvider,
  ],
})
export class V1Module {} 