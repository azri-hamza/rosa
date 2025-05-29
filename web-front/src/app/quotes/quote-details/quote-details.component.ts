import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { QuotesStore } from '@rosa/sales/data-access';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule, NZ_ICONS } from 'ng-zorro-antd/icon';
import { LeftOutline } from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-quote-details',
  standalone: true,
  imports: [
    CommonModule,
    NzDescriptionsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    RouterLink,
  ],
  providers: [QuotesStore, { provide: NZ_ICONS, useValue: [LeftOutline] }],
  template: `
    <div class="quote-details-container" *ngIf="quote() as quote">
      <div class="header-actions">
        <a routerLink="/quotes" nz-button>
          <span nz-icon nzType="left"></span>
          Back to Quotes
        </a>
      </div>

      <nz-descriptions nzTitle="Quote Details" nzBordered>
        <nz-descriptions-item nzTitle="ID">{{ quote.id }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Date">{{
          quote.createdAt | date
        }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Year">{{
          quote.year || 'N/A'
        }}</nz-descriptions-item>
        <nz-descriptions-item nzTitle="Sequence Number"
          >#{{ quote.sequenceNumber }}</nz-descriptions-item
        >
        <nz-descriptions-item nzTitle="Total Amount">{{
          quote.totalAmount | currency
        }}</nz-descriptions-item>
      </nz-descriptions>

      <h3>Items</h3>
      <nz-table [nzData]="quote.items">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total Price</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of quote.items">
            <td>{{ item.productName }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ item.unitPrice | currency }}</td>
            <td>{{ item.totalPrice | currency }}</td>
          </tr>
        </tbody>
      </nz-table>
    </div>
  `,
  styles: [
    `
      .quote-details-container {
        padding: 24px;

        .header-actions {
          margin-bottom: 16px;
        }

        h3 {
          margin: 24px 0 16px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(QuotesStore);

  quote = this.store.selectedQuote;

  ngOnInit() {
    const referenceId = this.route.snapshot.paramMap.get('id');
    if (referenceId) {
      this.store.loadQuoteByReferenceId(referenceId);
    }
  }
}
