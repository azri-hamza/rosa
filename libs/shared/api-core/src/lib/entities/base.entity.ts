import { PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from './auditable.entity';

export abstract class BaseEntity extends AuditableEntity {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'id'
  })
  id!: number;

} 