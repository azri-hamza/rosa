import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  Length,
  IsPositive,
  Min
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @Length(1, 255)
  name!: string;

  @IsString()
  @Length(1, 1000)
  description!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  productCode?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  netPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  vatRateId?: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  productCode?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  netPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  vatRateId?: number;
}

export class ProductResponseDto {
  id!: number;
  productId!: string;
  productCode!: string;
  name!: string;
  description!: string;
  netPrice?: number;
  grossPrice?: number;
  vatRate?: {
    id: number;
    name: string;
    rate: number;
    percentage: number;
  };
  createdAt!: Date;
  updatedAt!: Date;
} 