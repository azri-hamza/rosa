import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewChildren,
  QueryList,
  ElementRef,
  OnInit,
  OnDestroy,
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
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { takeUntil } from 'rxjs/operators';

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
    NzToolTipModule,
  ],
  templateUrl: './delivery-note-form.component.html',
  styleUrl: './delivery-note-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryNoteFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @ViewChildren('productInput') productInputs!: QueryList<ElementRef>;

  private fb = inject(FormBuilder);
  private modal = inject(NzModalRef);
  private productService = inject(ProductService);
  private clientService = inject(ClientService);

  deliveryNoteForm: FormGroup;
  clients: Client[] = [];
  isLoadingClients = false;
  isEditMode = false;
  
  // Product autocomplete
  productOptions: Product[] = [];
  isLoadingProducts = false;
  productSearchSubject = new Subject<string>();
  
  // Client search
  clientSearchSubject = new Subject<string>();
  nzFilterOption = () => false; // Disable client-side filtering since we use server search

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
      globalDiscountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      globalDiscountAmount: [0, [Validators.min(0)]],
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

    // Setup client search
    this.clientSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 2) return of([]);
        this.isLoadingClients = true;
        return this.clientService.searchClients(term);
      })
    ).subscribe(clients => {
      this.clients = clients;
      this.isLoadingClients = false;
    });

    // Setup global discount calculations
    this.deliveryNoteForm.get('globalDiscountPercentage')!.valueChanges.subscribe(() => {
      this.calculateGlobalDiscount();
    });

    // Subscribe to global discount amount changes to calculate percentage (frontend helper)
    this.deliveryNoteForm.get('globalDiscountAmount')!.valueChanges.subscribe((globalDiscountAmount: number) => {
      this.calculateGlobalDiscountPercentageFromAmount(globalDiscountAmount);
    });
  }

  ngOnInit() {
    this.addItem(); // Add one item by default

    // If editing, load only the specific client then populate form
    const deliveryNote = this.modal.getConfig().nzData?.deliveryNote as DeliveryNote;
    if (deliveryNote) {
      this.isEditMode = true;
      this.loadClientAndPopulateForm(deliveryNote);
    }
    // For new delivery notes, clients will be loaded on search
  }

  get items(): FormArray {
    return this.deliveryNoteForm.get('items') as FormArray;
  }



  private loadClientAndPopulateForm(deliveryNote: DeliveryNote) {
    if (!deliveryNote.clientId) {
      // If no client ID, just populate the form without loading any client
      this.populateForm(deliveryNote);
      return;
    }

    this.isLoadingClients = true;
    this.clientService.getClient(deliveryNote.clientId).subscribe({
      next: (client) => {
        // Set only the specific client needed for this delivery note
        this.clients = [client];
        this.isLoadingClients = false;
        // Now that the client is loaded, populate the form
        this.populateForm(deliveryNote);
      },
      error: (error) => {
        console.error('Error loading client:', error);
        this.isLoadingClients = false;
        // Even if client fails to load, still populate the form
        this.populateForm(deliveryNote);
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
      globalDiscountPercentage: deliveryNote.globalDiscountPercentage || 0,
      globalDiscountAmount: deliveryNote.globalDiscountAmount || 0,
    });

    // Clear existing items and add delivery note items
    this.items.clear();
    deliveryNote.items.forEach(item => {
      this.addItem(item);
    });
  }

  addItem(item?: any) {
    const itemForm = this.fb.group({
      id: [item?.id || null],
      productName: [item?.productName || '', [Validators.required]],
      description: [item?.description || ''],
      quantity: [item?.quantity || 0, [Validators.required, Validators.min(0)]],
      deliveredQuantity: [item?.deliveredQuantity || 0, [Validators.min(0)]],
      unitPrice: [item?.unitPrice || 0, [Validators.required, Validators.min(0)]],
      discountPercentage: [item?.discountPercentage || 0, [Validators.min(0), Validators.max(100)]],
      discountAmount: [item?.discountAmount || 0, [Validators.min(0)]],
      netUnitPrice: [item?.netUnitPrice || 0],
      grossUnitPrice: [item?.grossUnitPrice || 0],
      totalPrice: [item?.totalPrice || 0],
      vatRate: [item?.vatRate || 0, [Validators.min(0), Validators.max(100)]],
      vatAmount: [item?.vatAmount || 0],
      grossTotalPrice: [item?.grossTotalPrice || 0],
      productId: [item?.productId || null],
    });

    // Subscribe to changes that affect price calculations
    merge(
      itemForm.get('quantity')!.valueChanges,
      itemForm.get('unitPrice')!.valueChanges,
      itemForm.get('discountPercentage')!.valueChanges,
      itemForm.get('vatRate')!.valueChanges
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.calculateItemPrices(itemForm);
    });

    // Subscribe to discount amount changes to calculate percentage (frontend helper)
    itemForm.get('discountAmount')!.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((discountAmount: number) => {
      this.calculateDiscountPercentageFromAmount(itemForm, discountAmount);
    });

    this.items.push(itemForm);
  }

  private calculateItemPrices(itemForm: FormGroup): void {
    const quantity = itemForm.get('quantity')?.value || 0;
    const unitPrice = itemForm.get('unitPrice')?.value || 0;
    const discountPercentage = itemForm.get('discountPercentage')?.value || 0;
    const vatRate = itemForm.get('vatRate')?.value || 0;

    // Calculate discount amount based solely on discount percentage
    const finalDiscountAmount = Math.round(unitPrice * (discountPercentage / 100) * 1000) / 1000;

    // Calculate net unit price (after discount)
    const netUnitPrice = Math.round((unitPrice - finalDiscountAmount) * 1000) / 1000;
    itemForm.get('netUnitPrice')?.setValue(netUnitPrice, { emitEvent: false });

    // Calculate total price
    const netTotal = quantity * netUnitPrice;
    itemForm.get('totalPrice')?.setValue(netTotal, { emitEvent: false });

    // Calculate VAT and gross prices
    const grossUnitPrice = Math.round(netUnitPrice * (1 + vatRate / 100) * 1000) / 1000;
    itemForm.get('grossUnitPrice')?.setValue(grossUnitPrice, { emitEvent: false });

    const vatAmount = Math.round(netTotal * (vatRate / 100) * 1000) / 1000;
    itemForm.get('vatAmount')?.setValue(vatAmount, { emitEvent: false });

    const grossTotal = netTotal + vatAmount;
    itemForm.get('grossTotalPrice')?.setValue(grossTotal, { emitEvent: false });

    // Update discount amount (calculated from percentage)
    itemForm.get('discountAmount')?.setValue(finalDiscountAmount, { emitEvent: false });
  }

  private calculateDiscountPercentageFromAmount(itemForm: FormGroup, discountAmount: number): void {
    const unitPrice = itemForm.get('unitPrice')?.value || 0;
    
    if (discountAmount > 0 && unitPrice > 0) {
      const calculatedPercentage = Math.round((discountAmount / unitPrice) * 100 * 100) / 100;
      // Ensure percentage doesn't exceed 100%
      const finalPercentage = Math.min(calculatedPercentage, 100);
      itemForm.get('discountPercentage')?.setValue(finalPercentage, { emitEvent: false });
      
      // Recalculate prices based on the new percentage
      this.calculateItemPrices(itemForm);
    } else if (discountAmount === 0) {
      itemForm.get('discountPercentage')?.setValue(0, { emitEvent: false });
      this.calculateItemPrices(itemForm);
    }
  }

  private calculateGlobalDiscount() {
    const globalDiscountPercentage = this.deliveryNoteForm.get('globalDiscountPercentage')?.value || 0;
    const netTotalBeforeGlobalDiscount = this.getNetTotal();

    // Calculate discount amount based solely on discount percentage
    const calculatedAmount = Math.round(netTotalBeforeGlobalDiscount * (globalDiscountPercentage / 100) * 1000) / 1000;
    this.deliveryNoteForm.get('globalDiscountAmount')?.setValue(calculatedAmount, { emitEvent: false });
  }

  private calculateGlobalDiscountPercentageFromAmount(globalDiscountAmount: number): void {
    const netTotalBeforeGlobalDiscount = this.getNetTotal();
    
    if (globalDiscountAmount > 0 && netTotalBeforeGlobalDiscount > 0) {
      const calculatedPercentage = Math.round((globalDiscountAmount / netTotalBeforeGlobalDiscount) * 100 * 100) / 100;
      // Ensure percentage doesn't exceed 100%
      const finalPercentage = Math.min(calculatedPercentage, 100);
      this.deliveryNoteForm.get('globalDiscountPercentage')?.setValue(finalPercentage, { emitEvent: false });
      
      // Recalculate global discount based on the new percentage
      this.calculateGlobalDiscount();
    } else if (globalDiscountAmount === 0) {
      this.deliveryNoteForm.get('globalDiscountPercentage')?.setValue(0, { emitEvent: false });
      this.calculateGlobalDiscount();
    }
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
        productId: product.productId,
        vatRate: product.vatRate?.percentage || 0
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

  getItemDiscountAmount(index: number): number {
    const itemForm = this.items.at(index);
    return itemForm.get('discountAmount')?.value || 0;
  }

  getVatAmount(index: number): number {
    const itemForm = this.items.at(index);
    const netTotal = itemForm.get('totalPrice')?.value || 0;
    const vatRate = itemForm.get('vatRate')?.value / 100 || 0;
    return Math.round(netTotal * vatRate * 1000) / 1000;
  }

  getItemGrossTotal(index: number): number {
    const itemForm = this.items.at(index);
    const netTotal = itemForm.get('totalPrice')?.value || 0;
    const vatAmount = this.getVatAmount(index);
    return Math.round((netTotal + vatAmount) * 1000) / 1000;
  }

  getNetTotal(): number {
    return this.items.controls.reduce((total, item) => {
      return total + (item.get('totalPrice')?.value || 0);
    }, 0);
  }

  getGlobalDiscountAmount(): number {
    return this.deliveryNoteForm.get('globalDiscountAmount')?.value || 0;
  }

  getNetTotalAfterGlobalDiscount(): number {
    const netTotal = this.getNetTotal();
    const globalDiscountAmount = this.getGlobalDiscountAmount();
    return Math.round((netTotal - globalDiscountAmount) * 1000) / 1000;
  }

  getTotalVatAmount(): number {
    return this.items.controls.reduce((total, item, index) => {
      return total + this.getVatAmount(index);
    }, 0);
  }

  getGrossTotal(): number {
    const netTotalAfterGlobalDiscount = this.getNetTotalAfterGlobalDiscount();
    const totalVatAmount = this.getTotalVatAmount();
    return Math.round((netTotalAfterGlobalDiscount + totalVatAmount) * 1000) / 1000;
  }

  getTotalAmount(): number {
    return this.getGrossTotal();
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
        globalDiscountPercentage: Number(formValue.globalDiscountPercentage),
        globalDiscountAmount: Number(formValue.globalDiscountAmount),
        netTotalBeforeGlobalDiscount: this.getNetTotal(),
        netTotalAfterGlobalDiscount: this.getNetTotalAfterGlobalDiscount(),
        items: formValue.items.map((item: any) => {
          // Destructure to exclude id, then build the object without it
          const { id, ...itemWithoutId } = item;
          
          const processedItem: any = {
            ...itemWithoutId,
            quantity: Number(item.quantity),
            deliveredQuantity: Number(item.deliveredQuantity),
            unitPrice: Number(item.unitPrice),
            netUnitPrice: Number(item.netUnitPrice),
            discountPercentage: Number(item.discountPercentage),
            discountAmount: Number(item.discountAmount),
            grossUnitPrice: Number(item.grossUnitPrice),
            totalPrice: Number(item.totalPrice),
            vatRate: Number(item.vatRate),
          };
          
          // Only include id if it's a valid number (existing item)
          if (id && id !== '' && id !== null && id !== undefined && 
              ((typeof id === 'number' && id > 0) || 
               (typeof id === 'string' && id.trim() !== '' && !isNaN(Number(id)) && Number(id) > 0))) {
            processedItem.id = typeof id === 'string' ? Number(id) : id;
          }
          // For new items (empty string, null, undefined, or 0), don't include the id field at all
          
          return processedItem;
        }),
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

  onClientSearch(searchTerm: string) {
    this.clientSearchSubject.next(searchTerm);
  }

  onCancel() {
    this.modal.close();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 