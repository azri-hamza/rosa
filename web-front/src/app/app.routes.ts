import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'quotes',
    loadComponent: () =>
      import('./quotes/quotes.component').then((m) => m.QuotesComponent),
  },
  {
    path: 'quotes/:id',
    loadComponent: () =>
      import('./quotes/quote-details/quote-details.component').then(
        (m) => m.QuoteDetailsComponent
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
