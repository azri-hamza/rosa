import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NzTableModule, NzTableQueryParams } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { ClientsStore } from '@rosa/sales/data-access';
import { Client } from '@rosa/types';
import { ClientFormComponent } from '../client-form/client-form.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzModalModule,
    NzSpinModule,
    NzToolTipModule,
    NzAlertModule,
  ],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsListComponent implements OnInit {
  private clientsStore = inject(ClientsStore);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);

  // Store signals
  readonly clients = this.clientsStore.clients;
  readonly loading = this.clientsStore.loading;
  readonly loadingError = this.clientsStore.loadingError;
  readonly operationError = this.clientsStore.operationError;
  readonly currentPage = this.clientsStore.currentPage;
  readonly itemsPerPage = this.clientsStore.itemsPerPage;
  readonly totalItems = this.clientsStore.totalItems;
  readonly sort = this.clientsStore.sort;
  readonly order = this.clientsStore.order;

  filterControl = new FormControl('');

  ngOnInit() {
    // Set up filter subscription
    this.filterControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.clientsStore.setFilter(value || '');
    });
  }

  onPageChange(page: number): void {
    this.clientsStore.setPage(page);
  }

  onPageSizeChange(size: number): void {
    this.clientsStore.setPageSize(size);
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    const { sort } = params;
    const currentSort = sort.find((item) => item.value !== null);
    const sortField = (currentSort && currentSort.key) || null;
    const sortOrder = (currentSort && currentSort.value) || null;
    
    const storeSort = this.sort();
    const storeOrder = this.order();
    const mappedOrder = sortOrder === 'ascend' ? 'ASC' : sortOrder === 'descend' ? 'DESC' : null;
    
    if (sortField && mappedOrder && (storeSort !== sortField || storeOrder !== mappedOrder)) {
      this.clientsStore.setSort(sortField, mappedOrder);
    } else if (!sortField && (storeSort !== 'name' || storeOrder !== 'ASC')) {
      this.clientsStore.setSort('name', 'ASC');
    }
  }

  openNewClientModal(): void {
    const modal = this.modal.create({
      nzTitle: 'Add New Client',
      nzContent: ClientFormComponent,
      nzFooter: null,
      nzWidth: '600px',
    });

    modal.afterClose.subscribe((result) => {
      if (result) {
        this.clientsStore.createClient(result).subscribe({
          next: () => {
            this.message.success('Client created successfully');
          },
          error: (error) => {
            console.error('Error creating client:', error);
            const errorMessage = error?.error?.message || error?.message || 'Failed to create client. Please try again.';
            this.message.error(errorMessage);
          }
        });
      }
    });
  }

  openEditClientModal(client: Client): void {
    const modal = this.modal.create({
      nzTitle: 'Edit Client',
      nzContent: ClientFormComponent,
      nzData: { client },
      nzFooter: null,
      nzWidth: '600px',
    });

    modal.afterClose.subscribe((result) => {
      if (result) {
        this.clientsStore.updateClient(client.id, result).subscribe({
          next: () => {
            this.message.success('Client updated successfully');
          },
          error: (error) => {
            console.error('Error updating client:', error);
            const errorMessage = error?.error?.message || error?.message || 'Failed to update client. Please try again.';
            this.message.error(errorMessage);
          }
        });
      }
    });
  }

  confirmDeleteClient(client: Client): void {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this client?',
      nzContent: `This action cannot be undone. Client "${client.name}" will be permanently deleted.`,
      nzOkText: 'Yes, delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.clientsStore.deleteClient(client.id).subscribe({
          next: () => {
            this.message.success('Client deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting client:', error);
            // Try to extract the error message from the backend response
            const errorMessage = error?.error?.message || error?.message || 'Failed to delete client. Please try again.';
            this.message.error(errorMessage);
          }
        });
      }
    });
  }

  clearOperationError(): void {
    this.clientsStore.clearOperationError();
  }
} 