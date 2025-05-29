import { Product } from './product.interface';

export interface DeliveryNoteItem {
  id: number;
  productName: string;
  description?: string;
  quantity: number;
  deliveredQuantity: number;
  unitPrice: number;
  totalPrice: number;
  productId?: string;
  product?: Product;
  createdAt: Date;
  updatedAt: Date;
} 