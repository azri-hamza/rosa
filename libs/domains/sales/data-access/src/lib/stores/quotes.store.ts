import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Quote } from '@rosa/types';
import { QuoteService, QuoteFilters } from '../services/quote.service';
import { inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';

interface QuotesState {
  quotes: Quote[];
  loading: boolean;
  selectedQuote: Quote | null;
  filters: QuoteFilters;
}

const initialState: QuotesState = {
  loading: true,
  quotes: [],
  selectedQuote: null,
  filters: {},
};

export const QuotesStore = signalStore(
  withState(initialState),
  withMethods((store, quoteService = inject(QuoteService)) => ({
    async loadQuotes(filters?: QuoteFilters) {
      patchState(store, { loading: true });
      
      // Update filters if provided
      if (filters !== undefined) {
        patchState(store, { filters });
      }
      
      // Use current filters from state
      const currentFilters = filters || store.filters();
      
      quoteService.getQuotes(currentFilters).subscribe({
        next: (quotes) => {
          patchState(store, { quotes, loading: false });
        },
        error: (error) => {
          console.error('Error loading quotes:', error);
          patchState(store, { loading: false });
        },
      });
    },

    setFilters(filters: QuoteFilters) {
      patchState(store, { filters });
      // Reload quotes with new filters
      this.loadQuotes(filters);
    },

    clearFilters() {
      const emptyFilters: QuoteFilters = {};
      patchState(store, { filters: emptyFilters });
      this.loadQuotes(emptyFilters);
    },

    loadQuoteById(id: number) {
      patchState(store, { loading: true });
      quoteService.getQuoteById(id).subscribe({
        next: (quote) => {
          patchState(store, { selectedQuote: quote, loading: false });
        },
        error: (error) => {
          console.error('Error loading quote:', error);
          patchState(store, { loading: false });
        },
      });
    },

    loadQuoteByReferenceId(referenceId: string) {
      patchState(store, { loading: true });
      quoteService.getQuoteByReferenceId(referenceId).subscribe({
        next: (quote) => {
          patchState(store, { selectedQuote: quote, loading: false });
        },
        error: (error) => {
          console.error('Error loading quote by reference ID:', error);
          patchState(store, { loading: false });
        },
      });
    },

    createQuote(quote: Partial<Quote>): Observable<Quote> {
      patchState(store, { loading: true });
      return quoteService.createQuote(quote).pipe(
        tap((newQuote) => {
          patchState(store, (state) => ({
            quotes: [...state.quotes, newQuote],
            loading: false,
          }));
        }),
        catchError((error) => {
          console.error('Error creating quote:', error);
          patchState(store, { loading: false });
          return throwError(() => error);
        })
      );
    },

    updateQuote(quote: { referenceId: string } & Partial<Quote>): Observable<Quote> {
      patchState(store, { loading: true });
      return quoteService.updateQuote(quote.referenceId, quote).pipe(
        tap((updatedQuote) => {
          patchState(store, (state) => ({
            quotes: state.quotes.map((q) =>
              q.referenceId === quote.referenceId ? updatedQuote : q
            ),
            loading: false,
          }));
        }),
        catchError((error) => {
          console.error('Error updating quote:', error);
          patchState(store, { loading: false });
          return throwError(() => error);
        })
      );
    },

    deleteQuote(referenceId: string): Observable<void> {
      patchState(store, { loading: true });
      return quoteService.deleteQuote(referenceId).pipe(
        tap(() => {
          patchState(store, (state) => ({
            quotes: state.quotes.filter((q) => q.referenceId !== referenceId),
            loading: false,
          }));
        }),
        catchError((error) => {
          console.error('Error deleting quote:', error);
          patchState(store, { loading: false });
          return throwError(() => error);
        })
      );
    }
  })),
  withHooks({
    // onInit: (store) => {},
  })
);
