import { VatRateResponse } from '../types/vat';

export interface Product {
  id: number;
  productId: string;
  productCode: string;
  name: string;
  description: string;
  netPrice?: number;
  vatRate?: VatRateResponse | null;
  grossPrice?: number;
}
