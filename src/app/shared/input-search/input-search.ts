import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input-search.html',
  styleUrls: ['./input-search.css']
})
export class InputSearchComponent {
  @Input() placeholder: string = 'Buscar cafés...';
  @Output() search = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();
  
  searchValue = '';

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchValue = target.value;
    this.search.emit(this.searchValue);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.clearSearch();
    } else if (event.key === 'Enter') {
      this.searchSubmit.emit(this.searchValue);
    }
  }

  clearSearch() {
    this.searchValue = '';
    this.search.emit('');
    this.searchSubmit.emit('');
  }

  // Método público para limpiar desde el padre
  clear() {
    this.clearSearch();
  }
}
