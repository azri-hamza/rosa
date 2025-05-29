import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { QuotesStore } from '@rosa/sales/data-access';
import { Product, Quote } from '@rosa/types';
import { Signal } from '@angular/core';
import { QuoteFormComponent } from './quote-form/quote-form.component';
import { QuotesFilterComponent } from './quotes-filter/quotes-filter.component';
import { ProductService } from '@rosa/sales/data-access';
import { QuoteFilters } from '@rosa/sales/data-access';
import { debounceTime, switchMap, startWith } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { startOfWeek, endOfWeek } from 'date-fns';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    RouterModule,
    NzAutocompleteModule,
    NzMessageModule,
    QuotesFilterComponent,
  ],
  providers: [QuotesStore],
  templateUrl: './quotes.component.html',
  styleUrl: './quotes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotesComponent {
  private store = inject(QuotesStore);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private productService = inject(ProductService);

  quotes = this.store.quotes as unknown as Signal<Quote[]>;
  loading = this.store.loading as unknown as Signal<boolean>;
  filters = this.store.filters as unknown as Signal<QuoteFilters>;

  productSearchControl = new FormControl('');
  productOptions: Product[] = [];
  isLoadingProducts = false;

  constructor() {
    // Initialize with default filters (this week) using date-fns
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const defaultFilters: QuoteFilters = {
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
    };

    // Load quotes with default filters initially
    this.store.loadQuotes(defaultFilters);

    // Listen to product search input
    this.productSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(term => {
        this.isLoadingProducts = true;
        return this.productService.searchProducts(term || '');
      })
    ).subscribe(products => {
      this.productOptions = products;
      this.isLoadingProducts = false;
    });
  }

  onFiltersChange(filters: QuoteFilters) {
    this.store.setFilters(filters);
  }

  openQuoteForm(quote?: Quote) {
    this.modal
      .create({
        nzTitle: quote ? 'Edit Quote' : 'New Quote',
        nzContent: QuoteFormComponent,
        nzWidth: '80%',
        nzFooter: null,
        nzData: {
          quote: quote // Pass the quote to edit
        }
      })
      .afterClose.subscribe((result) => {
        if (result) {
          if (quote) {
            this.store.updateQuote({ ...result, referenceId: quote.referenceId }).subscribe({
              next: () => {
                this.message.success('Quote updated successfully');
              },
              error: (error) => {
                console.error('Error updating quote:', error);
                const errorMessage = error?.error?.message || error?.message || 'Failed to update quote. Please try again.';
                this.message.error(errorMessage);
              }
            });
          } else {
            this.store.createQuote(result).subscribe({
              next: () => {
                this.message.success('Quote created successfully');
              },
              error: (error) => {
                console.error('Error creating quote:', error);
                const errorMessage = error?.error?.message || error?.message || 'Failed to create quote. Please try again.';
                this.message.error(errorMessage);
              }
            });
          }
        }
      });
  }

  editQuote(quote: Quote) {
    this.openQuoteForm(quote);
  }

  deleteQuote(quote: Quote) {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this quote?',
      nzContent: `This action cannot be undone. Quote #${quote.sequenceNumber} will be permanently deleted.`,
      nzOkText: 'Yes, delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.store.deleteQuote(quote.referenceId).subscribe({
          next: () => {
            this.message.success('Quote deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting quote:', error);
            const errorMessage = error?.error?.message || error?.message || 'Failed to delete quote. Please try again.';
            this.message.error(errorMessage);
          }
        });
      }
    });
  }
}
