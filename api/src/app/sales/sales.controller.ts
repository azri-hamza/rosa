import { Controller, Get, Post, Body, Inject, Param, ParseUUIDPipe, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { Quote, QuoteFilterDto, DeliveryNote, DeliveryNoteFilterDto } from '@rosa/api-core';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(
    @Inject(SalesService) private readonly salesService: SalesService
  ) {
    console.log('SalesService injected:', !!this.salesService);
  }

  @Get('quotes')
  async quotes(@Query() filterDto: QuoteFilterDto) {
    try {
      const quotes = await this.salesService.getAllQuotes(filterDto);
      return quotes.map((quote) => this.formatQuoteResponse(quote));
    } catch (error) {
      console.error('Error in quotes endpoint:', error);
      throw error;
    }
  }

  @Get('quotes/:id')
  async getQuoteById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const quote = await this.salesService.getQuoteById(id);
      return this.formatQuoteResponse(quote);
    } catch (error) {
      console.error('Error getting quote by ID:', error);
      throw error;
    }
  }

  @Post('quotes')
  async createQuote(@Body() createQuoteDto: Partial<Quote>) {
    try {
      const newQuote = await this.salesService.createQuote(createQuoteDto);
      return this.formatQuoteResponse(newQuote);
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  @Put('quotes/:id')
  async updateQuote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuoteDto: Partial<Quote>
  ) {
    try {
      const updatedQuote = await this.salesService.updateQuote(id, updateQuoteDto);
      return this.formatQuoteResponse(updatedQuote);
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  }

  @Delete('quotes/:id')
  async deleteQuote(@Param('id') id: string) {
    try {
      await this.salesService.deleteQuote(id);
      return { message: 'Quote deleted successfully' };
    } catch (error) {
      console.error('Error in deleteQuote endpoint:', error);
      throw error;
    }
  }

  // ===== DELIVERY NOTE ENDPOINTS =====

  @Get('delivery-notes')
  async deliveryNotes(@Query() filterDto: DeliveryNoteFilterDto) {
    try {
      const deliveryNotes = await this.salesService.getAllDeliveryNotes(filterDto);
      return deliveryNotes.map((deliveryNote) => this.formatDeliveryNoteResponse(deliveryNote));
    } catch (error) {
      console.error('Error in delivery notes endpoint:', error);
      throw error;
    }
  }

  @Get('delivery-notes/:id')
  async getDeliveryNoteById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const deliveryNote = await this.salesService.getDeliveryNoteById(id);
      return this.formatDeliveryNoteResponse(deliveryNote);
    } catch (error) {
      console.error('Error getting delivery note by ID:', error);
      throw error;
    }
  }

  @Post('delivery-notes')
  async createDeliveryNote(@Body() createDeliveryNoteDto: any) {
    try {
      const newDeliveryNote = await this.salesService.createDeliveryNote(createDeliveryNoteDto);
      return this.formatDeliveryNoteResponse(newDeliveryNote);
    } catch (error) {
      console.error('Error creating delivery note:', error);
      throw error;
    }
  }

  @Put('delivery-notes/:id')
  async updateDeliveryNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeliveryNoteDto: any
  ) {
    try {
      const updatedDeliveryNote = await this.salesService.updateDeliveryNote(id, updateDeliveryNoteDto);
      return this.formatDeliveryNoteResponse(updatedDeliveryNote);
    } catch (error) {
      console.error('Error updating delivery note:', error);
      throw error;
    }
  }

  @Delete('delivery-notes/:id')
  async deleteDeliveryNote(@Param('id') id: string) {
    try {
      await this.salesService.deleteDeliveryNote(id);
      return { message: 'Delivery note deleted successfully' };
    } catch (error) {
      console.error('Error in deleteDeliveryNote endpoint:', error);
      throw error;
    }
  }

  private formatQuoteResponse(quote: Quote) {
    // Create a clean response object without circular references
    const items = quote.items?.map(item => ({
      id: item.id,
      productName: item.productName,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      productId: item.product?.productId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })) || [];

    // Include client data if available
    const client = quote.client ? {
      id: quote.client.id,
      referenceId: quote.client.referenceId,
      name: quote.client.name,
      taxIdentificationNumber: quote.client.taxIdentificationNumber,
      phoneNumber: quote.client.phoneNumber,
      address: quote.client.address
    } : null;

    return {
      id: quote.id,
      referenceId: quote.referenceId,
      year: quote.year,
      sequenceNumber: quote.sequenceNumber,
      userDate: quote.userDate,
      client,
      clientId: quote.client?.id || null,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      items,
      totalAmount: items.reduce((sum, item) => sum + Number(item.totalPrice), 0),
      itemCount: items.length
    };
  }

  private formatDeliveryNoteResponse(deliveryNote: DeliveryNote) {
    // Create a clean response object without circular references
    const items = deliveryNote.items?.map(item => ({
      id: item.id,
      productName: item.productName,
      description: item.description,
      quantity: item.quantity,
      deliveredQuantity: item.deliveredQuantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      productId: item.product?.productId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })) || [];

    // Include client data if available
    const client = deliveryNote.client ? {
      id: deliveryNote.client.id,
      referenceId: deliveryNote.client.referenceId,
      name: deliveryNote.client.name,
      taxIdentificationNumber: deliveryNote.client.taxIdentificationNumber,
      phoneNumber: deliveryNote.client.phoneNumber,
      address: deliveryNote.client.address
    } : null;

    return {
      id: deliveryNote.id,
      referenceId: deliveryNote.referenceId,
      year: deliveryNote.year,
      sequenceNumber: deliveryNote.sequenceNumber,
      deliveryDate: deliveryNote.deliveryDate,
      deliveryAddress: deliveryNote.deliveryAddress,
      notes: deliveryNote.notes,
      status: deliveryNote.status,
      client,
      clientId: deliveryNote.client?.id || null,
      createdAt: deliveryNote.createdAt,
      updatedAt: deliveryNote.updatedAt,
      items,
      totalAmount: items.reduce((sum, item) => sum + Number(item.totalPrice), 0),
      itemCount: items.length
    };
  }
}
