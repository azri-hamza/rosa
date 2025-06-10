import { inject, Injectable } from '@angular/core';
import { ApiClient } from '@rosa/api-client';
import { PaginatedResult, User } from '@rosa/types';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiClient = inject(ApiClient);

  getUsers(page = 1, limit = 10) {
    return this.apiClient.get<PaginatedResult<User>>('users', { 
      params: { page: String(page), limit: String(limit) } 
    });
  }

  getUser(id: string) {
    return this.apiClient.get<User>(`users/${id}`);
  }

  createUser(user: Partial<User>) {
    return this.apiClient.post<User>('users', user);
  }

  updateUser(id: string, user: Partial<User>) {
    return this.apiClient.patch<User>(`users/${id}`, user);
  }

  deleteUser(id: string) {
    return this.apiClient.delete<void>(`users/${id}`);
  }
}
