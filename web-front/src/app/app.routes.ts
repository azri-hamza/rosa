import { Route } from '@angular/router';
import { LoginComponent } from '@rosa/auth';
import { authGuard, noAuthGuard } from '@rosa/auth';

export const appRoutes: Route[] = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [noAuthGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard],
  },
  {
    path: 'quotes',
    loadComponent: () =>
      import('./quotes/quotes.component').then((m) => m.QuotesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'quotes/:id',
    loadComponent: () =>
      import('./quotes/quote-details/quote-details.component').then(
        (m) => m.QuoteDetailsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'delivery-notes',
    loadComponent: () =>
      import('./delivery-notes/delivery-notes.component').then((m) => m.DeliveryNotesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/users-list/users-list.component').then((m) => m.UsersListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'products',
    loadChildren: () => 
      import('./products/products.routes').then((m) => m.PRODUCTS_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'clients',
    loadChildren: () => 
      import('./clients/clients.routes').then((m) => m.CLIENTS_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'vat',
    loadChildren: () => 
      import('./vat/vat.routes').then((m) => m.VAT_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
