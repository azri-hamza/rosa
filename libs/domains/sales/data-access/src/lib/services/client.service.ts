import { inject, Injectable } from '@angular/core';
import { ApiClient } from '@rosa/api-client';
import { Client, CreateClientRequest, UpdateClientRequest, PaginatedResult } from '@rosa/types';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly apiClient = inject(ApiClient);

  getClients(page = 1, limit = 10) {
    return this.apiClient.get<PaginatedResult<Client>>('clients', { 
      params: { page: String(page), limit: String(limit) } 
    });
  }

  getClient(id: number) {
    return this.apiClient.get<Client>(`clients/${id}`);
  }

  getClientByReferenceId(referenceId: string) {
    return this.apiClient.get<Client>(`clients/reference/${referenceId}`);
  }

  createClient(client: CreateClientRequest) {
    return this.apiClient.post<Client>('clients', client);
  }

  updateClient(id: number, client: UpdateClientRequest) {
    return this.apiClient.patch<Client>(`clients/${id}`, client);
  }

  deleteClient(id: number) {
    return this.apiClient.delete<void>(`clients/${id}`);
  }

  searchClients(term: string) {
    return this.apiClient.get<Client[]>('clients/search', { 
      params: { q: term } 
    });
  }
} 