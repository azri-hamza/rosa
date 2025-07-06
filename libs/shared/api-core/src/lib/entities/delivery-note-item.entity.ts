import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { DeliveryNote } from './delivery-note.entity';
import { BaseEntity } from './base.entity';
import { Product } from './product.entity';

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
    comment: 'Unit price before discount',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  unitPrice!: number;

  @Column({
    name: 'discount_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 0,
    comment: 'Line item discount percentage',
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => value ? parseFloat(value) : null,
    }
  })
  discountPercentage?: number;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    default: 0,
    comment: 'Line item discount amount',
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => value ? parseFloat(value) : null,
    }
  })
  discountAmount?: number;

  @Column({
    name: 'net_unit_price',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    default: 0,
    comment: 'Unit price after discount (net price)',
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => value ? parseFloat(value) : null,
    }
  })
  netUnitPrice?: number;

  @Column({ 
    name: 'gross_unit_price',
    type: 'decimal', 
    precision: 10, 
    scale: 3,
    default: 0,
    comment: 'Gross unit price including VAT (after discount)',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  grossUnitPrice!: number;

  @Column({ 
    name: 'total_price',
    type: 'decimal', 
    precision: 10, 
    scale: 3,
    default: 0,
    comment: 'Net total price before VAT (after discount)',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  totalPrice!: number;

  @Column({
    name: 'vat_rate',
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
    comment: 'VAT rate applied to this item',
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => value ? parseFloat(value) : null,
    }
  })
  vatRate?: number;

  @Column({
    name: 'vat_amount',
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
    comment: 'VAT amount calculated',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  vatAmount!: number;

  @Column({
    name: 'gross_total_price',
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
    comment: 'Total price including VAT',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
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


} 