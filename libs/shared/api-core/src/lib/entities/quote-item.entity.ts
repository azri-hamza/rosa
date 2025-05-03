import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Quote } from './quote.entity';

@Entity()
export class QuoteItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  productName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @ManyToOne(() => Quote, (quote) => quote.items, { onDelete: 'CASCADE' })
  quote: Quote;

  @Column({ type: 'uuid' })
  quoteId: string;
}
