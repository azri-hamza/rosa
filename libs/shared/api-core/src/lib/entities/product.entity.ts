import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { QuoteItem } from './quote-item.entity';
import { VatRate } from './vat.entity';

@Entity()
export class Product extends BaseEntity {
  @Column({
    name: 'product_id',
    type: 'uuid',
    unique: true,
    nullable: false,
    default: () => 'uuid_generate_v4()',
  })
  productId!: string;

  @Column({ name: 'product_code', type: 'varchar', unique: true })
  productCode!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    name: 'net_price',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    comment: 'Net price before VAT',
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => value ? parseFloat(value) : null,
    }
  })
  netPrice?: number;

  @ManyToOne(() => VatRate, { nullable: true, eager: true })
  @JoinColumn({ 
    name: 'vat_rate_id',
    referencedColumnName: 'id'
  })
  vatRate?: VatRate | null;

  @OneToMany(() => QuoteItem, (quoteItem) => quoteItem.product, {
    cascade: false,
    eager: false
  })
  quoteItems!: QuoteItem[];

  // Computed property for gross price
  get grossPrice(): number | undefined {
    if (this.netPrice && this.vatRate) {
      return Math.round(this.netPrice * (1 + this.vatRate.rate) * 1000) / 1000;
    }
    return this.netPrice;
  }
}
