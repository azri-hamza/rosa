import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: '' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;
}
