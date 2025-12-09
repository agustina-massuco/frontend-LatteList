import { Component, Input, Output, EventEmitter, HostListener, signal, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-drawer.component.html',
  styleUrls: ['./modal-drawer.component.css']
})
export class ModalDrawerComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();

  isMobile = signal(false);

  constructor() {
    this.checkScreenSize();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']) {
      if (this.isOpen) {
        // Bloquear scroll del body cuando el modal se abre
        document.body.style.overflow = 'hidden';
      } else {
        // Restaurar scroll del body cuando el modal se cierra
        document.body.style.overflow = '';
      }
    }
  }

  ngOnDestroy() {
    // Asegurar que el scroll se restaure si el componente se destruye con el modal abierto
    document.body.style.overflow = '';
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  onClose() {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
