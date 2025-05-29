import { IsOptional, IsDateString, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class DeliveryNoteFilterDto {
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

  @IsOptional()
  @IsIn(['pending', 'delivered', 'cancelled'])
  status?: 'pending' | 'delivered' | 'cancelled';
} 