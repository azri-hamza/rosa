import { IsOptional, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  clientId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
} 