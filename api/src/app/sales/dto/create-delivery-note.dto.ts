import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { CreateDeliveryNoteItemDto } from './create-delivery-note-item.dto';

export enum DeliveryNoteStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export class CreateDeliveryNoteDto {
  @IsNumber()
  @IsOptional()
  year?: number;

  @IsNumber()
  @IsOptional()
  clientId?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  deliveryDate?: Date;

  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(DeliveryNoteStatus)
  @IsOptional()
  status?: 'pending' | 'delivered' | 'cancelled';

  @IsNumber()
  @IsOptional()
  globalDiscountPercentage?: number;

  @IsNumber()
  @IsOptional()
  globalDiscountAmount?: number;

  @IsNumber()
  @IsOptional()
  netTotalBeforeGlobalDiscount?: number;

  @IsNumber()
  @IsOptional()
  netTotalAfterGlobalDiscount?: number;

  @IsArray()
  @IsOptional()
  @Type(() => CreateDeliveryNoteItemDto)
  items?: CreateDeliveryNoteItemDto[];
} 