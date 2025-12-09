import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirmacion-modal',
  imports: [],
  templateUrl: './confirmacion-modal.html',
  styleUrl: './confirmacion-modal.css',
})
export class ConfirmacionModal {
 @Input() titulo: string = 'Confirmar acción';
  @Input() mensaje: string = '¿Estás segura de continuar?';
  @Input() textoConfirmar: string = 'Aceptar';
  @Input() textoCancelar: string = 'Cancelar';
  @Input() visible: boolean = false;

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
@Output() overlayClick = new EventEmitter<void>();

cerrarOverlay() {
  this.overlayClick.emit();
}

  onConfirmar() {
    this.confirmar.emit();
    this.visible = false;
  }

  onCancelar() {
    this.cancelar.emit();
    this.visible = false;
  }
}