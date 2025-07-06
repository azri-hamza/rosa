import { Controller, Get, Post, Body, Inject, Param, ParseUUIDPipe, Put, Delete, UseGuards, Query, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { SalesService } from './sales.service';
import { Quote, QuoteFilterDto, DeliveryNote, DeliveryNoteFilterDto } from '@rosa/api-core';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateDeliveryNoteDto } from './dto/create-delivery-note.dto';
import { PdfService } from './pdf.service';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(
    @Inject(SalesService) private readonly salesService: SalesService,
    @Inject(PdfService) private readonly pdfService: PdfService
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
  async deliveryNotes(@Query() filterDto: DeliveryNoteFilterDto, @Request() req: any) {
    try {
      const deliveryNotes = await this.salesService.getAllDeliveryNotes(filterDto, req.user.userId);
      return deliveryNotes.map((deliveryNote) => this.formatDeliveryNoteResponse(deliveryNote));
    } catch (error) {
      console.error('Error in delivery notes endpoint:', error);
      throw error;
    }
  }

  @Get('delivery-notes/:id')
  async getDeliveryNoteById(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    try {
      const deliveryNote = await this.salesService.getDeliveryNoteById(id, req.user.userId);
      return this.formatDeliveryNoteResponse(deliveryNote);
    } catch (error) {
      console.error('Error getting delivery note by ID:', error);
      throw error;
    }
  }

  @Post('delivery-notes')
  async createDeliveryNote(@Body() createDeliveryNoteDto: CreateDeliveryNoteDto, @Request() req: any) {
    try {
      const newDeliveryNote = await this.salesService.createDeliveryNote(createDeliveryNoteDto, req.user.userId);
      return this.formatDeliveryNoteResponse(newDeliveryNote);
    } catch (error) {
      console.error('Error creating delivery note:', error);
      throw error;
    }
  }

  @Put('delivery-notes/:id')
  async updateDeliveryNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeliveryNoteDto: any,
    @Request() req: any
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
  async deleteDeliveryNote(@Param('id') id: string, @Request() req: any) {
    try {
      await this.salesService.deleteDeliveryNote(id, req.user.userId);
      return { message: 'Delivery note deleted successfully' };
    } catch (error) {
      console.error('Error in deleteDeliveryNote endpoint:', error);
      throw error;
    }
  }

  @Get('delivery-notes/:id/pdf')
  async generateDeliveryNotePDF(
    @Param('id', ParseUUIDPipe) id: string, 
    @Request() req: any,
    @Res() res: Response
  ) {
    try {
      const deliveryNote = await this.salesService.getDeliveryNoteById(id, req.user.userId);
      const pdfBuffer = await this.pdfService.generateDeliveryNotePDF(deliveryNote);
      
      const deliveryNoteNumber = `${deliveryNote.year}-${deliveryNote.sequenceNumber.toString().padStart(4, '0')}`;
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=delivery-note-${deliveryNoteNumber}.pdf`,
        'Content-Length': pdfBuffer.length,
      });
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Helper function to safely convert numeric values from database
   * Handles PostgreSQL's tendency to return DECIMAL as strings and BIGINT as strings
   */
  private parseNumeric(value: any, type: 'int' | 'decimal' = 'decimal'): number {
    // If already a number, return as-is
    if (typeof value === 'number') return value;
    
    // If it's a string, parse appropriately
    if (typeof value === 'string') {
      const parsed = type === 'int' ? parseInt(value, 10) : parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    // For null, undefined, or other types, return 0
    return 0;
  }

  private formatQuoteResponse(quote: Quote) {
    // Create a clean response object without circular references
    const items = quote.items?.map(item => ({
      id: typeof item.id === 'string' ? parseInt(item.id, 10) : Number(item.id),
      productName: item.productName,
      description: item.description,
      quantity: this.parseNumeric(item.quantity, 'int'),
      unitPrice: this.parseNumeric(item.unitPrice, 'decimal'),
      totalPrice: this.parseNumeric(item.totalPrice, 'decimal'),
      productId: item.product?.productId || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })) || [];

    // Include client data if available
    const client = quote.client ? {
      id: typeof quote.client.id === 'string' ? parseInt(quote.client.id, 10) : Number(quote.client.id),
      referenceId: quote.client.referenceId,
      name: quote.client.name,
      taxIdentificationNumber: quote.client.taxIdentificationNumber,
      phoneNumber: quote.client.phoneNumber,
      address: quote.client.address
    } : null;

    return {
      id: typeof quote.id === 'string' ? parseInt(quote.id, 10) : Number(quote.id),
      referenceId: quote.referenceId,
      year: this.parseNumeric(quote.year, 'int') || new Date().getFullYear(),
      sequenceNumber: this.parseNumeric(quote.sequenceNumber, 'int') || 1,
      userDate: quote.userDate,
      client,
      clientId: quote.client?.id ? (typeof quote.client.id === 'string' ? parseInt(quote.client.id, 10) : Number(quote.client.id)) : null,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      items,
      totalAmount: items.reduce((sum, item) => sum + item.totalPrice, 0),
      itemCount: items.length
    };
  }

  private formatDeliveryNoteResponse(deliveryNote: DeliveryNote) {
    // Create a clean response object without circular references
    const items = deliveryNote.items?.map(item => ({
      id: typeof item.id === 'string' ? parseInt(item.id, 10) : Number(item.id),
      productName: item.productName,
      description: item.description,
      quantity: item.quantity,
      deliveredQuantity: item.deliveredQuantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      discountPercentage: item.discountPercentage,
      netUnitPrice: item.netUnitPrice,
      vatRate: item.vatRate ? Number(item.vatRate) * 100 : undefined,
      grossUnitPrice: item.grossUnitPrice,
      totalPrice:item.totalPrice,
      grossTotalPrice: item.grossTotalPrice,
      vatAmount: item.vatAmount,
      productId: item.product?.productId || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })) || [];

    // Include client data if available
    const client = deliveryNote.client ? {
      id: typeof deliveryNote.client.id === 'string' ? parseInt(deliveryNote.client.id, 10) : Number(deliveryNote.client.id),
      referenceId: deliveryNote.client.referenceId,
      name: deliveryNote.client.name,
      taxIdentificationNumber: deliveryNote.client.taxIdentificationNumber,
      phoneNumber: deliveryNote.client.phoneNumber,
      address: deliveryNote.client.address
    } : null;

    return {
      id: typeof deliveryNote.id === 'string' ? parseInt(deliveryNote.id, 10) : Number(deliveryNote.id),
      referenceId: deliveryNote.referenceId,
      year: this.parseNumeric(deliveryNote.year, 'int') || new Date().getFullYear(),
      sequenceNumber: this.parseNumeric(deliveryNote.sequenceNumber, 'int') || 1,
      deliveryDate: deliveryNote.deliveryDate,
      deliveryAddress: deliveryNote.deliveryAddress,
      notes: deliveryNote.notes,
      status: deliveryNote.status,
      client,
      clientId: deliveryNote.client?.id ? (typeof deliveryNote.client.id === 'string' ? parseInt(deliveryNote.client.id, 10) : Number(deliveryNote.client.id)) : null,
      createdAt: deliveryNote.createdAt,
      updatedAt: deliveryNote.updatedAt,
      items,
      totalAmount: items.reduce((sum, item) => sum + item.totalPrice, 0),
      itemCount: items.length
    };
  }
}
