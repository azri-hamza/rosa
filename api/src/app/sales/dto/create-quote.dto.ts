import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNumber, IsOptional } from 'class-validator';
import { CreateQuoteItemDto } from './create-quote-item.dto';

export class CreateQuoteDto {
  @IsNumber()
  @IsOptional()
  year?: number;

  @IsNumber()
  @IsOptional()
  clientId?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  userDate?: Date | null;

  @IsArray()
  @IsOptional()
  @Type(() => CreateQuoteItemDto)
  items?: CreateQuoteItemDto[];
} 