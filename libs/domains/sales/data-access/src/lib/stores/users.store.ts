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
  page: number;
  total: number | null;
  loading: boolean;
}

const initialState: UsersState = {
  loading: true,
  users: [],
  page: 1,
  total: null,
};

export const UsersStore = signalStore(
  withState(initialState),
  withState({ users: [] as User[], loading: false }),
  withMethods((store, userService = inject(UserService)) => ({
    async loadUsers() {
      patchState(store, { loading: true });
      userService.getUsers().subscribe({
        next: (users) => {
          patchState(store, { users, loading: false });
        },
        error: (error) => {
          console.error('Error loading users:', error);
          patchState(store, { loading: false });
          // Handle error state if needed
        },
      });
    },
  })),
  withHooks({
    // onInit: (store) => {},
  })
);
