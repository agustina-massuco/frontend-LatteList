import { Component, OnInit, ViewChild, computed, effect, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinWheelComponent } from '../../../../shared/spin-wheel/spin-wheel';
import { ConfirmacionModal } from '../../../../shared/confirmacion-modal/confirmacion-modal';
import { CafeService } from '../../service/cafeService';
import Cafe from '../../model/CafeModel';
import { Router } from '@angular/router';


@Component({
  selector: 'app-descubrir',
  imports: [CommonModule, SpinWheelComponent, ConfirmacionModal],
  templateUrl: './descubrir.html',
  styleUrl: './descubrir.css',
})
export class Descubrir implements OnInit {
  @ViewChild(SpinWheelComponent) spinWheelComponent!: SpinWheelComponent;
  @Output() cafeSelected = new EventEmitter<{ id: string; nombre: string }>();

  cafes = signal<Cafe[]>([]);
 
  cafeteriasReducidas = computed(() => {
    return this.cafes().map(c => ({
      id: c.id!,
      nombre: c.nombre
    }));
  });

 visibleModal = signal(false);
   selectedCafe: { id: string; nombre: string } | null = null;

  constructor(private cafeService: CafeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cafeService.getAllCafes().subscribe({
      next: (cafes) => {
        this.cafes.set(cafes);

      },
      error: (err) => console.error('Error cargando cafés:', err)
    });
  }

  onCafeSelected(cafe: { id: string; nombre: string }) {
    console.log('☕ Café seleccionado:', cafe);
    this.selectedCafe = cafe;
    this.visibleModal.set(true);
  }

  onConfirmar() {
    if (!this.selectedCafe) return;
    this.visibleModal.set(false);
    const id = this.selectedCafe.id;
     this.router.navigate(['/cafes', id]);
  }

  onVolverATirar() {
    this.visibleModal.set(false);
    setTimeout(() => {
      this.spinWheelComponent.spin(); 
    }, 300);
  }

  cerrarModal() {
  this.visibleModal.set(false);
}
}
