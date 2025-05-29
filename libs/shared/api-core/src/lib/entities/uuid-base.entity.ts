import { PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from './auditable.entity';

export abstract class UuidBaseEntity extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
} 