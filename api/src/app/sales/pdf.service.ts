import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { DeliveryNote } from '@rosa/api-core';

@Injectable()
export class PdfService {
  
  async generateDeliveryNotePDF(deliveryNote: DeliveryNote): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 50,
          info: {
            Title: `Delivery Note ${deliveryNote.year}-${deliveryNote.sequenceNumber.toString().padStart(4, '0')}`,
            Author: 'Rosa Company',
            Subject: 'Delivery Note',
            Keywords: 'delivery, note, document'
          }
        });
        
        const chunks: Buffer[] = [];
        
        // Collect PDF data
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // Generate PDF content
        this.buildPDF(doc, deliveryNote);
        
        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private buildPDF(doc: PDFKit.PDFDocument, deliveryNote: DeliveryNote): void {
    const deliveryNoteNumber = `${deliveryNote.year}-${deliveryNote.sequenceNumber.toString().padStart(4, '0')}`;
    
    // Header
    this.addHeader(doc, deliveryNoteNumber);
    
    // Company info
    this.addCompanyInfo(doc);
    
    // Delivery note info
    this.addDeliveryNoteInfo(doc, deliveryNote);
    
    // Client info
    if (deliveryNote.client) {
      this.addClientInfo(doc, deliveryNote.client);
    }
    
    // Delivery address
    if (deliveryNote.deliveryAddress) {
      this.addDeliveryAddress(doc, deliveryNote.deliveryAddress);
    }
    
    // Items table
    this.addItemsTable(doc, deliveryNote.items);
    
    // Totals
    this.addTotals(doc, deliveryNote);
    
    // Notes - skip if no space
    if (deliveryNote.notes && doc.y < doc.page.height - 150) {
      this.addNotes(doc, deliveryNote.notes);
    }
    
    // Footer - skip if no space
    if (doc.y < doc.page.height - 100) {
      this.addFooter(doc);
    }
  }
  
  private addHeader(doc: PDFKit.PDFDocument, deliveryNoteNumber: string): void {
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('DELIVERY NOTE', 50, 50, { align: 'center' })
      .fontSize(14)
      .font('Helvetica')
      .text(`Document #: ${deliveryNoteNumber}`, 50, 80, { align: 'center' })
      .moveDown(2);
  }
  
  private addCompanyInfo(doc: PDFKit.PDFDocument): void {
    const startY = doc.y;
    
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Rosa Company', 50, startY)
      .font('Helvetica')
      .fontSize(10)
      .text('Business Management Solutions', 50, startY + 15)
      .text('Email: info@rosa-company.com', 50, startY + 30)
      .text('Phone: +1 234 567 8900', 50, startY + 45)
      .moveDown(1.5);
  }
  
  private addDeliveryNoteInfo(doc: PDFKit.PDFDocument, deliveryNote: DeliveryNote): void {
    const startY = doc.y;
    
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Delivery Note Information', 50, startY)
      .fontSize(10)
      .font('Helvetica')
      .text(`Reference ID: ${deliveryNote.referenceId}`, 50, startY + 20)
      .text(`Date: ${new Date(deliveryNote.deliveryDate).toLocaleDateString('en-GB')}`, 50, startY + 35)
      .text(`Status: ${deliveryNote.status.toUpperCase()}`, 50, startY + 50)
      .text(`Created: ${new Date(deliveryNote.createdAt).toLocaleDateString('en-GB')}`, 50, startY + 65)
      .moveDown(1.5);
  }
  
  private addClientInfo(doc: PDFKit.PDFDocument, client: any): void {
    const startY = doc.y;
    
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Client Information', 50, startY)
      .fontSize(10)
      .font('Helvetica')
      .text(`Name: ${client.name}`, 50, startY + 20);
    
    let currentY = startY + 35;
    
    if (client.taxIdentificationNumber) {
      doc.text(`Tax ID: ${client.taxIdentificationNumber}`, 50, currentY);
      currentY += 15;
    }
    
    if (client.address) {
      doc.text(`Address: ${client.address}`, 50, currentY, { width: 400 });
      currentY += 20;
    }
    
    if (client.phoneNumber) {
      doc.text(`Phone: ${client.phoneNumber}`, 50, currentY);
      currentY += 15;
    }
    
    doc.y = currentY + 10;
  }
  
  private addDeliveryAddress(doc: PDFKit.PDFDocument, address: string): void {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Delivery Address', 50, doc.y)
      .fontSize(10)
      .font('Helvetica')
      .text(address, 50, doc.y + 5, { width: 400 })
      .moveDown(1.5);
  }
  
  private addItemsTable(doc: PDFKit.PDFDocument, items: any[]): void {
    const tableTop = doc.y + 20;
    const tableLeft = 50;
    const rowHeight = 25;
    
    // Table headers
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Items', tableLeft, doc.y)
      .moveDown(0.5);
    
    // Column headers and widths
    const headers = ['Product', 'Qty', 'Delivered', 'Unit Price', 'Discount', 'Net Total', 'VAT Rate', 'Gross Total'];
    const columnWidths = [100, 35, 45, 55, 45, 55, 45, 65];
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    
    let currentX = tableLeft;
    
    doc.fontSize(9).font('Helvetica-Bold');
    
    // Draw header row background
    doc
      .rect(tableLeft, tableTop, totalWidth, 20)
      .fillColor('#f0f0f0')
      .fill()
      .fillColor('#000000');
    
    // Draw header text
    headers.forEach((header, i) => {
      doc.text(header, currentX + 2, tableTop + 5, { 
        width: columnWidths[i] - 4, 
        align: 'center' 
      });
      currentX += columnWidths[i];
    });
    
    // Draw header border
    doc
      .rect(tableLeft, tableTop, totalWidth, 20)
      .stroke();
    
    // Draw items
    doc.font('Helvetica').fontSize(8);
    
    const currentTableY = tableTop + 20;
    
    items.forEach((item, index) => {
      const y = currentTableY + (index * rowHeight);
      currentX = tableLeft;
      
      // Check if we need a new page
      if (y + rowHeight > doc.page.height - 100) {
        // Don't add unnecessary pages
        return;
      }
      
      // Alternate row background
      if (index % 2 === 1) {
        doc
          .rect(tableLeft, y, totalWidth, rowHeight)
          .fillColor('#f9f9f9')
          .fill()
          .fillColor('#000000');
      }
      
      const values = [
        item.productName,
        item.quantity.toString(),
        item.deliveredQuantity.toString(),
        `€${item.netUnitPrice?.toFixed(2) || item.unitPrice?.toFixed(2) || '0.00'}`,
        `${item.discountPercentage || 0}%`,
        `€${item.totalPrice.toFixed(2)}`,
        `${item.vatRate ? (item.vatRate * 100).toFixed(1) : '0.0'}%`,
        `€${item.grossTotalPrice.toFixed(2)}`
      ];
      
      values.forEach((value, i) => {
        const textY = y + 8;
        doc.text(value, currentX + 2, textY, { 
          width: columnWidths[i] - 4, 
          align: i === 0 ? 'left' : 'center',
          ellipsis: true
        });
        currentX += columnWidths[i];
      });
      
      // Draw row border
      doc
        .rect(tableLeft, y, totalWidth, rowHeight)
        .stroke();
    });
    
    doc.y = currentTableY + (items.length * rowHeight) + 20;
  }
  
  private addTotals(doc: PDFKit.PDFDocument, deliveryNote: DeliveryNote): void {
    const netTotal = deliveryNote.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const globalDiscountAmount = deliveryNote.globalDiscountAmount || 0;
    const netTotalAfterDiscount = netTotal - globalDiscountAmount;
    const vatTotal = deliveryNote.items.reduce((sum, item) => sum + item.vatAmount, 0);
    const grossTotal = netTotalAfterDiscount + vatTotal;
    
    const startX = 350;
    const startY = doc.y;
    const lineHeight = 15;
    
    // Draw totals box
    const boxWidth = 200;
    const boxHeight = globalDiscountAmount > 0 ? 90 : 75;
    
    doc
      .rect(startX, startY, boxWidth, boxHeight)
      .fillColor('#f8f8f8')
      .fill()
      .fillColor('#000000')
      .stroke();
    
    let currentY = startY + 10;
    
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Net Total:`, startX + 10, currentY)
      .text(`€${netTotal.toFixed(3)}`, startX + 120, currentY, { align: 'right', width: 70 });
    
    currentY += lineHeight;
    
    if (globalDiscountAmount > 0) {
      doc
        .text(`Global Discount:`, startX + 10, currentY)
        .text(`-€${globalDiscountAmount.toFixed(3)}`, startX + 120, currentY, { align: 'right', width: 70 });
      currentY += lineHeight;
      
      doc
        .text(`Net Total (after discount):`, startX + 10, currentY)
        .text(`€${netTotalAfterDiscount.toFixed(3)}`, startX + 120, currentY, { align: 'right', width: 70 });
      currentY += lineHeight;
    }
    
    doc
      .text(`VAT Total:`, startX + 10, currentY)
      .text(`€${vatTotal.toFixed(3)}`, startX + 120, currentY, { align: 'right', width: 70 });
    
    currentY += lineHeight;
    
    // Draw separator line
    doc
      .moveTo(startX + 10, currentY)
      .lineTo(startX + boxWidth - 10, currentY)
      .stroke();
    
    currentY += 5;
    
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`GROSS TOTAL:`, startX + 10, currentY)
      .text(`€${grossTotal.toFixed(3)}`, startX + 120, currentY, { align: 'right', width: 70 });
    
    doc.y = startY + boxHeight + 20;
  }
  
  private addNotes(doc: PDFKit.PDFDocument, notes: string): void {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Notes', 50, doc.y)
      .fontSize(10)
      .font('Helvetica')
      .text(notes, 50, doc.y + 5, { width: 500 })
      .moveDown(2);
  }
  
  private addFooter(doc: PDFKit.PDFDocument): void {
    // Add footer at current position instead of absolute bottom
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Thank you for your business!', 50, doc.y + 20, { align: 'center' })
      .text(`Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, 50, doc.y + 5, { align: 'center' });
  }
} 