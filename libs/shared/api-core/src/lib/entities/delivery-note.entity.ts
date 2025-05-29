import { Column, Entity, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { DeliveryNoteItem } from './delivery-note-item.entity';
import { BaseEntity } from './base.entity';
import { Client } from './client.entity';

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

  @ManyToOne(() => Client, { nullable: true, eager: false })
  @JoinColumn({ 
    name: 'client_id',
    referencedColumnName: 'id'
  })
  client!: Client | null;

  @OneToMany(() => DeliveryNoteItem, (item) => item.deliveryNote, { 
    cascade: true,
    eager: false 
  })
  items!: DeliveryNoteItem[];
} 