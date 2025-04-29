import { DataSource, Repository } from 'typeorm';
import { Quote } from '../entities/quote.entity';

export class QuoteRepository extends Repository<Quote> {
  constructor(private dataSource: DataSource) {
    super(Quote, dataSource.createEntityManager());
  }

  async findById(id: string): Promise<Quote> {
    const quote = await this.findOne({ where: { id } });
    if (!quote) {
      throw new Error(`Quote with ID ${id} not found`);
    }
    return quote;
  }

  async findAll(): Promise<Quote[]> {
    const quotes = await this.findAll();
    return quotes;
  }
  // async create(data: Partial<Quote>): Promise<Quote> {
  //     // return [{}]
  // }

  async findInactiveQuotes(): Promise<Quote[]> {
    return this.dataSource.query(`
      SELECT * FROM quotes 
      WHERE dateQuote < NOW() - INTERVAL '30 days'
    `);
  }
}

// Factory function for dependency injection
export const createQuoteRepository = (dataSource: DataSource) => {
  return new QuoteRepository(dataSource);
};
