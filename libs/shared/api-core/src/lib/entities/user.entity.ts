import { Entity, Column } from 'typeorm';
import { UuidBaseEntity } from './uuid-base.entity';

@Entity()
export class User extends UuidBaseEntity {
  @Column({ type: 'varchar', default: '' })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', select: false })
  password!: string;

  @Column({ type: 'varchar', array: true, default: [] })
  roles!: string[];
}
