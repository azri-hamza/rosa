import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { VatService } from '@rosa/sales/data-access';
import { CreateVatRateRequest, UpdateVatRateRequest, VatRateResponse } from '@rosa/types';

interface ModalData {
  vatRate?: VatRateResponse;
}

@Component({
  selector: 'app-vat-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSwitchModule,
    NzDatePickerModule,
  ],
  templateUrl: './vat-form.component.html',
  styleUrl: './vat-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VatFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modal = inject(NzModalRef);
  private vatService = inject(VatService);
  private message = inject(NzMessageService);
  private modalData = inject<ModalData>(NZ_MODAL_DATA);

  vatForm: FormGroup;
  isLoading = false;
  isEditMode = false;

  constructor() {
    this.isEditMode = !!this.modalData?.vatRate;

    this.vatForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      rate: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      description: ['', [Validators.maxLength(500)]],
      isActive: [true],
      isDefault: [false],
      countryCode: ['', [Validators.pattern(/^[A-Z]{2,10}$/)]],
      effectiveFrom: [null],
      effectiveTo: [null],
    });
  }

  ngOnInit() {
    if (this.isEditMode && this.modalData?.vatRate) {
      const vatRate = this.modalData.vatRate;
      this.vatForm.patchValue({
        name: vatRate.name,
        rate: vatRate.rate * 100, // Convert decimal to percentage
        description: vatRate.description || '',
        isActive: vatRate.isActive,
        isDefault: vatRate.isDefault,
        countryCode: vatRate.countryCode || '',
        effectiveFrom: vatRate.effectiveFrom ? new Date(vatRate.effectiveFrom) : null,
        effectiveTo: vatRate.effectiveTo ? new Date(vatRate.effectiveTo) : null,
      });
    }
  }

  onSubmit() {
    if (this.vatForm.invalid) {
      Object.values(this.vatForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.isLoading = true;
    const formValue = this.vatForm.value;

    const vatData = {
      name: formValue.name,
      rate: formValue.rate / 100, // Convert percentage to decimal
      description: formValue.description || undefined,
      isActive: formValue.isActive,
      isDefault: formValue.isDefault,
      countryCode: formValue.countryCode || undefined,
      effectiveFrom: formValue.effectiveFrom?.toISOString() || undefined,
      effectiveTo: formValue.effectiveTo?.toISOString() || undefined,
    };

    const operation = this.isEditMode && this.modalData?.vatRate
      ? this.vatService.updateVatRate(this.modalData.vatRate.id, vatData as UpdateVatRateRequest)
      : this.vatService.createVatRate(vatData as CreateVatRateRequest);

    operation.subscribe({
      next: () => {
        this.message.success(
          this.isEditMode ? 'VAT rate updated successfully' : 'VAT rate created successfully'
        );
        this.modal.close(true);
      },
      error: (error) => {
        console.error('Error saving VAT rate:', error);
        const errorMessage = error?.error?.message || error?.message || 'Failed to save VAT rate';
        this.message.error(errorMessage);
        this.isLoading = false;
      }
    });
  }

  onCancel() {
    this.modal.close(false);
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.vatForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.vatForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} must be at most ${field.errors['max'].max}`;
      if (field.errors['pattern']) return `${fieldName} format is invalid`;
    }
    return '';
  }
} 