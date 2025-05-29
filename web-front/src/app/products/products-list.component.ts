import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { ProductFormComponent } from './add-edit-product/product-form.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ProductsStore } from '@rosa/sales/data-access';
import { Product } from '@rosa/types';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule, 
    NzTableModule, 
    NzButtonModule, 
    NzPaginationModule, 
    NzModalModule,
    NzSpinModule,
    NzIconModule,
    NzInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListComponent implements OnInit {
  private productsStore = inject(ProductsStore);
  private modal = inject(NzModalService);
  
  // Use the store signals directly
  readonly products = this.productsStore.products;
  readonly loading = this.productsStore.loading;
  readonly error = this.productsStore.error;
  readonly currentPage = this.productsStore.currentPage;
  readonly itemsPerPage = this.productsStore.itemsPerPage;
  readonly totalItems = this.productsStore.totalItems;
  readonly sort = this.productsStore.sort;
  readonly order = this.productsStore.order;
  
  filterControl = new FormControl('');
  
  ngOnInit() {
    // Set up filter subscription
    this.filterControl.valueChanges.pipe(
      debounceTime(300), // Wait for 300ms pause in typing
      distinctUntilChanged() // Only emit when value has changed
    ).subscribe(value => {
      this.productsStore.setFilter(value || '');
    });
  }

  onPageChange(page: number): void {
    this.productsStore.setPage(page);
  }

  onPageSizeChange(size: number): void {
    this.productsStore.setPageSize(size);
  }

  openNewProductModal(): void {
    const modal = this.modal.create({
      nzTitle: 'Ajouter un produit',
      nzContent: ProductFormComponent,
      nzFooter: null,
    });
    
    modal.afterClose.subscribe((result?: Partial<Product>) => {
      if (result) {
        this.productsStore.createProduct(result);
      }
    });
  }

  openEditProductModal(product: Product): void {
    const modal = this.modal.create<ProductFormComponent, Product, Partial<Product>>({
      nzTitle: 'Modifier le produit',
      nzContent: ProductFormComponent,
      nzFooter: null,
      nzData: product
    });
    
    modal.afterClose.subscribe((result?: Partial<Product>) => {
      if (result) {
        this.productsStore.updateProduct(product.productId, result);
      }
    });
  }

  // Add delete confirmation method
  confirmDelete(product: Product): void {
    this.modal.confirm({
      nzTitle: 'Êtes-vous sûr de vouloir supprimer ce produit?',
      nzContent: `Le produit "${product.name}" sera définitivement supprimé.`,
      nzOkText: 'Oui',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.productsStore.deleteProduct(product.productId),
      nzCancelText: 'Non'
    });
  }
  
  onQueryParamsChange(params: NzTableQueryParams): void {
    const { sort } = params;
    const currentSort = sort.find((item) => item.value !== null);
    const sortField = (currentSort && currentSort.key) || null;
    const sortOrder = (currentSort && currentSort.value) || null;
    // Only update if sort field or order has changed
    const storeSort = this.sort();
    const storeOrder = this.order();
    const mappedOrder = sortOrder === 'ascend' ? 'ASC' : sortOrder === 'descend' ? 'DESC' : null;
    if (sortField && mappedOrder && (storeSort !== sortField || storeOrder !== mappedOrder)) {
      this.productsStore.setSort(sortField, mappedOrder);
    }
    // Optionally, you can set a default sort if none is provided
    else if (!sortField && (storeSort !== 'name' || storeOrder !== 'ASC')) {
      this.productsStore.setSort('name', 'ASC');
    }
  }
}
