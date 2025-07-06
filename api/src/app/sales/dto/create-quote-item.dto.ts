import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateQuoteItemDto {
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
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalPrice?: number;

  @IsString()
  @IsOptional()
  productId?: string;
} 