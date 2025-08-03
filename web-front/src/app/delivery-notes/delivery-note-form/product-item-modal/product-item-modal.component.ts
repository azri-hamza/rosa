import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ProductService } from '@rosa/sales/data-access';
import { Product } from '@rosa/types';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';

export interface ProductItemData {
  id?: number;
  productName: string;
  description: string;
  quantity: number;
  deliveredQuantity: number;
  unitPrice: number;
  discountPercentage: number;
  discountAmount: number;
  netUnitPrice: number;
  grossUnitPrice: number;
  totalPrice: number;
  vatRate: number;
  vatAmount: number;
  grossTotalPrice: number;
  productId?: string;
}

@Component({
  selector: 'app-product-item-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzAutocompleteModule,
  ],
  templateUrl: './product-item-modal.component.html',
  styleUrl: './product-item-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductItemModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private modal = inject(NzModalRef);
  private message = inject(NzMessageService);
  private productService = inject(ProductService);
  private destroy$ = new Subject<void>();

  readonly nzModalData: { item?: ProductItemData } = inject(NZ_MODAL_DATA);

  productForm!: FormGroup;
  productOptions: Product[] = [];
  isLoadingProducts = false;
  private productSearchSubject = new Subject<string>();

  constructor() {
    this.productForm = this.fb.group({
      productName: ['', [Validators.required]],
      description: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      deliveredQuantity: [0, [Validators.min(0)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      discountAmount: [0, [Validators.min(0)]],
      netUnitPrice: [0],
      grossUnitPrice: [0],
      totalPrice: [0],
      vatRate: [0, [Validators.min(0), Validators.max(100)]],
      vatAmount: [0],
      grossTotalPrice: [0],
      productId: [null],
    });

    // Setup product search
    this.productSearchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term) return of([]);
          this.isLoadingProducts = true;
          return this.productService.searchProducts(term);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((products) => {
        this.productOptions = products;
        this.isLoadingProducts = false;
      });

    // Setup price calculations
    this.setupPriceCalculations();
  }

  ngOnInit() {
    // If editing an existing item, populate the form
    if (this.nzModalData.item) {
      this.populateForm(this.nzModalData.item);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private populateForm(item: ProductItemData) {
    this.productForm.patchValue({
      productName: item.productName,
      description: item.description,
      quantity: item.quantity,
      deliveredQuantity: item.deliveredQuantity,
      unitPrice: item.unitPrice,
      discountPercentage: item.discountPercentage,
      discountAmount: item.discountAmount,
      netUnitPrice: item.netUnitPrice,
      grossUnitPrice: item.grossUnitPrice,
      totalPrice: item.totalPrice,
      vatRate: item.vatRate,
      vatAmount: item.vatAmount,
      grossTotalPrice: item.grossTotalPrice,
      productId: item.productId,
    });
  }

  private setupPriceCalculations() {
    // Subscribe to changes that affect price calculations
    const priceFields = ['quantity', 'unitPrice', 'discountPercentage', 'vatRate'];
    
    priceFields.forEach(field => {
      this.productForm.get(field)?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.calculatePrices();
        });
    });

    // Subscribe to discount amount changes to calculate percentage (frontend helper)
    this.productForm.get('discountAmount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((discountAmount: number | null) => {
        if (discountAmount !== null) {
          this.calculateDiscountPercentageFromAmount(discountAmount);
        }
      });
  }

  private calculatePrices(): void {
    const quantity = this.productForm.get('quantity')?.value || 0;
    const unitPrice = this.productForm.get('unitPrice')?.value || 0;
    const discountPercentage = this.productForm.get('discountPercentage')?.value || 0;
    const vatRate = this.productForm.get('vatRate')?.value || 0;

    // Calculate discount amount from percentage
    const discountAmount = Math.round(unitPrice * (discountPercentage / 100) * 1000) / 1000;
    
    // Calculate net unit price (after discount)
    const netUnitPrice = Math.round((unitPrice - discountAmount) * 1000) / 1000;
    
    // Calculate gross unit price (net + VAT)
    const grossUnitPrice = Math.round(netUnitPrice * (1 + vatRate / 100) * 1000) / 1000;
    
    // Calculate total net price
    const totalPrice = Math.round(netUnitPrice * quantity * 1000) / 1000;
    
    // Calculate VAT amount
    const vatAmount = Math.round(totalPrice * (vatRate / 100) * 1000) / 1000;
    
    // Calculate gross total price
    const grossTotalPrice = Math.round((totalPrice + vatAmount) * 1000) / 1000;

    // Update form without triggering valueChanges again
    this.productForm.patchValue({
      discountAmount,
      netUnitPrice,
      grossUnitPrice,
      totalPrice,
      vatAmount,
      grossTotalPrice,
    }, { emitEvent: false });
  }

  private calculateDiscountPercentageFromAmount(discountAmount: number): void {
    const unitPrice = this.productForm.get('unitPrice')?.value || 0;
    if (unitPrice > 0) {
      const discountPercentage = Math.round((discountAmount / unitPrice) * 100 * 100) / 100;
      this.productForm.patchValue({
        discountPercentage: Math.min(discountPercentage, 100),
      }, { emitEvent: false });
      
      // Recalculate prices based on the new percentage
      this.calculatePrices();
    }
  }

  onProductSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.productSearchSubject.next(target.value);
    }
  }

  onProductSelect(option: any) {
    const productName = option.nzValue;
    const product = this.productOptions.find((p) => p.name === productName);
    if (product) {
      this.productForm.patchValue({
        productName: product.name,
        description: product.description,
        unitPrice: product.netPrice || 0,
        productId: product.productId,
        vatRate: product.vatRate?.percentage || 0,
      });
    }
  }

  currencyFormatter = (value: number): string => `€ ${value}`;
  currencyParser = (value: string): number =>
    parseFloat(value.replace('€ ', '')) || 0;

  onCancel() {
    this.modal.destroy();
  }

  onSave() {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      
      // Create the product item data
      const productItemData: ProductItemData = {
        id: this.nzModalData.item?.id,
        ...formValue,
      };

      this.modal.destroy(productItemData);
    } else {
      // Mark all fields as dirty to show validation errors
      Object.values(this.productForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      
      this.message.error('Please fill in all required fields correctly');
    }
  }
}