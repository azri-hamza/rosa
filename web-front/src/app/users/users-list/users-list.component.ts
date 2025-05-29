import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersStore } from '@rosa/sales/data-access';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { UserFormComponent } from '../user-form/user-form.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

@Component({
  selector: 'app-users-list',
  imports: [CommonModule, NzModalModule, NzButtonModule, NzIconModule, NzPaginationModule],
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
  currentPage = this.usersStore.currentPage;
  itemsPerPage = this.usersStore.itemsPerPage;
  totalItems = this.usersStore.totalItems;

  constructor() {
    this.usersStore.loadUsers();
  }

  onPageChange(page: number): void {
    this.usersStore.setPage(page);
  }

  onPageSizeChange(size: number): void {
    this.usersStore.setPageSize(size);
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

  openEditUserModal(user: { id: string; name: string; email: string }): void {
    const modal = this.modal.create({
      nzTitle: 'Edit User',
      nzContent: UserFormComponent,
      nzData: { user },
      nzFooter: null,
    });
    modal.afterClose.subscribe((result?: { name: string; email: string }) => {
      if (result) {
        this.usersStore.updateUser(user.id, result);
      }
    });
  }

  confirmDelete(user: { id: string; name: string }): void {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this user?',
      nzContent: `User "${user.name}" will be permanently deleted.`,
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.usersStore.deleteUser(user.id),
      nzCancelText: 'No',
    });
  }
}
