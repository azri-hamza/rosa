import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ClientService } from '@rosa/sales/data-access';
import { QuoteFilters } from '@rosa/sales/data-access';
import { Client } from '@rosa/types';
import { startOfWeek, endOfWeek } from 'date-fns';

@Component({
  selector: 'app-quotes-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
  ],
  template: `
    <div class="quotes-filter">
      <form nz-form [formGroup]="filterForm" layout="inline" class="filter-form">
        <nz-form-item>
          <nz-form-label>Client</nz-form-label>
          <nz-form-control>
            <nz-select
              formControlName="clientId"
              nzPlaceHolder="All clients"
              nzAllowClear
              nzShowSearch
              nzServerSearch
              [nzLoading]="clientsLoading"
              (nzOnSearch)="onClientSearch($event)"
              style="width: 200px;"
            >
              <nz-option
                *ngFor="let client of clients"
                [nzValue]="client.id"
                [nzLabel]="client.name"
              >
                {{ client.name }}
              </nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>Date Range</nz-form-label>
          <nz-form-control>
            <nz-range-picker
              formControlName="dateRange"
              [nzFormat]="'yyyy-MM-dd'"
              style="width: 250px;"
            ></nz-range-picker>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-control>
            <button
              nz-button
              nzType="primary"
              (click)="applyFilters()"
            >
              <nz-icon nzType="search"></nz-icon>
              Filter
            </button>
            <button
              nz-button
              style="margin-left: 8px;"
              (click)="clearFilters()"
            >
              <nz-icon nzType="clear"></nz-icon>
              Clear
            </button>
          </nz-form-control>
        </nz-form-item>
      </form>
    </div>
  `,
  styles: [`
    .quotes-filter {
      background: #fafafa;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .filter-form {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: end;
    }

    :host ::ng-deep {
      .ant-form-item {
        margin-bottom: 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotesFilterComponent implements OnInit {
  @Input() initialFilters: QuoteFilters = {};
  @Output() filtersChange = new EventEmitter<QuoteFilters>();

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);

  filterForm: FormGroup;
  clients: Client[] = [];
  clientsLoading = false;

  constructor() {
    this.filterForm = this.fb.group({
      clientId: [null],
      dateRange: [null],
    });
  }

  ngOnInit() {
    // Load initial clients
    this.loadClients('');
    
    // Set default date range to this week
    this.setDefaultDateRange();
    
    // Set initial filters if provided
    if (this.initialFilters.clientId) {
      this.filterForm.patchValue({ clientId: this.initialFilters.clientId });
    }
    
    if (this.initialFilters.startDate && this.initialFilters.endDate) {
      this.filterForm.patchValue({
        dateRange: [new Date(this.initialFilters.startDate), new Date(this.initialFilters.endDate)]
      });
    }
  }

  private setDefaultDateRange() {
    const today = new Date();
    // Set week to start on Monday (weekStartsOn: 1)
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    this.filterForm.patchValue({
      dateRange: [weekStart, weekEnd]
    });
  }

  onClientSearch(searchTerm: string) {
    this.loadClients(searchTerm);
  }

  private loadClients(searchTerm: string) {
    this.clientsLoading = true;
    this.clientService.searchClients(searchTerm).subscribe({
      next: (clients) => {
        this.clients = clients;
        this.clientsLoading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.clientsLoading = false;
      }
    });
  }

  applyFilters() {
    const formValue = this.filterForm.value;
    const filters: QuoteFilters = {};

    if (formValue.clientId) {
      filters.clientId = formValue.clientId;
    }

    if (formValue.dateRange && formValue.dateRange.length === 2) {
      filters.startDate = formValue.dateRange[0].toISOString();
      filters.endDate = formValue.dateRange[1].toISOString();
    }

    this.filtersChange.emit(filters);
  }

  clearFilters() {
    this.filterForm.reset();
    this.setDefaultDateRange();
    this.filtersChange.emit({});
  }
} 