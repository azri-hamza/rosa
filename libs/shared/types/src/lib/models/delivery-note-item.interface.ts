import { Product } from './product.interface';
import { VatRateResponse } from '../types/vat';

export interface DeliveryNoteItem {
  id: number;
  productName: string;
  description?: string;
  quantity: number;
  deliveredQuantity: number;
  unitPrice: number;
  totalPrice: number;
  vatRate?: number;
  vatAmount: number;
  grossTotalPrice: number;
  productId?: string;
  product?: Product;
  appliedVatRate?: VatRateResponse;
  createdAt: Date;
  updatedAt: Date;
} 