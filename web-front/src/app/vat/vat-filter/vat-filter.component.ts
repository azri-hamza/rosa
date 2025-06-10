import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { VatRateFilter } from '@rosa/types';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-vat-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzIconModule,
  ],
  templateUrl: './vat-filter.component.html',
  styleUrl: './vat-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VatFilterComponent implements OnInit {
  @Input() filters: VatRateFilter = {};
  @Output() filtersChange = new EventEmitter<VatRateFilter>();

  private fb = inject(FormBuilder);

  filterForm: FormGroup;

  statusOptions = [
    { label: 'All', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  defaultOptions = [
    { label: 'All', value: null },
    { label: 'Default', value: true },
    { label: 'Not Default', value: false },
  ];

  constructor() {
    this.filterForm = this.fb.group({
      name: [''],
      isActive: [null],
      isDefault: [null],
      countryCode: [''],
      minRate: [null],
      maxRate: [null],
    });
  }

  ngOnInit() {
    // Set initial values
    this.filterForm.patchValue(this.filters);

    // Listen to form changes and emit with debounce
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.onFilterChange();
    });
  }

  private onFilterChange() {
    const formValue = this.filterForm.value;
    const filters: VatRateFilter = {};

    if (formValue.name?.trim()) {
      filters.name = formValue.name.trim();
    }

    if (formValue.isActive !== null) {
      filters.isActive = formValue.isActive;
    }

    if (formValue.isDefault !== null) {
      filters.isDefault = formValue.isDefault;
    }

    if (formValue.countryCode?.trim()) {
      filters.countryCode = formValue.countryCode.trim().toUpperCase();
    }

    if (formValue.minRate !== null && formValue.minRate >= 0) {
      filters.minRate = formValue.minRate / 100; // Convert percentage to decimal
    }

    if (formValue.maxRate !== null && formValue.maxRate >= 0) {
      filters.maxRate = formValue.maxRate / 100; // Convert percentage to decimal
    }

    this.filtersChange.emit(filters);
  }

  clearFilters() {
    this.filterForm.reset({
      name: '',
      isActive: null,
      isDefault: null,
      countryCode: '',
      minRate: null,
      maxRate: null,
    });
  }
} 