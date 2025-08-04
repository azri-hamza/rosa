import { inject, Injectable } from '@angular/core';
import { ApiClient } from '@rosa/api-client';
import { CreateVatRateRequest, UpdateVatRateRequest, VatRateResponse, VatRateFilter, ApiResponse } from '@rosa/types';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class VatService {
  private readonly apiClient = inject(ApiClient);

  getVatRates() {
    return this.apiClient.get<ApiResponse<VatRateResponse[]>>('vat-rates').pipe(
      map(response => response.data)
    );
  }

  getActiveVatRates() {
    return this.apiClient.get<ApiResponse<VatRateResponse[]>>('vat-rates/active').pipe(
      map(response => response.data)
    );
  }

  getDefaultVatRate() {
    return this.apiClient.get<ApiResponse<VatRateResponse | null>>('vat-rates/default').pipe(
      map(response => response.data)
    );
  }

  getVatRate(id: number) {
    return this.apiClient.get<ApiResponse<VatRateResponse>>(`vat-rates/${id}`).pipe(
      map(response => response.data)
    );
  }

  getVatRatesByCountry(countryCode: string) {
    return this.apiClient.get<ApiResponse<VatRateResponse[]>>(`vat-rates/country/${countryCode}`).pipe(
      map(response => response.data)
    );
  }

  getEffectiveVatRate(countryCode?: string, date?: string) {
    const params: { [key: string]: string } = {};
    if (countryCode) params['countryCode'] = countryCode;
    if (date) params['date'] = date;
    
    return this.apiClient.get<ApiResponse<VatRateResponse>>('vat-rates/effective', { params }).pipe(
      map(response => response.data)
    );
  }

  searchVatRates(filters: VatRateFilter) {
    // Convert filter values to strings for HTTP params
    const params: Record<string, string> = {};
    if (filters.name !== undefined) params['name'] = filters.name;
    if (filters.isActive !== undefined) params['isActive'] = String(filters.isActive);
    if (filters.isDefault !== undefined) params['isDefault'] = String(filters.isDefault);
    if (filters.countryCode !== undefined) params['countryCode'] = filters.countryCode;
    if (filters.minRate !== undefined) params['minRate'] = String(filters.minRate);
    if (filters.maxRate !== undefined) params['maxRate'] = String(filters.maxRate);

    return this.apiClient.get<ApiResponse<VatRateResponse[]>>('vat-rates/search', { params }).pipe(
      map(response => response.data)
    );
  }

  createVatRate(vatRate: CreateVatRateRequest) {
    return this.apiClient.post<ApiResponse<VatRateResponse>>('vat-rates', vatRate).pipe(
      map(response => response.data)
    );
  }

  updateVatRate(id: number, vatRate: UpdateVatRateRequest) {
    return this.apiClient.patch<ApiResponse<VatRateResponse>>(`vat-rates/${id}`, vatRate).pipe(
      map(response => response.data)
    );
  }

  deleteVatRate(id: number) {
    return this.apiClient.delete<void>(`vat-rates/${id}`);
  }

  setDefaultVatRate(id: number) {
    return this.apiClient.patch<void>(`vat-rates/${id}/set-default`, {});
  }
} 