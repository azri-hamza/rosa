import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { DeliveryNote } from './delivery-note.entity';
import { BaseEntity } from './base.entity';
import { Product } from './product.entity';
import { VatRate } from './vat.entity';

@Entity()
export class DeliveryNoteItem extends BaseEntity {
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
    name: 'delivered_quantity',
    type: 'int',
    default: 0
  })
  deliveredQuantity!: number;

  @Column({ 
    name: 'unit_price',
    type: 'decimal', 
    precision: 10, 
    scale: 3,
    default: 0,
    comment: 'Net unit price before VAT'
  })
  unitPrice!: number;

  @Column({ 
    name: 'total_price',
    type: 'decimal', 
    precision: 10, 
    scale: 3,
    default: 0,
    comment: 'Net total price before VAT'
  })
  totalPrice!: number;

  @Column({
    name: 'vat_rate',
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
    comment: 'VAT rate applied to this item (stored for historical purposes)'
  })
  vatRate?: number;

  @Column({
    name: 'vat_amount',
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
    comment: 'VAT amount calculated'
  })
  vatAmount!: number;

  @Column({
    name: 'gross_total_price',
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
    comment: 'Total price including VAT'
  })
  grossTotalPrice!: number;

  @ManyToOne(() => DeliveryNote, (deliveryNote) => deliveryNote.items, { 
    onDelete: 'CASCADE',
    nullable: false 
  })
  @JoinColumn({ 
    name: 'delivery_note_id',
    referencedColumnName: 'id'
  })
  deliveryNote!: DeliveryNote;

  @ManyToOne(() => Product, { nullable: true, eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ 
    name: 'product_id',
    referencedColumnName: 'id'
  })
  product!: Product | null;

  @ManyToOne(() => VatRate, { nullable: true, eager: false })
  @JoinColumn({ 
    name: 'vat_rate_id',
    referencedColumnName: 'id'
  })
  appliedVatRate?: VatRate | null;
} 