export interface QuoteItem {
  id: number;
  quoteId: number;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productId: string;
}
