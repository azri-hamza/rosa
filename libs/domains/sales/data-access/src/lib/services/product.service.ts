import { inject, Injectable } from '@angular/core';
import { ApiClient } from '@rosa/api-client';
import { Product } from '@rosa/types';
import { map } from 'rxjs/operators';

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiClient = inject(ApiClient);

  getProducts(page?: number, limit?: number, filter?: string, sort?: string, order?: 'ASC' | 'DESC') {
    let params = {};
    
    if (page !== undefined && limit !== undefined) {
      params = { page, limit };
    }

    if (filter !== undefined) {
      params = { ...params, filter };
    }

    if (sort !== undefined) {
      params = { ...params, sort };
    }

    if (order !== undefined) {
      params = { ...params, order };
    }

    return this.apiClient.get<PaginatedResponse<Product>>('products', { params });
  }

  getProduct(product_id: string) {
    return this.apiClient.get<Product>(`products/${product_id}`);
  }

  createProduct(product: Partial<Product>) {
    return this.apiClient.post<Product>('products', product);
  }

  updateProduct(product_id: string, product: Partial<Product>) {
    return this.apiClient.put<Product>(`products/${product_id}`, product);
  }

  deleteProduct(product_id: string) {
    return this.apiClient.delete<void>(`products/${product_id}`);
  }

  /**
   * Search products by name, code, or description for autocomplete.
   * Returns a limited list of products matching the filter.
   */
  searchProducts(term: string) {
    // Limit to 10 results for autocomplete
    return this.getProducts(1, 10, term).pipe(
      // Map to just the data array
      map(response => response.data)
    );
  }
}
