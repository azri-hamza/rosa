import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit {
  user?: { id: string; name: string; email: string } = inject(NZ_MODAL_DATA, { optional: true })?.user;
  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef<UserFormComponent>);

  userForm!: FormGroup;

  ngOnInit() {
    this.userForm = this.fb.group({
      name: [this.user?.name ?? '', [Validators.required]],
      email: [this.user?.email ?? '', [Validators.required, Validators.email]],
    });
  }

  submitForm(): void {
    if (this.userForm.valid) {
      this.modalRef.close(this.userForm.value);
    } else {
      Object.values(this.userForm.controls).forEach(control => {
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