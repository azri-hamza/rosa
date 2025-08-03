import { inject, Injectable } from '@angular/core';
import { ApiClient } from '@rosa/api-client';
import { Client, CreateClientRequest, UpdateClientRequest, PaginatedResult, Response } from '@rosa/types';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly apiClient = inject(ApiClient);

  getClients(page = 1, limit = 10) {
    return this.apiClient.get<PaginatedResult<Client>>('clients', { 
      params: { page: String(page), limit: String(limit) } 
    });
  }

  getClient(id: number) {
    return this.apiClient.get<Response<Client>>(`clients/${id}`);
  }

  getClientByReferenceId(referenceId: string) {
    return this.apiClient.get<Response<Client>>(`clients/reference/${referenceId}`);
  }

  createClient(client: CreateClientRequest) {
    return this.apiClient.post<Response<Client>>('clients', client);
  }

  updateClient(id: number, client: UpdateClientRequest) {
    return this.apiClient.patch<Response<Client>>(`clients/${id}`, client);
  }

  deleteClient(id: number) {
    return this.apiClient.delete<void>(`clients/${id}`);
  }

  searchClients(term: string) {
    return this.apiClient.get<Response<Client[]>>('clients/search', { 
      params: { q: term } 
    });
  }
}