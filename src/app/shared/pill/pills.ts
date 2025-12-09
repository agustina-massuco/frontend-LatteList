import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pills.html',
  styleUrls: ['./pills.css']
})
export class PillsComponent {
  @Input() text: string = '';
  @Input() icon?: string; // Emoji icon opcional
  @Input() variant: 'tag' | 'badge' = 'badge'; // tag: estilo destacado con gradiente | badge: estilo secundario
  @Input() type: 'default' | 'open' | 'closed' | 'info' = 'default'; // Solo aplica a badges
}
