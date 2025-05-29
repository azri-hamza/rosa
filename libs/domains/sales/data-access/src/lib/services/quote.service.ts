import { inject, Injectable } from '@angular/core';
import { ApiClient } from '@rosa/api-client';
import { Quote } from '@rosa/types';

export interface QuoteFilters {
  clientId?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly apiClient = inject(ApiClient);

  getQuotes(filters?: QuoteFilters) {
    const params: Record<string, string> = {};
    
    if (filters?.clientId) {
      params['clientId'] = filters.clientId.toString();
    }
    if (filters?.startDate) {
      params['startDate'] = filters.startDate;
    }
    if (filters?.endDate) {
      params['endDate'] = filters.endDate;
    }

    return this.apiClient.get<Quote[]>('sales/quotes', { params });
  }

  getQuoteById(id: number) {
    return this.apiClient.get<Quote>(`sales/quotes/${id}`);
  }

  getQuoteByReferenceId(referenceId: string) {
    return this.apiClient.get<Quote>(`sales/quotes/${referenceId}`);
  }

  createQuote(quote: Partial<Quote>) {
    return this.apiClient.post<Quote>('sales/quotes', quote);
  }

  updateQuote(referenceId: string, quote: Partial<Quote>) {
    return this.apiClient.put<Quote>(`sales/quotes/${referenceId}`, quote);
  }

  deleteQuote(referenceId: string) {
    return this.apiClient.delete<void>(`sales/quotes/${referenceId}`);
  }
}
