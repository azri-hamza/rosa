import { Routes } from '@angular/router';
import { ProductsListComponent } from './products-list.component';
import { ProductsStore } from '@rosa/sales/data-access';
import { authGuard } from '@rosa/auth';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    component: ProductsListComponent,
    providers: [
      ProductsStore,
    ],
    canActivate: [authGuard]
  }
]; 