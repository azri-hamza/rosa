import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Product } from '@rosa/types';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnInit {
  private initialProduct?: Partial<Product>;
  productForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private modalRef: NzModalRef
  ) {}

  ngOnInit() {
    this.initialProduct = (this.modalRef.getConfig().nzData as Partial<Product>) ?? undefined;
    this.productForm = this.fb.group({
      name: [this.initialProduct?.name ?? '', [Validators.required]],
      description: [this.initialProduct?.description ?? '', [Validators.required]],
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
