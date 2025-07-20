import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VatRate, VatRateRepositoryProvider } from '@rosa/api-core';
import { VatRateService } from './vat-rate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VatRate])
  ],
  controllers: [],
  providers: [VatRateService, VatRateRepositoryProvider],
  exports: [VatRateService],
})
export class VatModule {} 