import { DataSource, Repository } from 'typeorm';
import { DeliveryNoteItem } from '../entities/delivery-note-item.entity';

export class DeliveryNoteItemRepository extends Repository<DeliveryNoteItem> {
  constructor(dataSource: DataSource) {
    super(DeliveryNoteItem, dataSource.createEntityManager());
  }

  async findById(id: number): Promise<DeliveryNoteItem> {
    const item = await this.findOne({ where: { id } });
    if (!item) {
      throw new Error(`DeliveryNoteItem with ID ${id} not found`);
    }
    return item;
  }

  async findByDeliveryNoteId(deliveryNoteId: number): Promise<DeliveryNoteItem[]> {
    return this.createQueryBuilder('deliveryNoteItem')
      .where('deliveryNoteItem.delivery_note_id = :deliveryNoteId', { deliveryNoteId })
      .orderBy('deliveryNoteItem.productName', 'ASC')
      .getMany();
  }

  async createDeliveryNoteItem(data: Partial<DeliveryNoteItem>): Promise<DeliveryNoteItem> {
    const item = this.create(data);
    return this.save(item);
  }

  async updateDeliveryNoteItem(
    id: number,
    data: Partial<DeliveryNoteItem>
  ): Promise<DeliveryNoteItem> {
    await this.update(id, data);
    return this.findById(id);
  }

  async deleteDeliveryNoteItem(id: number): Promise<void> {
    await this.delete(id);
  }
}

// Factory function for dependency injection
export const createDeliveryNoteItemRepository = (dataSource: DataSource) => {
  return new DeliveryNoteItemRepository(dataSource);
}; 