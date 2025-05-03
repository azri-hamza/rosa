import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Quote } from '@rosa/types';
import { QuoteService } from '../services/quote.service';
import { inject } from '@angular/core';

interface QuotesState {
  quotes: Quote[];
  loading: boolean;
}

const initialState: QuotesState = {
  loading: true,
  quotes: [],
};

export const QuotesStore = signalStore(
  withState(initialState),
  withMethods((store, quoteService = inject(QuoteService)) => ({
    async loadQuotes() {
      patchState(store, { loading: true });
      quoteService.getQuotes().subscribe({
        next: (quotes) => {
          patchState(store, { quotes, loading: false });
        },
        error: (error) => {
          console.error('Error loading quotes:', error);
          patchState(store, { loading: false });
        },
      });
    },

    createQuote(quote: Partial<Quote>) {
      patchState(store, { loading: true });
      quoteService.createQuote(quote).subscribe({
        next: (newQuote) => {
          patchState(store, (state) => ({
            quotes: [...state.quotes, newQuote],
            loading: false,
          }));
        },
        error: (error) => {
          console.error('Error creating quote:', error);
          patchState(store, { loading: false });
        },
      });
    },
  })),
  withHooks({
    // onInit: (store) => {},
  })
);
