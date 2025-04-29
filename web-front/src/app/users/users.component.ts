import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersStore } from '@rosa/sales/data-access';
import { inject } from '@angular/core';

@Component({
  selector: 'app-users',
  imports: [CommonModule],
  providers: [UsersStore],
  standalone: true,
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  readonly usersStore = inject(UsersStore);

  users = this.usersStore.users;

  constructor() {
    this.usersStore.loadUsers();
  }
}
