import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('clients')
export class Client extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'reference_id', type: 'uuid', unique: true })
  referenceId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ name: 'tax_identification_number',type: 'varchar', length: 50, nullable: true })
  taxIdentificationNumber!: string;

  @Column({ name: 'phone_number',type: 'varchar', length: 20, nullable: true })
  phoneNumber!: string;

  @Column({ name: 'address',type: 'varchar', nullable: true })
  address!: string;
} 