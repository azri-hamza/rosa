import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDeliveryNoteItemDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  productName!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveredQuantity?: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountPercentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  grossUnitPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  vatRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  vatAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  grossTotalPrice?: number;

  @IsString()
  @IsOptional()
  productId?: string;
} 