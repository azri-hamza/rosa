import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { User } from '@rosa/types';
import { UserService } from '../services/user.service';
import { inject } from '@angular/core';

interface UsersState {
  users: User[];
  loading: boolean;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

const initialState: UsersState = {
  loading: true,
  users: [],
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
};

export const UsersStore = signalStore(
  withState(initialState),
  withMethods((store, userService = inject(UserService)) => ({
    loadUsers(page?: number, limit?: number) {
      const pageToLoad = page ?? store.currentPage();
      const limitToLoad = limit ?? store.itemsPerPage();
      patchState(store, { loading: true });
      userService.getUsers(pageToLoad, limitToLoad).subscribe({
        next: (result) => {
          patchState(store, {
            users: result.data,
            totalItems: result.total,
            currentPage: result.page,
            itemsPerPage: result.limit,
            loading: false,
          });
        },
        error: (error) => {
          console.error('Error loading users:', error);
          patchState(store, { loading: false });
        },
      });
    },
    setPage(page: number) {
      if (store.currentPage() === page) return;
      patchState(store, { currentPage: page });
      this.loadUsers(page);
    },
    setPageSize(limit: number) {
      if (store.itemsPerPage() === limit) return;
      patchState(store, { itemsPerPage: limit, currentPage: 1 });
      this.loadUsers(1, limit);
    },
    createUser(user: Partial<User>) {
      patchState(store, { loading: true });
      userService.createUser(user).subscribe({
        next: () => {
          this.loadUsers();
          patchState(store, { loading: false });
        },
        error: (error) => {
          console.error('Error creating user:', error);
          patchState(store, { loading: false });
        },
      });
    },
    updateUser(id: string, user: Partial<User>) {
      patchState(store, { loading: true });
      userService.updateUser(id, user).subscribe({
        next: () => {
          this.loadUsers();
          patchState(store, { loading: false });
        },
        error: (error) => {
          console.error('Error updating user:', error);
          patchState(store, { loading: false });
        },
      });
    },
    deleteUser(id: string) {
      patchState(store, { loading: true });
      userService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers();
          patchState(store, { loading: false });
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          patchState(store, { loading: false });
        },
      });
    },
  })),
  withHooks({
    onInit: (store) => {
      store.loadUsers();
    },
  })
);
