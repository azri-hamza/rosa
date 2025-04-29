import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  dateQuote: Date;
}
