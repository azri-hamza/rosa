import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewChildren,
  QueryList,
  ElementRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ProductService, ClientService } from '@rosa/sales/data-access';
import { Product, DeliveryNote, Client } from '@rosa/types';
import { of, merge, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';

@Component({
  selector: 'app-delivery-note-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzSelectModule,
    NzAutocompleteModule,
  ],
  templateUrl: './delivery-note-form.component.html',
  styleUrl: './delivery-note-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryNoteFormComponent implements OnInit {
  @ViewChildren('productInput') productInputs!: QueryList<ElementRef>;

  private fb = inject(FormBuilder);
  private modal = inject(NzModalRef);
  private productService = inject(ProductService);
  private clientService = inject(ClientService);

  deliveryNoteForm: FormGroup;
  clients: Client[] = [];
  isLoadingClients = false;
  
  // Product autocomplete
  productOptions: Product[] = [];
  isLoadingProducts = false;
  productSearchSubject = new Subject<string>();

  statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  constructor() {
    this.deliveryNoteForm = this.fb.group({
      clientId: [null],
      deliveryDate: [new Date(), [Validators.required]],
      deliveryAddress: [''],
      notes: [''],
      status: ['pending', [Validators.required]],
      items: this.fb.array([]),
    });

    // Setup product search
    this.productSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term) return of([]);
        this.isLoadingProducts = true;
        return this.productService.searchProducts(term);
      })
    ).subscribe(products => {
      this.productOptions = products;
      this.isLoadingProducts = false;
    });
  }

  ngOnInit() {
    this.loadClients();
    this.addItem(); // Add one item by default

    // If editing, populate form
    const deliveryNote = this.modal.getConfig().nzData?.deliveryNote as DeliveryNote;
    if (deliveryNote) {
      this.populateForm(deliveryNote);
    }
  }

  get items(): FormArray {
    return this.deliveryNoteForm.get('items') as FormArray;
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

  private populateForm(deliveryNote: DeliveryNote) {
    this.deliveryNoteForm.patchValue({
      clientId: deliveryNote.clientId,
      deliveryDate: new Date(deliveryNote.deliveryDate),
      deliveryAddress: deliveryNote.deliveryAddress,
      notes: deliveryNote.notes,
      status: deliveryNote.status,
    });

    // Clear existing items and add delivery note items
    this.items.clear();
    deliveryNote.items.forEach(item => {
      this.addItem(item);
    });
  }

  addItem(item?: any) {
    const itemForm = this.fb.group({
      productName: [(item?.productName && typeof item.productName === 'object') ? item.productName.name : (item?.productName || ''), [Validators.required]],
      description: [item?.description || ''],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      deliveredQuantity: [item?.deliveredQuantity || 0, [Validators.min(0)]],
      unitPrice: [item?.unitPrice || 0, [Validators.required, Validators.min(0)]],
      totalPrice: [item?.totalPrice || 0],
      productId: [item?.productId || null],
    });

    // Calculate total price when quantity or unit price changes
    merge(
      itemForm.get('quantity')!.valueChanges,
      itemForm.get('unitPrice')!.valueChanges
    ).subscribe(() => {
      const quantity = itemForm.get('quantity')?.value || 0;
      const unitPrice = itemForm.get('unitPrice')?.value || 0;
      const totalPrice = quantity * unitPrice;
      itemForm.get('totalPrice')?.setValue(totalPrice, { emitEvent: false });
    });

    this.items.push(itemForm);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  onProductSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.productSearchSubject.next(target.value);
    }
  }

  onProductSelect(option: any, index: number) {
    const productName = option.nzValue;
    const product = this.productOptions.find(p => p.name === productName);
    if (product) {
      const itemForm = this.items.at(index);
      itemForm.patchValue({
        productName: product.name,
        description: product.description,
        unitPrice: product.netPrice || 0,
        productId: product.productId
      });
    }
  }

  getSelectedProduct(index: number): Product | undefined {
    const itemForm = this.items.at(index);
    const productId = itemForm.get('productId')?.value;
    if (productId) {
      return this.productOptions.find(p => p.productId === productId);
    }
    return undefined;
  }

  getVatAmount(index: number): number {
    const product = this.getSelectedProduct(index);
    if (product?.vatRate) {
      const itemForm = this.items.at(index);
      const totalPrice = itemForm.get('totalPrice')?.value || 0;
      return Math.round(totalPrice * product.vatRate.rate * 1000) / 1000;
    }
    return 0;
  }

  getItemGrossTotal(index: number): number {
    const itemForm = this.items.at(index);
    const totalPrice = itemForm.get('totalPrice')?.value || 0;
    const vatAmount = this.getVatAmount(index);
    return Math.round((totalPrice + vatAmount) * 1000) / 1000;
  }

  getNetTotal(): number {
    return this.items.controls.reduce((total, item) => {
      return total + (item.get('totalPrice')?.value || 0);
    }, 0);
  }

  getTotalVatAmount(): number {
    return this.items.controls.reduce((total, item, index) => {
      return total + this.getVatAmount(index);
    }, 0);
  }

  getGrossTotal(): number {
    return Math.round((this.getNetTotal() + this.getTotalVatAmount()) * 1000) / 1000;
  }

  getTotalAmount(): number {
    return this.items.controls.reduce((total, item) => {
      return total + (item.get('totalPrice')?.value || 0);
    }, 0);
  }

  currencyFormatter = (value: number): string => `€ ${value}`;
  currencyParser = (value: string): number => parseFloat(value.replace('€ ', '')) || 0;

  onSubmit() {
    if (this.deliveryNoteForm.valid) {
      const formValue = this.deliveryNoteForm.value;
      
      // Format the delivery note data
      const deliveryNoteData = {
        ...formValue,
        deliveryDate: formValue.deliveryDate?.toISOString?.() || formValue.deliveryDate,
        items: formValue.items.map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
          deliveredQuantity: Number(item.deliveredQuantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
      };

      this.modal.close(deliveryNoteData);
    } else {
      // Mark all fields as touched to show validation errors
      Object.values(this.deliveryNoteForm.controls).forEach(control => {
        if (control instanceof FormArray) {
          control.controls.forEach(itemControl => {
            if (itemControl instanceof FormGroup) {
              Object.values(itemControl.controls).forEach(field => {
                field.markAsTouched();
                field.updateValueAndValidity();
              });
            }
          });
        } else {
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      });
    }
  }

  onCancel() {
    this.modal.close();
  }
} 