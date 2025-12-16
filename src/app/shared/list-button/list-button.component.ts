import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-button',
  standalone: true, // Indica que el componente es independiente
  imports: [CommonModule], // Importa CommonModule para habilitar ngClass
  template: `
    <button [ngClass]="{ 'darker-background': isAdded, 'lighter-background': !isAdded }" (click)="toggle()">
      {{ isAdded ? '-' : '+' }}
    </button>
    <span>{{ count }} café{{ count === 1 ? '' : 's' }}</span>
  `,
  styles: [
    `.darker-background { background-color: #5a5a5a; color: white; }`,
    `.lighter-background { background-color: #f0f0f0; color: black; }`
  ]
})
export class ListButtonComponent {
  @Input() isAdded: boolean = false;
  @Input() count: number = 0;
  @Output() toggleAction = new EventEmitter<void>();

  toggle(): void {
    this.toggleAction.emit();
  }
}