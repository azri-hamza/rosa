import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { Quote } from './quote.entity';
import { BaseEntity } from './base.entity';
import { Product } from './product.entity';

@Entity()
export class QuoteItem extends BaseEntity {
  @Column({ 
    name: 'product_name',
    type: 'varchar',
    default: ''
  })
  productName!: string;

  @Column({ 
    type: 'text', 
    nullable: true,
    default: ''
  })
  description!: string;

  @Column({ 
    type: 'int',
    default: 0
  })
  quantity!: number;

  @Column({ 
    name: 'unit_price',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  unitPrice!: number;

  @Column({ 
    name: 'total_price',
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0
  })
  totalPrice!: number;

  @ManyToOne(() => Quote, (quote) => quote.items, { 
    onDelete: 'CASCADE',
    nullable: false 
  })
  @JoinColumn({ 
    name: 'quote_id',
    referencedColumnName: 'id'
  })
  quote!: Quote;

  @ManyToOne(() => Product, { nullable: true, eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ 
    name: 'product_id',
    referencedColumnName: 'id'
  })
  product!: Product | null;
}
