import {
  patchState,
  signalStore,
  withMethods,
  withHooks,
  withState,
} from '@ngrx/signals';
import { Product } from '@rosa/types';
import { PaginatedResponse, ProductService } from '../services/product.service';
import { inject } from '@angular/core';

interface ProductsState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  filter?: string;
  sort: string | null;
  order: 'ASC' | 'DESC' | null;
}

const initialState: ProductsState = {
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  filter: '',
  sort: 'name',
  order: 'ASC',
};

export const ProductsStore = signalStore(
  withState(initialState),
  withMethods((store, productService = inject(ProductService)) => ({
    loadProducts(options: {
      page?: number;
      limit?: number;
      filter?: string;
      sort?: string;
      order?: 'ASC' | 'DESC';
    } = {}) {
      const {
        page,
        limit,
        filter,
        sort,
        order,
      } = options;

      // Use state values as fallback
      const pageToLoad = page ?? store.currentPage?.();
      const limitToLoad = limit ?? store.itemsPerPage?.();
      const filterToLoad = filter ?? store.filter?.();
      const sortToLoad = sort ?? store.sort?.();
      const orderToLoad = order ?? store.order?.();

      patchState(store, { loading: true, error: null });
      productService
        .getProducts(
          pageToLoad,
          limitToLoad,
          filterToLoad,
          sortToLoad ?? undefined,
          orderToLoad ?? undefined
        )
        .subscribe({
          next: (response: PaginatedResponse<Product>) => {
            patchState(store, {
              products: response.data,
              totalItems: response.count,
              loading: false,
            });
          },
          error: (error) => {
            console.error('Error loading products:', error);
            patchState(store, {
              loading: false,
              error: error.message || 'Error loading products',
            });
          },
        });
    },

    setPage(page: number) {
      if (store.currentPage() === page) {
        return; // No change, do nothing
      }
      patchState(store, { currentPage: page });
      this.loadProducts({ page });
    },

    setPageSize(limit: number) {
      if (store.itemsPerPage() === limit) {
        return; // No change, do nothing
      }
      patchState(store, {
        itemsPerPage: limit,
        currentPage: 1, // Reset to first page when changing page size
      });
      this.loadProducts({ limit });
    },

    setSort(sort: string, order: 'ASC' | 'DESC') {
      if (store.sort?.() === sort && store.order?.() === order) {
        return; // No change, do nothing
      }
      patchState(store, { sort, order });
      this.loadProducts({
        page: 1,
        limit: store.itemsPerPage?.(),
        filter: store.filter?.(),
        sort,
        order,
      });
    },

    setFilter(text: string) {
      if (store.filter?.() === text) {
        return; // No change, do nothing
      }
      patchState(store, { filter: text });
      this.loadProducts({
        page: 1,
        limit: store.itemsPerPage?.(),
        filter: text,
        sort: store.sort?.() ?? undefined,
        order: store.order?.() ?? undefined,
      });
    },
    loadProduct(id: string) {
      patchState(store, { loading: true, error: null });
      productService.getProduct(id).subscribe({
        next: (product) => {
          console.log('Product loaded:', product);
          patchState(store, { selectedProduct: product, loading: false });
        },
        error: (error) => {
          console.error('Error loading product:', error);
          patchState(store, {
            loading: false,
            error: error.message || 'Error loading product',
          });
        },
      });
    },

    createProduct(product: Partial<Product>) {
      patchState(store, { loading: true, error: null });
      productService.createProduct(product).subscribe({
        next: (newProduct) => {
          // After creating a product, reload the current page to show updated data
          this.loadProducts();
          patchState(store, { loading: false });
        },
        error: (error) => {
          console.error('Error creating product:', error);
          patchState(store, {
            loading: false,
            error: error.message || 'Error creating product',
          });
        },
      });
    },

    updateProduct(productId: string, product: Partial<Product>) {
      patchState(store, { loading: true, error: null });
      productService.updateProduct(productId, product).subscribe({
        next: (updatedProduct) => {
          const currentProducts = [...store.products()];
          const productIndex = currentProducts.findIndex(
            (p) => p.productId === productId
          );

          if (productIndex !== -1) {
            currentProducts[productIndex] = updatedProduct;
          }

          patchState(store, {
            products: currentProducts,
            selectedProduct: updatedProduct,
            loading: false,
          });
        },
        error: (error) => {
          console.error('Error updating product:', error);
          patchState(store, {
            loading: false,
            error: error.message || 'Error updating product',
          });
        },
      });
    },

    deleteProduct(id: string) {
      patchState(store, { loading: true, error: null });
      productService.deleteProduct(id).subscribe({
        next: () => {
          // After deleting, reload the current page
          this.loadProducts();
          patchState(store, { loading: false });
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          patchState(store, {
            loading: false,
            error: error.message || 'Error deleting product',
          });
        },
      });
    },
  })),
  withHooks({
    onInit: (store) => {
      store.loadProducts();
    },
  })
);
