import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('vat_rates')
@Index(['name'], { unique: true })
@Index(['rate'])
export class VatRate extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true
  })
  name!: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: false,
    comment: 'VAT rate as decimal (e.g., 0.2000 for 20%)'
  })
  rate!: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
    comment: 'VAT rate as percentage (e.g., 20.00 for 20%)'
  })
  percentage!: number;

  @Column({
    type: 'text',
    nullable: true
  })
  description?: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false
  })
  isActive!: boolean;

  @Column({
    name: 'is_default',
    type: 'boolean',
    default: false,
    nullable: false
  })
  isDefault!: boolean;

  @Column({
    name: 'country_code',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'Country code for country-specific VAT rates'
  })
  countryCode?: string;

  @Column({
    name: 'effective_from',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Date when this VAT rate becomes effective'
  })
  effectiveFrom?: Date;

  @Column({
    name: 'effective_to',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Date when this VAT rate expires'
  })
  effectiveTo?: Date;
} 