import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateClientDto {
  @IsUUID()
  referenceId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  taxIdentificationNumber?: string;

  @IsString()
  @IsOptional()
  @Length(1, 20)
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  address!: string;
}

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  taxIdentificationNumber?: string;

  @IsString()
  @IsOptional()
  @Length(1, 20)
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  address?: string;
} 