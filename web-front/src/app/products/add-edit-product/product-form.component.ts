import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Product, VatRateResponse } from '@rosa/types';
import { VatService } from '@rosa/sales/data-access';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSelectModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnInit {
  private initialProduct?: Partial<Product>;
  private vatService = inject(VatService);
  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef);
  productForm!: FormGroup;
  vatRates: VatRateResponse[] = [];
  loading = false;

  ngOnInit() {
    this.initialProduct = (this.modalRef.getConfig().nzData as Partial<Product>) ?? undefined;
    this.productForm = this.fb.group({
      name: [this.initialProduct?.name ?? '', [Validators.required]],
      description: [this.initialProduct?.description ?? '', [Validators.required]],
      netPrice: [this.initialProduct?.netPrice ?? null],
      vatRateId: [this.initialProduct?.vatRate?.id ?? null],
    });

    this.loadVatRates();
  }

  private loadVatRates() {
    this.loading = true;
    this.vatService.getActiveVatRates().subscribe({
      next: (vatRates) => {
        this.vatRates = vatRates;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading VAT rates:', error);
        this.loading = false;
      }
    });
  }

  submitForm(): void {
    if (this.productForm.valid) {
      const productData: Partial<Product> = this.productForm.value;
      this.modalRef.close(productData);
    } else {
      Object.values(this.productForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  cancel(): void {
    this.modalRef.close();
  }
}
