import { Column, Entity, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { QuoteItem } from './quote-item.entity';
import { BaseEntity } from './base.entity';
import { Client } from './client.entity';

@Entity()
export class Quote extends BaseEntity {
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
    name: 'user_date',
    type: 'date',
    nullable: true,
  })
  userDate!: Date | null;

  @ManyToOne(() => Client, { nullable: true, eager: false })
  @JoinColumn({ 
    name: 'client_id',
    referencedColumnName: 'id'
  })
  client!: Client | null;

  @OneToMany(() => QuoteItem, (item) => item.quote, { 
    cascade: true,
    eager: false 
  })
  items!: QuoteItem[];
}
