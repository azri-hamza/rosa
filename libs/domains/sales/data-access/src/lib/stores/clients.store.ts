import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Client, CreateClientRequest, UpdateClientRequest, ApiResponse } from '@rosa/types';
import { ClientService } from '../services/client.service';
import { inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';

interface ClientsState {
  clients: Client[];
  selectedClient: Client | null;
  loading: boolean;
  loadingError: string | null;  // Critical errors that prevent data display
  operationError: string | null; // Operation errors that don't block UI
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  filter: string;
  sort: string;
  order: 'ASC' | 'DESC';
}

const initialState: ClientsState = {
  clients: [],
  selectedClient: null,
  loading: false,
  loadingError: null,
  operationError: null,
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  filter: '',
  sort: 'name',
  order: 'ASC',
};

export const ClientsStore = signalStore(
  withState(initialState),
  withMethods((store, clientService = inject(ClientService)) => ({
    loadClients(page?: number, limit?: number) {
      const pageToLoad = page ?? store.currentPage();
      const limitToLoad = limit ?? store.itemsPerPage();
      
      patchState(store, { loading: true, loadingError: null });
      
      clientService.getClients(pageToLoad, limitToLoad).subscribe({
        next: (result) => {
          patchState(store, {
            clients: result.data,
            totalItems: result.total,
            currentPage: result.page,
            itemsPerPage: result.limit,
            loading: false,
          });
        },
        error: (error) => {
          console.error('Error loading clients:', error);
          patchState(store, { 
            loading: false, 
            loadingError: 'Failed to load clients' 
          });
        },
      });
    },

    loadClientByReferenceId(referenceId: string) {
      patchState(store, { loading: true, loadingError: null });
      
      clientService.getClientByReferenceId(referenceId).subscribe({
        next: (response: ApiResponse<Client>) => {
          patchState(store, {
            selectedClient: response.data,
            loading: false,
          });
        },
        error: (error) => {
          console.error('Error loading client:', error);
          patchState(store, { 
            loading: false, 
            loadingError: 'Failed to load client' 
          });
        },
      });
    },

    setPage(page: number) {
      if (store.currentPage() === page) return;
      patchState(store, { currentPage: page });
      this.loadClients(page);
    },

    setPageSize(limit: number) {
      if (store.itemsPerPage() === limit) return;
      patchState(store, { itemsPerPage: limit, currentPage: 1 });
      this.loadClients(1, limit);
    },

    setFilter(filter: string) {
      if (store.filter() === filter) return;
      patchState(store, { filter, currentPage: 1 });
      this.loadClients(1);
    },

    setSort(sort: string, order: 'ASC' | 'DESC') {
      if (store.sort() === sort && store.order() === order) return;
      patchState(store, { sort, order, currentPage: 1 });
      this.loadClients(1);
    },

    createClient(client: CreateClientRequest): Observable<ApiResponse<Client>> {
      patchState(store, { loading: true, operationError: null });
      
      return clientService.createClient(client).pipe(
        tap(() => {
          this.loadClients();
          patchState(store, { loading: false, operationError: null });
        }),
        catchError((error) => {
          console.error('Error creating client:', error);
          const errorMessage = error?.error?.message || error?.message || 'Failed to create client';
          patchState(store, { 
            loading: false,
            operationError: errorMessage
          });
          return throwError(() => error);
        })
      );
    },

    updateClient(id: number, client: UpdateClientRequest): Observable<ApiResponse<Client>> {
      patchState(store, { loading: true, operationError: null });
      
      return clientService.updateClient(id, client).pipe(
        tap(() => {
          this.loadClients();
          patchState(store, { loading: false, operationError: null });
        }),
        catchError((error) => {
          console.error('Error updating client:', error);
          const errorMessage = error?.error?.message || error?.message || 'Failed to update client';
          patchState(store, { 
            loading: false,
            operationError: errorMessage
          });
          return throwError(() => error);
        })
      );
    },

    deleteClient(id: number): Observable<void> {
      patchState(store, { loading: true, operationError: null });
      
      return clientService.deleteClient(id).pipe(
        tap({
          next: () => {
            console.log('Client deletion successful, removing from list...');
            patchState(store, (state) => ({
              clients: state.clients.filter(client => client.id !== id),
              totalItems: state.totalItems - 1,
              loading: false,
              operationError: null
            }));
          },
          error: (error) => {
            console.log('Client deletion failed in tap error:', error);
            const errorMessage = error?.error?.message || error?.message || 'Failed to delete client';
            patchState(store, { 
              loading: false,
              operationError: errorMessage
            });
          }
        }),
        catchError((error) => {
          console.log('Client deletion failed in catchError:', error);
          const errorMessage = error?.error?.message || error?.message || 'Failed to delete client';
          patchState(store, { 
            loading: false,
            operationError: errorMessage
          });
          return throwError(() => error);
        })
      );
    },

    clearLoadingError() {
      patchState(store, { loadingError: null });
    },

    clearOperationError() {
      patchState(store, { operationError: null });
    },

    clearAllErrors() {
      patchState(store, { loadingError: null, operationError: null });
    },

    clearSelectedClient() {
      patchState(store, { selectedClient: null });
    },
  })),
  withHooks({
    onInit: (store) => {
      store.loadClients();
    },
  })
); 