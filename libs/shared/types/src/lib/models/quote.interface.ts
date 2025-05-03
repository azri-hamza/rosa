import { QuoteItem } from './quote-item.interface';

export interface Quote {
  id: string;
  createdAt: Date;
  year: number | null;
  sequenceNumber: number;
  items: QuoteItem[];
  totalAmount: number;
  itemCount: number;
}
