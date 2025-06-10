import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { VatService } from '@rosa/sales/data-access';
import { VatRateResponse, VatRateFilter } from '@rosa/types';
import { VatFormComponent } from '../vat-form/vat-form.component';
import { VatFilterComponent } from '../vat-filter/vat-filter.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-vat-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzModalModule,
    NzSpinModule,
    NzToolTipModule,
    NzAlertModule,
    NzTagModule,
    NzSwitchModule,
    NzPopconfirmModule,
    VatFilterComponent,
  ],
  templateUrl: './vat-list.component.html',
  styleUrl: './vat-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VatListComponent implements OnInit {
  private vatService = inject(VatService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);

  // Signals for state management
  readonly vatRates = signal<VatRateResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  searchControl = new FormControl('');

  ngOnInit() {
    this.loadVatRates();

    // Set up search functionality
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchVatRates(searchTerm || '');
    });
  }

  private loadVatRates() {
    this.loading.set(true);
    this.error.set(null);

    this.vatService.getVatRates().subscribe({
      next: (vatRates) => {
        this.vatRates.set(vatRates);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading VAT rates:', error);
        this.error.set('Failed to load VAT rates');
        this.loading.set(false);
      }
    });
  }

  private searchVatRates(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.loadVatRates();
      return;
    }

    this.loading.set(true);
    const filters: VatRateFilter = { name: searchTerm };

    this.vatService.searchVatRates(filters).subscribe({
      next: (vatRates) => {
        this.vatRates.set(vatRates);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error searching VAT rates:', error);
        this.error.set('Failed to search VAT rates');
        this.loading.set(false);
      }
    });
  }

  onFiltersChange(filters: VatRateFilter) {
    this.loading.set(true);
    this.vatService.searchVatRates(filters).subscribe({
      next: (vatRates) => {
        this.vatRates.set(vatRates);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error filtering VAT rates:', error);
        this.error.set('Failed to filter VAT rates');
        this.loading.set(false);
      }
    });
  }

  openVatForm(vatRate?: VatRateResponse) {
    const modalRef = this.modal.create({
      nzTitle: vatRate ? 'Edit VAT Rate' : 'Create VAT Rate',
      nzContent: VatFormComponent,
      nzWidth: '600px',
      nzFooter: null,
      nzData: { vatRate }
    });

    modalRef.afterClose.subscribe((result) => {
      if (result) {
        this.loadVatRates();
      }
    });
  }

  setAsDefault(vatRate: VatRateResponse) {
    this.vatService.setDefaultVatRate(vatRate.id).subscribe({
      next: () => {
        this.message.success('VAT rate set as default successfully');
        this.loadVatRates();
      },
      error: (error) => {
        console.error('Error setting default VAT rate:', error);
        this.message.error('Failed to set VAT rate as default');
      }
    });
  }

  deleteVatRate(id: number) {
    this.vatService.deleteVatRate(id).subscribe({
      next: () => {
        this.message.success('VAT rate deleted successfully');
        this.loadVatRates();
      },
      error: (error) => {
        console.error('Error deleting VAT rate:', error);
        this.message.error('Failed to delete VAT rate');
      }
    });
  }

  formatPercentage(rate: number): string {
    return `${(rate * 100).toFixed(2)}%`;
  }
} 