import { inject, Injectable } from '@angular/core';
import { ApiClient } from '@rosa/api-client';
import { DeliveryNote, Response } from '@rosa/types';
import { Observable } from 'rxjs';

export interface DeliveryNoteFilters {
  clientId?: number;
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'delivered' | 'cancelled';
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryNoteService {
  private apiClient = inject(ApiClient);

  getDeliveryNotes(filters?: DeliveryNoteFilters): Observable<Response<DeliveryNote[]>> {
    const params = new URLSearchParams();
    
    if (filters?.clientId) {
      params.append('clientId', filters.clientId.toString());
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }

    const queryString = params.toString();
    const url = queryString ? `sales/delivery-notes?${queryString}` : 'sales/delivery-notes';
    
    return this.apiClient.get(url);
  }

  getDeliveryNote(id: string): Observable<Response<DeliveryNote>> {
    return this.apiClient.get(`sales/delivery-notes/${id}`);
  }

  createDeliveryNote(deliveryNote: Partial<DeliveryNote>): Observable<Response<DeliveryNote>> {
    return this.apiClient.post('sales/delivery-notes', deliveryNote);
  }

  updateDeliveryNote(id: string, deliveryNote: Partial<DeliveryNote>): Observable<Response<DeliveryNote>> {
    return this.apiClient.put(`sales/delivery-notes/${id}`, deliveryNote);
  }

  deleteDeliveryNote(id: string): Observable<void> {
    return this.apiClient.delete(`sales/delivery-notes/${id}`);
  }

  downloadDeliveryNotePDF(id: string) {
    return this.apiClient.getBlob(`sales/delivery-notes/${id}/pdf`);
  }
} 