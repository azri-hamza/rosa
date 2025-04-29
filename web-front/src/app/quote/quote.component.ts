import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quote',
  imports: [CommonModule],
  templateUrl: './quote.component.html',
  styleUrl: './quote.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteComponent {}
