import { Routes } from '@angular/router';
import { ClientsListComponent } from './clients-list/clients-list.component';
import { ClientsStore } from '@rosa/sales/data-access';
import { authGuard } from '@rosa/auth';

export const CLIENTS_ROUTES: Routes = [
  {
    path: '',
    component: ClientsListComponent,
    providers: [
      ClientsStore,
    ],
    canActivate: [authGuard]
  }
]; 