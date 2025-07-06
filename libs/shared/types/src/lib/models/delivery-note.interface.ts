import { DeliveryNoteItem } from './delivery-note-item.interface';
import { Client } from './client.interface';

export interface DeliveryNote {
  id: number;
  referenceId: string;
  createdAt: Date;
  deliveryDate: Date;
  deliveryAddress?: string | null;
  notes?: string | null;
  status: 'pending' | 'delivered' | 'cancelled';
  year: number | null;
  sequenceNumber: number;
  client?: Client | null;
  clientId?: number | null;
  items: DeliveryNoteItem[];
  totalAmount: number;
  itemCount: number;
  globalDiscountPercentage?: number;
  globalDiscountAmount?: number;
  netTotalBeforeGlobalDiscount?: number;
  netTotalAfterGlobalDiscount?: number;
} 