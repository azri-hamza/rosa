import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Quote, QUOTE_REPOSITORY, QuoteRepository } from '@rosa/api-core';

@Injectable()
export class SalesService {
  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepository: QuoteRepository //@Inject(QUOTE_ITEM_REPOSITORY) private readonly quoteItemRepository: QuoteItemRepository
  ) {}

  private async getNextSequenceNumber(year: number | null): Promise<number> {
    if (!year) {
      return 1;
    }

    const quotes = await this.quoteRepository
      .createQueryBuilder('quote')
      .where('quote.year = :year', { year })
      .orderBy('quote.sequenceNumber', 'DESC')
      .getMany();

    return quotes.length > 0 ? quotes[0].sequenceNumber + 1 : 1;
  }

  async getAllQuotes(): Promise<Quote[]> {
    try {
      const quotes = await this.quoteRepository.findAll();
      return quotes || [];
    } catch (error) {
      console.error('Error in getAllQuotes:', error);
      throw error;
    }
  }

  async createQuote(createQuoteDto: Partial<Quote>): Promise<Quote> {
    try {
      // Validate quote items if they exist
      if (createQuoteDto.items?.length) {
        for (const item of createQuoteDto.items) {
          if (!item.productName) {
            throw new BadRequestException(
              'Product name is required for quote items'
            );
          }
        }
      }

      const year = createQuoteDto.year ?? new Date().getFullYear();
      const sequenceNumber = await this.getNextSequenceNumber(year);

      const quote = this.quoteRepository.create({
        ...createQuoteDto,
        year,
        sequenceNumber,
      });

      return await this.quoteRepository.save(quote);
    } catch (error) {
      console.error('Error in createQuote:', error);
      throw error;
    }
  }
}
