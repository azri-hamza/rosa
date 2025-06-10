import { inject, Injectable } from '@angular/core';
import { ApiClient } from '@rosa/api-client';
import { CreateVatRateRequest, UpdateVatRateRequest, VatRateResponse, VatRateFilter } from '@rosa/types';

@Injectable({ providedIn: 'root' })
export class VatService {
  private readonly apiClient = inject(ApiClient);

  getVatRates() {
    return this.apiClient.get<VatRateResponse[]>('vat-rates');
  }

  getActiveVatRates() {
    return this.apiClient.get<VatRateResponse[]>('vat-rates/active');
  }

  getDefaultVatRate() {
    return this.apiClient.get<VatRateResponse>('vat-rates/default');
  }

  getVatRate(id: number) {
    return this.apiClient.get<VatRateResponse>(`vat-rates/${id}`);
  }

  getVatRatesByCountry(countryCode: string) {
    return this.apiClient.get<VatRateResponse[]>(`vat-rates/country/${countryCode}`);
  }

  getEffectiveVatRate(countryCode?: string, date?: string) {
    const params: { [key: string]: string } = {};
    if (countryCode) params['countryCode'] = countryCode;
    if (date) params['date'] = date;
    
    return this.apiClient.get<VatRateResponse>('vat-rates/effective', { params });
  }

  searchVatRates(filters: VatRateFilter) {
    return this.apiClient.get<VatRateResponse[]>('vat-rates/search', { params: filters as any });
  }

  createVatRate(vatRate: CreateVatRateRequest) {
    return this.apiClient.post<VatRateResponse>('vat-rates', vatRate);
  }

  updateVatRate(id: number, vatRate: UpdateVatRateRequest) {
    return this.apiClient.patch<VatRateResponse>(`vat-rates/${id}`, vatRate);
  }

  deleteVatRate(id: number) {
    return this.apiClient.delete<void>(`vat-rates/${id}`);
  }

  setDefaultVatRate(id: number) {
    return this.apiClient.patch<void>(`vat-rates/${id}/set-default`, {});
  }
} 