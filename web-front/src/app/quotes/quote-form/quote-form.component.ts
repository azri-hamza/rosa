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
  Validators,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { ProductService, ClientService } from '@rosa/sales/data-access';
import { Product, Quote, Client, ApiResponse } from '@rosa/types';
import { of, merge, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, startWith, map } from 'rxjs/operators';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzIconModule,
    NzAutocompleteModule,
    NzDatePickerModule,
  ],
  templateUrl: './quote-form.component.html',
  styleUrl: './quote-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .items-section {
      margin: 24px 0;
    }

    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .items-header h3 {
      margin: 0;
    }

    .item-form {
      background: #fafafa;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .quantity-price-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      align-items: start;
    }

    .quantity-price-group button {
      align-self: center;
      margin-top: 29px;
    }

    .form-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
    }

    :host ::ng-deep {
      .ant-form-item {
        margin-bottom: 16px;
      }

      .ant-input-number {
        width: 100%;
      }

      /* Fix date picker calendar positioning and z-index */
      .ant-picker-dropdown {
        z-index: 10000 !important;
      }

      .ant-picker-panel-container {
        z-index: 10001 !important;
      }

      .ant-picker {
        width: 100%;
      }

      /* Ensure modal doesn't interfere with date picker */
      .ant-modal-wrap {
        overflow: visible;
      }

      .ant-modal {
        overflow: visible;
      }

      .ant-modal-body {
        overflow: visible;
      }

      /* Additional fixes for date picker in modal */
      .ant-picker-panel {
        z-index: 10002 !important;
      }

      /* Force the dropdown to use fixed positioning */
      .ant-picker-dropdown-placement-bottomLeft,
      .ant-picker-dropdown-placement-bottomRight,
      .ant-picker-dropdown-placement-topLeft,
      .ant-picker-dropdown-placement-topRight {
        position: fixed !important;
        z-index: 10000 !important;
      }
    }
  `],
})
export class QuoteFormComponent implements OnInit {
  @ViewChildren('productNameInput') productNameInputs!: QueryList<ElementRef>;
  
  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef);
  private productService = inject(ProductService);
  private clientService = inject(ClientService);

  quoteForm: FormGroup = this.fb.group({
    year: [new Date().getFullYear(), [Validators.min(2000)]],
    userDate: [null],
    clientId: [null],
    items: this.fb.array([], [Validators.required, Validators.minLength(1)]),
  });

  get items() {
    return this.quoteForm.get('items') as FormArray;
  }

  get isFormValid(): boolean {
    return this.quoteForm.valid && this.items.length > 0 && this.items.controls.every(control => {
      const itemForm = control as FormGroup;
      return itemForm.get('productName')?.value &&
             itemForm.get('quantity')?.value > 0 &&
             itemForm.get('unitPrice')?.value >= 0;
    });
  }

  productOptions: Product[][] = [];
  productSearchLoading: boolean[] = [];
  private focusSubjects: Subject<void>[] = [];

  // Client-related properties
  clientOptions: Client[] = [];
  clientSearchLoading = false;
  selectedClient: Client | null = null;

  ngOnInit() {
    const quote = this.modalRef.getConfig().nzData?.quote as Quote | undefined;
    
    if (quote) {
      this.quoteForm.patchValue({
        year: quote.year,
        userDate: quote.userDate,
        clientId: quote.client?.id || null,
      });

      // Set selected client if available
      if (quote.client) {
        this.selectedClient = quote.client;
      }
      
      // Clear existing items
      while (this.items.length) {
        this.items.removeAt(0);
      }
      
      // Add each item from the quote
      quote.items?.forEach(item => {
        console.log(item);
        const itemForm = this.fb.group({
          productId: [item.productId, Validators.required],
          productName: [item.productName, Validators.required],
          quantity: [Number(item.quantity), [Validators.required, Validators.min(1)]],
          unitPrice: [Number(item.unitPrice), [Validators.required, Validators.min(0)]],
          totalPrice: [Number(item.totalPrice)],
        });

        // Set up value change subscriptions
        itemForm.get('quantity')?.valueChanges.subscribe(() => this.updateTotalPrice(itemForm));
        itemForm.get('unitPrice')?.valueChanges.subscribe(() => this.updateTotalPrice(itemForm));

        // Calculate initial total price
        this.updateTotalPrice(itemForm);

        this.items.push(itemForm);
        this.productOptions.push([]);
        this.productSearchLoading.push(false);
        this.focusSubjects.push(new Subject<void>());
      });
    }

    // Set up client search
    this.setupClientSearch();
  }

  private setupClientSearch() {
    // Load initial clients
    this.clientService.searchClients('').subscribe(response => {
      this.clientOptions = response.data;
    });
  }

  onClientSearch(term: string) {
    if (this.clientSearchLoading) return;
    
    this.clientSearchLoading = true;
    this.clientService.searchClients(term).subscribe({
      next: (response: ApiResponse<Client[]>) => {
        this.clientOptions = response.data;
        this.clientSearchLoading = false;
      },
      error: () => {
        this.clientSearchLoading = false;
      }
    });
  }

  onClientSelected(client: Client) {
    this.selectedClient = client;
    this.quoteForm.patchValue({ clientId: client.id });
  }

  getClientDisplayName(client: Client): string {
    const parts = [client.name];
    if (client.phoneNumber) parts.push(client.phoneNumber);
    if (client.taxIdentificationNumber) parts.push(`Tax: ${client.taxIdentificationNumber}`);
    return parts.join(' - ');
  }

  addItem() {
    const itemForm = this.fb.group({
      productId: ['', Validators.required],
      productName: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      totalPrice: [0],
    });

    // Set up value change subscriptions
    itemForm.get('quantity')?.valueChanges.subscribe(() => {
      this.updateTotalPrice(itemForm);
      this.quoteForm.updateValueAndValidity();
    });
    
    itemForm.get('unitPrice')?.valueChanges.subscribe(() => {
      this.updateTotalPrice(itemForm);
      this.quoteForm.updateValueAndValidity();
    });

    this.productOptions.push([]);
    this.productSearchLoading.push(false);
    
    // Create a new focus subject for this item
    const focusSubject = new Subject<void>();
    this.focusSubjects.push(focusSubject);

    // Combine focus events with value changes
    merge(
      (itemForm.get('productName')?.valueChanges || of('')).pipe(
        map((value: string | null) => value ?? '')
      ),
      focusSubject.pipe(map(() => itemForm.get('productName')?.value ?? ''))
    ).pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => {
        const index = this.items.length;
        if (!term) {
          this.productOptions[index] = [];
          return this.productService.searchProducts(''); // Search with empty string on focus
        }
        this.productSearchLoading[index] = true;
        return this.productService.searchProducts(term);
      })
    ).subscribe((products: Product[]) => {
      const index = this.items.length - 1;
      this.productOptions[index] = products;
      this.productSearchLoading[index] = false;
    });

    this.items.push(itemForm);

    // Focus on the newly added input after Angular has updated the view
    setTimeout(() => {
      const lastInput = this.productNameInputs.last;
      if (lastInput) {
        lastInput.nativeElement.focus();
      }
    });
  }

  onInputFocus(index: number) {
    this.focusSubjects[index].next();
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.productOptions.splice(index, 1);
    this.productSearchLoading.splice(index, 1);
    this.focusSubjects.splice(index, 1);
  }

  private updateTotalPrice(itemForm: FormGroup) {
    const quantity = itemForm.get('quantity')?.value || 0;
    const unitPrice = itemForm.get('unitPrice')?.value || 0;
    itemForm.patchValue(
      { totalPrice: quantity * unitPrice },
      { emitEvent: false }
    );
    // Trigger form validation
    this.quoteForm.updateValueAndValidity();
  }

  onProductSelected(event: any, itemIndex: number) {
    // This handles keyboard selection (Enter key)
    // The event is actually a NzAutocompleteOptionComponent object
    const selectedValue = event.nzValue;
    console.log('selectedValue', selectedValue);
    const product = this.productOptions[itemIndex].find(p => p.name === selectedValue);
    if (product) {
      this.selectProduct(product, itemIndex);
    }
  }

  selectProduct(product: Product, itemIndex: number) {
    const itemForm = this.items.at(itemIndex) as FormGroup;
    console.log('product', product);
    console.log('itemForm', itemForm);
    itemForm.patchValue({
      productId: product.productId, // Use UUID productId
      productName: product.name,
    });
    // Trigger form validation
    this.quoteForm.updateValueAndValidity();
  }

  onEnterKeydown(event: Event, autocomplete: any, index: number) {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    
    // Get the active option from the autocomplete
    if (autocomplete.activeOption) {
      const selectedProductName = autocomplete.activeOption.nzValue;
      console.log('Enter key pressed, selected product name:', selectedProductName);
      
      // Find the product object from our options array
      const product = this.productOptions[index].find(p => p.name === selectedProductName);
      console.log('Found product:', product);
      
      if (product) {
        this.selectProduct(product, index);
        autocomplete.closePanel();
      }
    }
  }

  onSubmit() {
    if (this.isFormValid) {
      const formValue = this.quoteForm.value;
      this.modalRef.close(formValue);
    }
  }

  onDatePickerOpenChange(open: boolean) {
    console.log('Date picker open state changed:', open);
    if (open) {
      // Ensure the calendar is properly positioned when opened
      setTimeout(() => {
        const dropdowns = document.querySelectorAll('.ant-picker-dropdown');
        dropdowns.forEach(dropdown => {
          (dropdown as HTMLElement).style.zIndex = '10000';
        });
      }, 0);
    }
  }

  cancel() {
    this.modalRef.close();
  }
}
