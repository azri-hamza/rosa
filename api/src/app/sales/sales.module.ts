import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { QuoteRepositoryProvider, Quote } from '@rosa/api-core';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Quote])],
  controllers: [SalesController],
  providers: [SalesService, QuoteRepositoryProvider],
})
export class SalesModule {}
