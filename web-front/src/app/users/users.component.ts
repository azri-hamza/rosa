import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersStore } from '@rosa/sales/data-access';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { UserFormComponent } from '../users/user-form/user-form.component';

@Component({
  selector: 'app-users-list',
  imports: [CommonModule, NzModalModule],
  providers: [UsersStore],
  standalone: true,
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent {
  readonly usersStore = inject(UsersStore);
  private modal = inject(NzModalService);

  users = this.usersStore.users;

  constructor() {
    this.usersStore.loadUsers();
  }

  openNewUserModal(): void {
    const modal = this.modal.create({
      nzTitle: 'Add New User',
      nzContent: UserFormComponent,
      nzFooter: null,
    });
    modal.afterClose.subscribe((result?: { name: string; email: string }) => {
      if (result) {
        this.usersStore.createUser(result);
      }
    });
  }
}
