import { Controller, Get, Post, Body, Inject, Param, UseGuards, Query, Request, Res, Delete, ParseUUIDPipe, Put } from '@nestjs/common';
import { Response } from 'express';
import { SalesService } from '../../sales/sales.service';
import { Quote, QuoteFilterDto, DeliveryNote, DeliveryNoteFilterDto } from '@rosa/api-core';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CreateDeliveryNoteDto } from '../../sales/dto/create-delivery-note.dto';
import { UpdateDeliveryNoteDto } from '../../sales/dto/update-delivery-note.dto';
import { PdfService } from '../../sales/pdf.service';

@Controller({ path: 'sales', version: '1' })
@UseGuards(JwtAuthGuard)
export class SalesV1Controller {
  constructor(
    @Inject(SalesService) private readonly salesService: SalesService,
    @Inject(PdfService) private readonly pdfService: PdfService
  ) {}

  @Get('quotes')
  async quotes(@Query() filterDto: QuoteFilterDto) {
    try {
      const quotes = await this.salesService.getAllQuotes(filterDto);
      return {
        data: quotes.map((quote) => this.formatQuoteResponse(quote)),
        meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('Error in quotes endpoint:', error);
      throw error;
    }
  }

  @Get('delivery-notes')
  async deliveryNotes(@Query() filterDto: DeliveryNoteFilterDto, @Request() req: any) {
    try {
      const deliveryNotes = await this.salesService.getAllDeliveryNotes(filterDto, req.user.userId);
      return {
        data: deliveryNotes.map((deliveryNote) => this.formatDeliveryNoteResponse(deliveryNote)),
        meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('Error in delivery notes endpoint:', error);
      throw error;
    }
  }

  @Post('delivery-notes')
  async createDeliveryNote(@Body() createDeliveryNoteDto: CreateDeliveryNoteDto, @Request() req: Request & { user: { userId: string } }) {
    try {
      const deliveryNote = await this.salesService.createDeliveryNote(createDeliveryNoteDto, req.user.userId);
      return {
        data: this.formatDeliveryNoteResponse(deliveryNote),
        meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('Error creating delivery note:', error);
      throw error;
    }
  }

  @Get('delivery-notes/:id')
  async getDeliveryNoteById(@Param('id') id: string, @Request() req: Request & { user: { userId: string } }) {
    try {
      const deliveryNote = await this.salesService.getDeliveryNoteById(id, req.user.userId);
      return {
        data: this.formatDeliveryNoteResponse(deliveryNote),
        meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('Error fetching delivery note by id:', error);
      throw error;
    }
  }

  @Put('delivery-notes/:referenceId')
  async updateDeliveryNote(
    @Param('referenceId', ParseUUIDPipe) referenceId: string,
    @Body() updateDeliveryNoteDto: UpdateDeliveryNoteDto,
  ) { 
    try {
      const updatedDeliveryNote = await this.salesService.updateDeliveryNote(referenceId, updateDeliveryNoteDto);
      return {
        data: this.formatDeliveryNoteResponse(updatedDeliveryNote),
        meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('Error updating delivery note:', error);
      throw error;
    }
  }

  @Delete('delivery-notes/:referenceId')
  async deleteDeliveryNote(@Param('referenceId', ParseUUIDPipe) referenceId: string, @Request() req: Request & { user: { userId: string } }) {
    try {
      await this.salesService.deleteDeliveryNote(referenceId, req.user.userId);
      return { message: 'Delivery note deleted successfully' };
    } catch (error) {
      console.error('Error in deleteDeliveryNote endpoint:', error);
      throw error;
    }
  }

  @Get('delivery-notes/:id/pdf')
  async downloadDeliveryNotePdf(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const deliveryNote = await this.salesService.getDeliveryNoteById(id, req.user.userId);
    const pdfBuffer = await this.pdfService.generateDeliveryNotePDF(deliveryNote);
    
    const deliveryNoteNumber = `${deliveryNote.year}-${deliveryNote.sequenceNumber.toString().padStart(4, '0')}`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="delivery-note-${deliveryNoteNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
      'X-API-Version': '1.0',
    });
    
    res.send(pdfBuffer);
  }

  private formatQuoteResponse(quote: Quote) {
    const quoteNumber = `${quote.year}-${quote.sequenceNumber.toString().padStart(4, '0')}`;
    return {
      id: quote.id,
      quoteNumber: quoteNumber,
      referenceId: quote.referenceId,
      year: quote.year,
      sequenceNumber: quote.sequenceNumber,
      userDate: quote.userDate,
      client: quote.client ? {
        id: quote.client.id,
        name: quote.client.name,
        referenceId: quote.client.referenceId,
      } : null,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      items: quote.items?.map(item => ({
        id: item.id,
        productName: item.productName,
        description: item.description,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          productCode: item.product.productCode,
        } : null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })) || [],
    };
  }

  private formatDeliveryNoteResponse(deliveryNote: DeliveryNote) {
    const deliveryNoteNumber = `${deliveryNote.year}-${deliveryNote.sequenceNumber.toString().padStart(4, '0')}`;
    const totalAmount = deliveryNote.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
    const itemCount = deliveryNote.items?.length || 0;
    
    const response = {
      id: deliveryNote.id,
      deliveryNoteNumber: deliveryNoteNumber,
      referenceId: deliveryNote.referenceId,
      year: deliveryNote.year,
      sequenceNumber: deliveryNote.sequenceNumber,
      client: deliveryNote.client ? {
        id: deliveryNote.client.id,
        name: deliveryNote.client.name,
        referenceId: deliveryNote.client.referenceId,
        taxIdentificationNumber: deliveryNote.client.taxIdentificationNumber,
      } : null,
      totalAmount: totalAmount,
      itemCount: itemCount,
      status: deliveryNote.status,
      deliveryDate: deliveryNote.deliveryDate,
      deliveryAddress: deliveryNote.deliveryAddress,
      notes: deliveryNote.notes,
      globalDiscountPercentage: deliveryNote.globalDiscountPercentage,
      globalDiscountAmount: deliveryNote.globalDiscountAmount,
      netTotalBeforeGlobalDiscount: deliveryNote.netTotalBeforeGlobalDiscount,
      netTotalAfterGlobalDiscount: deliveryNote.netTotalAfterGlobalDiscount,
      createdAt: deliveryNote.createdAt,
      updatedAt: deliveryNote.updatedAt,
      items: deliveryNote.items?.map(item => ({
        id: item.id,
        productName: item.productName,
        description: item.description,
        product: item.product ? {
          id: item.product.id,
          name: item.product.name,
          productCode: item.product.productCode,
          productId: item.product.productId,
        } : null,
        productId: item.product?.productId || null,
        quantity: item.quantity,
        deliveredQuantity: item.deliveredQuantity,
        unitPrice: item.unitPrice,
        discountPercentage: item.discountPercentage,
        discountAmount: item.discountAmount,
        netUnitPrice: item.netUnitPrice,
        grossUnitPrice: item.grossUnitPrice,
        totalPrice: item.totalPrice,
        vatRate: item.vatRate,
        vatAmount: item.vatAmount,
        grossTotalPrice: item.grossTotalPrice,
      })) || [],
    };
    
    return response;
  }
} 