import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { DeliveryNotesStore } from '@rosa/sales/data-access';
import { DeliveryNote } from '@rosa/types';
import { Signal } from '@angular/core';
import { DeliveryNoteFormComponent } from './delivery-note-form/delivery-note-form.component';
import { DeliveryNotesFilterComponent } from './delivery-notes-filter/delivery-notes-filter.component';
import { DeliveryNoteFilters } from '@rosa/sales/data-access';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { startOfWeek, endOfWeek } from 'date-fns';

@Component({
  selector: 'app-delivery-notes',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzTagModule,
    RouterModule,
    NzAutocompleteModule,
    NzMessageModule,
    DeliveryNotesFilterComponent,
  ],
  providers: [DeliveryNotesStore],
  templateUrl: './delivery-notes.component.html',
  styleUrl: './delivery-notes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryNotesComponent {
  private store = inject(DeliveryNotesStore);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);

  deliveryNotes = this.store.deliveryNotes as unknown as Signal<DeliveryNote[]>;
  loading = this.store.loading as unknown as Signal<boolean>;
  filters = this.store.filters as unknown as Signal<DeliveryNoteFilters>;

  constructor() {
    // Initialize with default filters (this week) using date-fns
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const defaultFilters: DeliveryNoteFilters = {
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
    };

    // Load delivery notes with default filters initially
    this.store.loadDeliveryNotes(defaultFilters);
  }

  onFiltersChange(filters: DeliveryNoteFilters) {
    this.store.setFilters(filters);
  }

  openDeliveryNoteForm(deliveryNote?: DeliveryNote) {
    this.modal
      .create({
        nzTitle: deliveryNote ? 'Edit Delivery Note' : 'New Delivery Note',
        nzContent: DeliveryNoteFormComponent,
        nzWidth: '80%',
        nzFooter: null,
        nzData: {
          deliveryNote: deliveryNote // Pass the delivery note to edit
        }
      })
      .afterClose.subscribe((result) => {
        if (result) {
          if (deliveryNote) {
            this.store.updateDeliveryNote({ ...result, referenceId: deliveryNote.referenceId }).subscribe({
              next: () => {
                this.message.success('Delivery note updated successfully');
              },
              error: (error) => {
                console.error('Error updating delivery note:', error);
                const errorMessage = error?.error?.message || error?.message || 'Failed to update delivery note. Please try again.';
                this.message.error(errorMessage);
              }
            });
          } else {
            this.store.createDeliveryNote(result).subscribe({
              next: () => {
                this.message.success('Delivery note created successfully');
              },
              error: (error) => {
                console.error('Error creating delivery note:', error);
                const errorMessage = error?.error?.message || error?.message || 'Failed to create delivery note. Please try again.';
                this.message.error(errorMessage);
              }
            });
          }
        }
      });
  }

  editDeliveryNote(deliveryNote: DeliveryNote) {
    this.openDeliveryNoteForm(deliveryNote);
  }

  deleteDeliveryNote(deliveryNote: DeliveryNote) {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this delivery note?',
      nzContent: `This action cannot be undone. Delivery Note #${deliveryNote.sequenceNumber} will be permanently deleted.`,
      nzOkText: 'Yes, delete',
      nzOkDanger: true,
      nzOnOk: () => {
        this.store.deleteDeliveryNote(deliveryNote.referenceId).subscribe({
          next: () => {
            this.message.success('Delivery note deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting delivery note:', error);
            const errorMessage = error?.error?.message || error?.message || 'Failed to delete delivery note. Please try again.';
            this.message.error(errorMessage);
          }
        });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'delivered':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'default';
    }
  }
} 