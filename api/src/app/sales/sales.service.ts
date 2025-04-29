import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Quote, QUOTE_REPOSITORY, QuoteRepository } from '@rosa/api-core';

@Injectable()
export class SalesService {
  constructor(
    @Inject(QUOTE_REPOSITORY) private quoteRepository: QuoteRepository // Use the custom QuoteRepository
  ) {}
  async getAllQuotes(): Promise<Quote[]> {
    const quotes = this.quoteRepository.findAll();
    if (!quotes) {
      throw new NotFoundException('No quotes found');
    }
    return quotes;
  }
}
