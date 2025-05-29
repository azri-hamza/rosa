import { QuoteItem } from './quote-item.interface';
import { Client } from './client.interface';

export interface Quote {
  id: number;
  referenceId: string;
  createdAt: Date;
  userDate?: Date | null;
  year: number | null;
  sequenceNumber: number;
  client?: Client | null;
  clientId?: number | null;
  items: QuoteItem[];
  totalAmount: number;
  itemCount: number;
}
