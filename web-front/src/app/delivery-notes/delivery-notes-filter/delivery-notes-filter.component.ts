import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ClientService, DeliveryNoteFilters } from '@rosa/sales/data-access';
import { Client } from '@rosa/types';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-delivery-notes-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
  ],
  templateUrl: './delivery-notes-filter.component.html',
  styleUrl: './delivery-notes-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryNotesFilterComponent implements OnInit {
  @Input() filters: DeliveryNoteFilters = {};
  @Output() filtersChange = new EventEmitter<DeliveryNoteFilters>();

  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);

  filterForm: FormGroup;
  clients: Client[] = [];
  isLoadingClients = false;

  statusOptions = [
    { label: 'All', value: null },
    { label: 'Pending', value: 'pending' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  constructor() {
    this.filterForm = this.fb.group({
      clientId: [null],
      status: [null],
      dateRange: [null],
    });

    // Subscribe to form changes
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.onFilterChange();
      });
  }

  ngOnInit() {
    this.loadClients();
    this.updateFormFromFilters();
  }

  private loadClients() {
    this.isLoadingClients = true;
    this.clientService.getClients().subscribe({
      next: (result) => {
        this.clients = result.data || [];
        this.isLoadingClients = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.isLoadingClients = false;
      }
    });
  }

  private updateFormFromFilters() {
    const dateRange = this.filters.startDate && this.filters.endDate 
      ? [new Date(this.filters.startDate), new Date(this.filters.endDate)]
      : null;

    this.filterForm.patchValue({
      clientId: this.filters.clientId || null,
      status: this.filters.status || null,
      dateRange: dateRange,
    }, { emitEvent: false });
  }

  private onFilterChange() {
    const formValue = this.filterForm.value;
    const filters: DeliveryNoteFilters = {};

    if (formValue.clientId) {
      filters.clientId = formValue.clientId;
    }

    if (formValue.status) {
      filters.status = formValue.status;
    }

    if (formValue.dateRange && formValue.dateRange.length === 2) {
      filters.startDate = formValue.dateRange[0].toISOString();
      filters.endDate = formValue.dateRange[1].toISOString();
    }

    this.filtersChange.emit(filters);
  }

  clearFilters() {
    this.filterForm.reset();
  }
} 