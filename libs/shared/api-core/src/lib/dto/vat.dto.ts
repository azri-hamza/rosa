import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsBoolean, 
  IsDateString,
  IsPositive,
  Max,
  Min,
  Length,
  Matches
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateVatRateDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  rate!: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  @Matches(/^[A-Z]{2,10}$/, { message: 'Country code must be uppercase letters' })
  countryCode?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class UpdateVatRateDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  rate?: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  @Matches(/^[A-Z]{2,10}$/, { message: 'Country code must be uppercase letters' })
  countryCode?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;
}

export class VatRateResponseDto {
  id!: number;
  name!: string;
  rate!: number;
  percentage!: number;
  description?: string;
  isActive!: boolean;
  isDefault!: boolean;
  countryCode?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

export class VatRateFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  countryCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  })
  minRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  })
  maxRate?: number;
} 