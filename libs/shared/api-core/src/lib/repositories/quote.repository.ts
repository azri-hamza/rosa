import { DataSource, Repository } from 'typeorm';
import { Quote } from '../entities/quote.entity';

export class QuoteRepository extends Repository<Quote> {
  constructor(dataSource: DataSource) {
    super(Quote, dataSource.createEntityManager());
  }

  async findById(id: string): Promise<Quote> {
    const quote = await this.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!quote) {
      throw new Error(`Quote with ID ${id} not found`);
    }
    return quote;
  }

  async findAll(): Promise<Quote[]> {
    return this.find({
      relations: ['items'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByYear(year: number): Promise<Quote[]> {
    return this.find({
      where: { year },
      order: {
        sequenceNumber: 'DESC',
      },
      relations: ['items'],
    });
  }
}

// Factory function for dependency injection
export const createQuoteRepository = (dataSource: DataSource) => {
  return new QuoteRepository(dataSource);
};
