import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Quote } from '@rosa/types';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);

  getQuotes() {
    return this.http.get<Quote[]>('/api/sales/quotes');
  }

  createQuote(quote: Partial<Quote>) {
    return this.http.post<Quote>('/api/sales/quotes', quote);
  }
}
