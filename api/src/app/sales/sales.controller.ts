import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { SalesService } from './sales.service';
import { Quote } from '@rosa/api-core';

@Controller('sales')
export class SalesController {
  constructor(
    @Inject(SalesService) private readonly salesService: SalesService
  ) {
    console.log('SalesService injected:', !!this.salesService);
  }

  @Get('quotes')
  async quotes() {
    try {
      const quotes = await this.salesService.getAllQuotes();
      return quotes.map((quote) => ({
        ...quote,
        totalAmount:
          quote.items?.reduce(
            (sum, item) => sum + Number(item.totalPrice),
            0
          ) || 0,
        itemCount: quote.items?.length || 0,
      }));
    } catch (error) {
      console.error('Error in quotes endpoint:', error);
      throw error;
    }
  }

  @Post('quotes')
  async createQuote(@Body() createQuoteDto: Partial<Quote>) {
    try {
      const newQuote = await this.salesService.createQuote(createQuoteDto);
      return {
        ...newQuote,
        totalAmount:
          newQuote.items?.reduce(
            (sum, item) => sum + Number(item.totalPrice),
            0
          ) || 0,
        itemCount: newQuote.items?.length || 0,
      };
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }
}
