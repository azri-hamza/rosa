import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import {
  QuoteRepositoryProvider,
  QuoteItemRepositoryProvider,
  Quote,
  QuoteItem,
} from '@rosa/api-core';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, QuoteItem])],
  controllers: [SalesController],
  providers: [
    SalesService,
    QuoteRepositoryProvider,
    QuoteItemRepositoryProvider,
  ],
})
export class SalesModule {}
