export interface DeliveryNoteItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  deliveredQuantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  netUnitPrice?: number;
  grossUnitPrice: number;
  totalPrice: number;
  vatRate?: number;
  vatAmount: number;
  grossTotalPrice: number;
  productId?: string;
  deliveryNoteId: string;
  createdAt: Date;
  updatedAt: Date;
} 