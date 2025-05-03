import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { QuotesStore } from '@rosa/sales/data-access';
import { Quote } from '@rosa/types';
import { Signal } from '@angular/core';
import { QuoteFormComponent } from './quote-form/quote-form.component';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    RouterLink,
  ],
  providers: [QuotesStore],
  templateUrl: './quotes.component.html',
  styleUrl: './quotes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotesComponent {
  private store = inject(QuotesStore);
  private modal = inject(NzModalService);

  quotes = this.store.quotes as unknown as Signal<Quote[]>;
  loading = this.store.loading as unknown as Signal<boolean>;

  constructor() {
    effect(() => {
      this.store.loadQuotes();
    });
  }

  openQuoteForm() {
    this.modal
      .create({
        nzTitle: 'New Quote',
        nzContent: QuoteFormComponent,
        nzWidth: '80%',
        nzFooter: null,
      })
      .afterClose.subscribe((result) => {
        if (result) {
          this.store.createQuote(result);
        }
      });
  }
}
