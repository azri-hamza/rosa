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