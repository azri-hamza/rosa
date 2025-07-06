import { Column, Entity, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { DeliveryNoteItem } from './delivery-note-item.entity';
import { BaseEntity } from './base.entity';
import { Client } from './client.entity';
import { User } from './user.entity';

@Entity()
export class DeliveryNote extends BaseEntity {
  @Column({
    name: 'reference_id',
    type: 'uuid',
    unique: true,
    nullable: false,
    default: () => 'uuid_generate_v4()'
  })
  referenceId!: string;

  @Column({ 
    type: 'int', 
    default: () => 'EXTRACT(year FROM CURRENT_DATE)' 
  })
  year!: number;

  @Column({ 
    type: 'int', 
    default: 1, 
    name: 'sequence_number'
  })
  sequenceNumber!: number;

  @Column({
    name: 'delivery_date',
    type: 'date',
    nullable: false,
    default: () => 'CURRENT_DATE'
  })
  deliveryDate!: Date;

  @Column({
    name: 'delivery_address',
    type: 'text',
    nullable: true
  })
  deliveryAddress!: string | null;

  @Column({
    name: 'notes',
    type: 'text',
    nullable: true
  })
  notes!: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'pending'
  })
  status!: 'pending' | 'delivered' | 'cancelled';

  @Column({
    name: 'global_discount_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 0,
    comment: 'Global discount percentage applied to net total',
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => value ? parseFloat(value) : null,
    }
  })
  globalDiscountPercentage?: number;

  @Column({
    name: 'global_discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    default: 0,
    comment: 'Global discount amount',
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => value ? parseFloat(value) : null,
    }
  })
  globalDiscountAmount?: number;

  @Column({
    name: 'net_total_before_global_discount',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    default: 0,
    comment: 'Net total before global discount',
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => value ? parseFloat(value) : null,
    }
  })
  netTotalBeforeGlobalDiscount?: number;

  @Column({
    name: 'net_total_after_global_discount',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    default: 0,
    comment: 'Net total after global discount',
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => value ? parseFloat(value) : null,
    }
  })
  netTotalAfterGlobalDiscount?: number;

  @ManyToOne(() => Client, { nullable: true, eager: false })
  @JoinColumn({ 
    name: 'client_id',
    referencedColumnName: 'id'
  })
  client!: Client | null;

  @ManyToOne(() => User, { nullable: false, eager: false })
  @JoinColumn({ 
    name: 'created_by_user_id',
    referencedColumnName: 'id'
  })
  createdByUser!: User;

  @OneToMany(() => DeliveryNoteItem, (item) => item.deliveryNote, { 
    cascade: true,
    eager: false 
  })
  items!: DeliveryNoteItem[];
} 