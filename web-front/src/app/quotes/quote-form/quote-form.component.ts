import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  ],
  templateUrl: './quote-form.component.html',
  styleUrl: './quote-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteFormComponent {
  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef);

  quoteForm: FormGroup = this.fb.group({
    year: [null, [Validators.min(2000)]],
    items: this.fb.array([]),
  });

  get items() {
    return this.quoteForm.get('items') as FormArray;
  }

  addItem() {
    const itemForm = this.fb.group({
      productId: ['', Validators.required],
      productName: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      totalPrice: [0],
    });

    // Update total price when quantity or unit price changes
    itemForm
      .get('quantity')
      ?.valueChanges.subscribe(() => this.updateTotalPrice(itemForm));
    itemForm
      .get('unitPrice')
      ?.valueChanges.subscribe(() => this.updateTotalPrice(itemForm));

    this.items.push(itemForm);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  private updateTotalPrice(itemForm: FormGroup) {
    const quantity = itemForm.get('quantity')?.value || 0;
    const unitPrice = itemForm.get('unitPrice')?.value || 0;
    itemForm.patchValue(
      { totalPrice: quantity * unitPrice },
      { emitEvent: false }
    );
  }

  onSubmit() {
    if (this.quoteForm.valid) {
      this.modalRef.close(this.quoteForm.value);
    }
  }

  cancel() {
    this.modalRef.close();
  }
}
