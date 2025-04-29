import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'quote',
    loadComponent: () =>
      import('./quote/quote.component').then((m) => m.QuoteComponent),
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
