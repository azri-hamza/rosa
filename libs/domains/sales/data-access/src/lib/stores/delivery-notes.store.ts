import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { DeliveryNote } from '@rosa/types';
import { DeliveryNoteService, DeliveryNoteFilters } from '../services/delivery-note.service';
import { inject } from '@angular/core';
import { Observable, tap, catchError, throwError, map } from 'rxjs';

interface DeliveryNotesState {
  deliveryNotes: DeliveryNote[];
  loading: boolean;
  selectedDeliveryNote: DeliveryNote | null;
  filters: DeliveryNoteFilters;
}

const initialState: DeliveryNotesState = {
  deliveryNotes: [],
  loading: false,
  selectedDeliveryNote: null,
  filters: {},
};

export const DeliveryNotesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, deliveryNoteService = inject(DeliveryNoteService)) => ({
    loadDeliveryNotes(filters?: DeliveryNoteFilters): Observable<DeliveryNote[]> {
      patchState(store, { loading: true });
      
      return deliveryNoteService.getDeliveryNotes(filters).pipe(
        map(response => response.data),
        tap((deliveryNotes) => {
          patchState(store, { 
            deliveryNotes, 
            loading: false,
            filters: filters || {}
          });
        }),
        catchError((error) => {
          patchState(store, { loading: false });
          return throwError(() => error);
        })
      );
    },

    loadDeliveryNote(referenceId: string): Observable<DeliveryNote> {
      patchState(store, { loading: true });
      
      return deliveryNoteService.getDeliveryNote(referenceId).pipe(
        map(response => response.data),
        tap((deliveryNote) => {
          patchState(store, { 
            selectedDeliveryNote: deliveryNote,
            loading: false 
          });
        }),
        catchError((error) => {
          patchState(store, { loading: false });
          return throwError(() => error);
        })
      );
    },

    setFilters(filters: DeliveryNoteFilters): void {
      patchState(store, { filters });
      this.loadDeliveryNotes(filters).subscribe();
    },

    createDeliveryNote(deliveryNote: Partial<DeliveryNote>): Observable<DeliveryNote> {
      patchState(store, { loading: true });
      
      return deliveryNoteService.createDeliveryNote(deliveryNote).pipe(
        map(response => response.data),
        tap((newDeliveryNote) => {
          patchState(store, { 
            deliveryNotes: [newDeliveryNote, ...store.deliveryNotes()],
            loading: false 
          });
        }),
        catchError((error) => {
          patchState(store, { loading: false });
          return throwError(() => error);
        })
      );
    },

    updateDeliveryNote(deliveryNote: DeliveryNote): Observable<DeliveryNote> {
      patchState(store, { loading: true });
      
      return deliveryNoteService.updateDeliveryNote(deliveryNote.referenceId, deliveryNote).pipe(
        map(response => response.data),
        tap((updatedDeliveryNote) => {
          console.log('updatedDeliveryNote', updatedDeliveryNote);
          const deliveryNotes = store.deliveryNotes().map(dn => 
            dn.referenceId === updatedDeliveryNote.referenceId ? updatedDeliveryNote : dn
          );
          patchState(store, { 
            deliveryNotes,
            loading: false 
          });
        }),
        catchError((error) => {
          patchState(store, { loading: false });
          return throwError(() => error);
        })
      );
    },

    deleteDeliveryNote(referenceId: string): Observable<void> {
      patchState(store, { loading: true });
      
      return deliveryNoteService.deleteDeliveryNote(referenceId).pipe(
        map(() => {
          const deliveryNotes = store.deliveryNotes().filter(dn => dn.referenceId !== referenceId);
          patchState(store, { 
            deliveryNotes,
            loading: false 
          });
        }),
        catchError((error) => {
          patchState(store, { loading: false });
          return throwError(() => error);
        })
      );
    },

    selectDeliveryNote(deliveryNote: DeliveryNote | null): void {
      patchState(store, { selectedDeliveryNote: deliveryNote });
    },
  })),
  withHooks({
    onInit(store) {
      // Load delivery notes on initialization
      store.loadDeliveryNotes().subscribe();
    },
  })
); 