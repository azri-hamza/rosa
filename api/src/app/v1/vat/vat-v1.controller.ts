import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards
} from '@nestjs/common';
import { VatRateService } from '../../vat/vat-rate.service';
import {
  CreateVatRateDto,
  UpdateVatRateDto,
  VatRateResponseDto,
  VatRateFilterDto
} from '@rosa/api-core';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller({ path: 'vat-rates', version: '1' })
@UseGuards(JwtAuthGuard)
export class VatV1Controller {
  constructor(@Inject(VatRateService) private readonly vatRateService: VatRateService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createVatRateDto: CreateVatRateDto
  ): Promise<{
    data: VatRateResponseDto;
    meta: { version: string; timestamp: string };
  }> {
    const vatRate = await this.vatRateService.create(createVatRateDto);
    return {
      data: vatRate,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Get()
  async findAll(
    @Query(new ValidationPipe({ 
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: false,
      skipMissingProperties: true 
    })) filters: VatRateFilterDto
  ): Promise<{
    data: VatRateResponseDto[];
    meta: { version: string; timestamp: string };
  }> {
    const vatRates = await this.vatRateService.findAll(filters);
    return {
      data: vatRates,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Get('search')
  async search(
    @Query(new ValidationPipe({ 
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: false,
      skipMissingProperties: true 
    })) filters: VatRateFilterDto
  ): Promise<{
    data: VatRateResponseDto[];
    meta: { version: string; timestamp: string };
  }> {
    const vatRates = await this.vatRateService.findAll(filters);
    return {
      data: vatRates,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Get('active')
  async findActiveRates(): Promise<{
    data: VatRateResponseDto[];
    meta: { version: string; timestamp: string };
  }> {
    const vatRates = await this.vatRateService.findActiveRates();
    return {
      data: vatRates,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Get('default')
  async findDefaultRate(): Promise<{
    data: VatRateResponseDto | null;
    meta: { version: string; timestamp: string };
  }> {
    const vatRate = await this.vatRateService.findDefaultRate();
    return {
      data: vatRate,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Get('effective')
  async findEffectiveRate(
    @Query('countryCode') countryCode?: string,
    @Query('date') date?: string
  ): Promise<{
    data: VatRateResponseDto | null;
    meta: { version: string; timestamp: string };
  }> {
    const effectiveDate = date ? new Date(date) : undefined;
    const vatRate = await this.vatRateService.findEffectiveRate(countryCode, effectiveDate);
    return {
      data: vatRate,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{
    data: VatRateResponseDto;
    meta: { version: string; timestamp: string };
  }> {
    const vatRate = await this.vatRateService.findOne(id);
    return {
      data: vatRate,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateVatRateDto: UpdateVatRateDto
  ): Promise<{
    data: VatRateResponseDto;
    meta: { version: string; timestamp: string };
  }> {
    const vatRate = await this.vatRateService.update(id, updateVatRateDto);
    return {
      data: vatRate,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Patch(':id/set-default')
  @HttpCode(HttpStatus.OK)
  async setAsDefault(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{
    data: VatRateResponseDto;
    meta: { version: string; timestamp: string };
  }> {
    const vatRate = await this.vatRateService.setAsDefault(id);
    return {
      data: vatRate,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    meta: { version: string; timestamp: string };
  }> {
    await this.vatRateService.remove(id);
    return {
      message: 'VAT rate deleted successfully',
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  // Utility endpoints for VAT calculations
  @Post('calculate/vat-amount')
  @HttpCode(HttpStatus.OK)
  calculateVatAmount(
    @Body() body: { netAmount: number; vatRate: number }
  ): { 
    data: { vatAmount: number };
    meta: { version: string; timestamp: string };
  } {
    const vatAmount = this.vatRateService.calculateVatAmount(body.netAmount, body.vatRate);
    return {
      data: { vatAmount },
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Post('calculate/gross-amount')
  @HttpCode(HttpStatus.OK)
  calculateGrossAmount(
    @Body() body: { netAmount: number; vatRate: number }
  ): { 
    data: { grossAmount: number };
    meta: { version: string; timestamp: string };
  } {
    const grossAmount = this.vatRateService.calculateGrossAmount(body.netAmount, body.vatRate);
    return {
      data: { grossAmount },
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Post('calculate/net-from-gross')
  @HttpCode(HttpStatus.OK)
  calculateNetFromGross(
    @Body() body: { grossAmount: number; vatRate: number }
  ): { 
    data: { netAmount: number };
    meta: { version: string; timestamp: string };
  } {
    const netAmount = this.vatRateService.calculateNetFromGross(body.grossAmount, body.vatRate);
    return {
      data: { netAmount },
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }
} 