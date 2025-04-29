import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '@rosa/types';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  getUsers() {
    return this.http.get<User[]>('/api/users');
  }
}
