import { DataSource, Repository } from 'typeorm';
import { DeliveryNote } from '../entities/delivery-note.entity';

export class DeliveryNoteRepository extends Repository<DeliveryNote> {
  constructor(dataSource: DataSource) {
    super(DeliveryNote, dataSource.createEntityManager());
  }

  async findById(id: number): Promise<DeliveryNote> {
    const deliveryNote = await this.findOne({
      where: { id },
      relations: ['items', 'client'],
    });
    if (!deliveryNote) {
      throw new Error(`Delivery note with ID ${id} not found`);
    }
    return deliveryNote;
  }

  async findByReferenceId(referenceId: string): Promise<DeliveryNote> {
    const deliveryNote = await this.findOne({
      where: { referenceId },
      relations: ['items', 'client'],
    });
    if (!deliveryNote) {
      throw new Error(`Delivery note with reference ID ${referenceId} not found`);
    }
    return deliveryNote;
  }

  async findAll(): Promise<DeliveryNote[]> {
    return this.find({
      relations: ['items', 'client'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByYear(year: number): Promise<DeliveryNote[]> {
    return this.find({
      where: { year },
      order: {
        sequenceNumber: 'DESC',
      },
      relations: ['items', 'client'],
    });
  }

  async findByStatus(status: 'pending' | 'delivered' | 'cancelled'): Promise<DeliveryNote[]> {
    return this.find({
      where: { status },
      relations: ['items', 'client'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<DeliveryNote[]> {
    return this.createQueryBuilder('deliveryNote')
      .leftJoinAndSelect('deliveryNote.items', 'items')
      .leftJoinAndSelect('deliveryNote.client', 'client')
      .where('deliveryNote.delivery_date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .orderBy('deliveryNote.createdAt', 'DESC')
      .getMany();
  }
}

// Factory function for dependency injection
export const createDeliveryNoteRepository = (dataSource: DataSource) => {
  return new DeliveryNoteRepository(dataSource);
}; 