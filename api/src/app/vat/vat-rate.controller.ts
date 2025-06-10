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
  Inject
} from '@nestjs/common';
import { VatRateService } from './vat-rate.service';
import {
  CreateVatRateDto,
  UpdateVatRateDto,
  VatRateResponseDto,
  VatRateFilterDto
} from '@rosa/api-core';

@Controller('vat-rates')
export class VatRateController {
  constructor(@Inject(VatRateService) private readonly vatRateService: VatRateService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createVatRateDto: CreateVatRateDto
  ): Promise<VatRateResponseDto> {
    return this.vatRateService.create(createVatRateDto);
  }

  @Get()
  async findAll(
    @Query(new ValidationPipe({ 
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: false,
      skipMissingProperties: true 
    })) filters: VatRateFilterDto
  ): Promise<VatRateResponseDto[]> {
    return this.vatRateService.findAll(filters);
  }

  @Get('search')
  async search(
    @Query(new ValidationPipe({ 
      transform: true, 
      whitelist: true, 
      forbidNonWhitelisted: false,
      skipMissingProperties: true 
    })) filters: VatRateFilterDto
  ): Promise<VatRateResponseDto[]> {
    return this.vatRateService.findAll(filters);
  }

  @Get('active')
  async findActiveRates(): Promise<VatRateResponseDto[]> {
    return this.vatRateService.findActiveRates();
  }

  @Get('default')
  async findDefaultRate(): Promise<VatRateResponseDto | null> {
    return this.vatRateService.findDefaultRate();
  }

  @Get('effective')
  async findEffectiveRate(
    @Query('countryCode') countryCode?: string,
    @Query('date') date?: string
  ): Promise<VatRateResponseDto | null> {
    const effectiveDate = date ? new Date(date) : undefined;
    return this.vatRateService.findEffectiveRate(countryCode, effectiveDate);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<VatRateResponseDto> {
    return this.vatRateService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateVatRateDto: UpdateVatRateDto
  ): Promise<VatRateResponseDto> {
    return this.vatRateService.update(id, updateVatRateDto);
  }

  @Patch(':id/set-default')
  @HttpCode(HttpStatus.OK)
  async setAsDefault(
    @Param('id', ParseIntPipe) id: number
  ): Promise<VatRateResponseDto> {
    return this.vatRateService.setAsDefault(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.vatRateService.remove(id);
  }

  // Utility endpoints for VAT calculations
  @Post('calculate/vat-amount')
  @HttpCode(HttpStatus.OK)
  calculateVatAmount(
    @Body() body: { netAmount: number; vatRate: number }
  ): { vatAmount: number } {
    const vatAmount = this.vatRateService.calculateVatAmount(body.netAmount, body.vatRate);
    return { vatAmount };
  }

  @Post('calculate/gross-amount')
  @HttpCode(HttpStatus.OK)
  calculateGrossAmount(
    @Body() body: { netAmount: number; vatRate: number }
  ): { grossAmount: number } {
    const grossAmount = this.vatRateService.calculateGrossAmount(body.netAmount, body.vatRate);
    return { grossAmount };
  }

  @Post('calculate/net-from-gross')
  @HttpCode(HttpStatus.OK)
  calculateNetFromGross(
    @Body() body: { grossAmount: number; vatRate: number }
  ): { netAmount: number } {
    const netAmount = this.vatRateService.calculateNetFromGross(body.grossAmount, body.vatRate);
    return { netAmount };
  }
} 