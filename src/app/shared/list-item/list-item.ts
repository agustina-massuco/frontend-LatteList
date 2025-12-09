import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface ListItem {
  image?: string; // Ahora es opcional
  title: string;
  description: string;
  action: string;
  inactive?: boolean; // Para usuarios inactivos
}

@Component({
  selector: 'app-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-item.html',
  styleUrls: ['./list-item.css']
})
export class ListItemComponent {
  @Input() item!: ListItem;
  @Output() itemClick = new EventEmitter<ListItem>();
  @Output() actionClick = new EventEmitter<ListItem>();

  constructor(private sanitizer: DomSanitizer) {}

  get safeAction(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.item.action);
  }

  onItemClick() {
    this.itemClick.emit(this.item);
  }

  onActionClick(event: Event) {
    event.stopPropagation(); // Evita que el click se propague al contenedor
    this.actionClick.emit(this.item);
  }
}
