import { DataSource, Repository } from 'typeorm';
import { Quote } from '../entities/quote.entity';

export class QuoteRepository extends Repository<Quote> {
  constructor(dataSource: DataSource) {
    super(Quote, dataSource.createEntityManager());
  }

  async findById(id: number): Promise<Quote> {
    const quote = await this.findOne({
      where: { id },
      relations: ['items', 'client'],
    });
    if (!quote) {
      throw new Error(`Quote with ID ${id} not found`);
    }
    return quote;
  }

  

  async findByReferenceId(referenceId: string): Promise<Quote> {
    const quote = await this.findOne({
      where: { referenceId },
      relations: ['items', 'client'],
    });
    if (!quote) {
      throw new Error(`Quote with reference ID ${referenceId} not found`);
    }
    return quote;
  }

  async findAll(): Promise<Quote[]> {
    return this.find({
      relations: ['items', 'client'],
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
      relations: ['items', 'client'],
    });
  }
}

// Factory function for dependency injection
export const createQuoteRepository = (dataSource: DataSource) => {
  return new QuoteRepository(dataSource);
};
