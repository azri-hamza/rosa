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
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Client } from '@rosa/types';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef);

  clientForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    taxIdentificationNumber: [''],
    phoneNumber: ['', [Validators.pattern(/^[+]?[0-9\s\-()]{10,}$/)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
  });

  isEditMode = false;
  client: Client | null = null;

  ngOnInit() {
    const data = this.modalRef.getConfig().nzData;
    if (data?.client) {
      this.isEditMode = true;
      this.client = data.client;
      if (this.client) {
        this.clientForm.patchValue({
          name: this.client.name,
          taxIdentificationNumber: this.client.taxIdentificationNumber || '',
          phoneNumber: this.client.phoneNumber || '',
          address: this.client.address,
        });
      }
    }
  }

  onSubmit() {
    if (this.clientForm.valid) {
      const formValue = this.clientForm.value;
      this.modalRef.close(formValue);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.clientForm.controls).forEach(key => {
        this.clientForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.modalRef.close();
  }

  getFieldError(fieldName: string): string {
    const field = this.clientForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return `${fieldName} format is invalid`;
      }
    }
    return '';
  }
} 