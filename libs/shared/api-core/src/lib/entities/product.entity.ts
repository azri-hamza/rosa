import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { QuoteItem } from './quote-item.entity';

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

  @OneToMany(() => QuoteItem, (quoteItem) => quoteItem.product, {
    cascade: false,
    eager: false
  })
  quoteItems!: QuoteItem[];
}
