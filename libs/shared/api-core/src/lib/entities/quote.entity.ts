import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { QuoteItem } from './quote-item.entity';

@Entity()
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  createdAt: Date;

  @Column({ type: 'int', default: () => 'EXTRACT(YEAR FROM CURRENT_DATE)' })
  year: number;

  @Column({ type: 'int', default: 1 })
  sequenceNumber: number;

  @OneToMany(() => QuoteItem, (item) => item.quote, { cascade: true })
  items: QuoteItem[];
}
