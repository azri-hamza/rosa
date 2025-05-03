import { DataSource, Repository } from 'typeorm';
import { QuoteItem } from '../entities/quote-item.entity';

export class QuoteItemRepository extends Repository<QuoteItem> {
  constructor(dataSource: DataSource) {
    super(QuoteItem, dataSource.createEntityManager());
  }

  async findById(id: number): Promise<QuoteItem> {
    const item = await this.findOne({ where: { id } });
    if (!item) {
      throw new Error(`QuoteItem with ID ${id} not found`);
    }
    return item;
  }

  async findByQuoteId(quoteId: string): Promise<QuoteItem[]> {
    return this.find({
      where: { quoteId },
      order: { productName: 'ASC' },
    });
  }

  async createQuoteItem(data: Partial<QuoteItem>): Promise<QuoteItem> {
    const item = this.create(data);
    return this.save(item);
  }

  async updateQuoteItem(
    id: number,
    data: Partial<QuoteItem>
  ): Promise<QuoteItem> {
    await this.update(id, data);
    return this.findById(id);
  }

  async deleteQuoteItem(id: number): Promise<void> {
    await this.delete(id);
  }
}

// Factory function for dependency injection
export const createQuoteItemRepository = (dataSource: DataSource) => {
  return new QuoteItemRepository(dataSource);
};
