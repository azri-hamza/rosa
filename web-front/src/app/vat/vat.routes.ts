import { Routes } from '@angular/router';
import { VatListComponent } from './vat-list/vat-list.component';
import { authGuard } from '@rosa/auth';

export const VAT_ROUTES: Routes = [
  {
    path: '',
    component: VatListComponent,
    canActivate: [authGuard]
  }
]; 