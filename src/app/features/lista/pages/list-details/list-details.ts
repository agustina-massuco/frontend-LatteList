import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ListService } from '../../service/list-service';
import List from '../../model/List';
import Cafe from '../../../cafes/model/CafeModel'; 
import { catchError, of, switchMap, tap } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { ToastService } from '../../../../core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { PillsComponent } from '../../../../shared/pill/pills';
import { ConfirmacionModal } from '../../../../shared/confirmacion-modal/confirmacion-modal'; 
import { AuthService } from '../../../../core/services/auth-service'; 
import { CafeService } from '../../../cafes/service/cafeService';
import { IconComponent } from '../../../../shared/Icons/app-icon-componet';
import { PaginatorComponent } from '../../../../shared/paginator/paginator';
import { ListItemComponent } from '../../../../shared/list-item/list-item';


@Component({
  selector: 'app-list-details',
  standalone: true,
  imports: [RouterLink, DatePipe, CommonModule, FormsModule, PillsComponent, ConfirmacionModal, IconComponent, PaginatorComponent, ListItemComponent],
  templateUrl: './list-details.html',
  styleUrl: './list-details.css',
})
export class ListDetails implements OnInit {
 
  list: List | undefined;
  cafes: Cafe[] = [];
  errorMessage: string = '';
  loading: boolean = true;
  
  isOwner: boolean = false;
  clonar: boolean = false;
 
  menuCafeAbiertoId: string | number | null = null;
  editandoNombre: boolean = false;
  nombreListaEditado: string = '';
  mostrarConfirmacionNombre: boolean = false;
  mostrarConfirmacionEliminar: boolean = false;

  paginaActual = signal(1);
  cafesPorPagina = 10;
  cafesPaginados = signal<Cafe[]>([]);
  totalPaginas = signal(1);

  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listService: ListService,
    private cafeService: CafeService,
    private tostada: ToastService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.route.params.pipe(
      tap(() => {
        console.log('🔄 Iniciando carga - reseteando this.list');
        this.loading = true;
        this.errorMessage = '';
        this.list = undefined; 
      }),
      switchMap(params => {
        const listId = Number(params['id']);
        if (!listId) {
          this.errorMessage = 'ID inválido.';
          this.loading = false; 
          return of(null);
        }
        return this.listService.getListById(listId);
      }),
      switchMap((list: List | null) => {
        if (!list) {
          if (!this.errorMessage) this.errorMessage = 'Lista no encontrada.';
          return of([]);
        }

        this.list = list;
        this.nombreListaEditado = list.nombre;
        console.log('📝 Lista asignada:', this.list);

        const currentUser = this.authService.getUserFromToken();
        const listOwnerId = list.idUser ? String(list.idUser) : null;
        const currentUserId = currentUser?.id ? String(currentUser.id) : null;

        console.log('🔍 DEBUG isOwner:');
        console.log('  - currentUser:', currentUser);
        console.log('  - currentUserId:', currentUserId);
        console.log('  - list.idUser:', list.idUser);
        console.log('  - listOwnerId:', listOwnerId);
        
        this.isOwner = currentUserId !== null && listOwnerId !== null && currentUserId === listOwnerId;
        console.log('  - isOwner result:', this.isOwner);

        if (!list.idCafes || list.idCafes.length === 0) {
            console.log('⚠️ Lista sin cafés, retornando array vacío. this.list aún existe:', !!this.list);
            return of([]);
        }
        
        console.log('📞 Llamando getCafesByIds. this.list existe:', !!this.list);
        return this.cafeService.getCafesByIds(list.idCafes.map(Number));
      }),
      catchError(error => {
        console.error('Error en carga:', error); 
        if (error.status === 403) {
            this.errorMessage = 'Acceso denegado: Esta lista es privada o fue eliminada.';
        } else {
            this.errorMessage = 'Error de carga.';
        }
        this.tostada.error(this.errorMessage);
        this.loading = false; 
        return of([]);
      })
    ).subscribe((cafes: any) => {
      this.cafes = Array.isArray(cafes) ? cafes : [];
      this.actualizarPaginacion();
      this.loading = false;
      console.log('✅ Carga completa - loading:', this.loading, 'list:', this.list, 'isOwner:', this.isOwner);
    });

    document.addEventListener('click', (event) => {
        if (!(event.target as HTMLElement).closest('.menu-acciones-cafe')) this.menuCafeAbiertoId = null;
    });
  }

  clonarLista() {
      if(!this.list) return;
      this.clonar = true;
      this.listService.cloneList(this.list.id).subscribe({
          next: (newList) => {
              this.tostada.success('¡Lista guardada en tu perfil!');
              this.router.navigate(['/lista', newList.id]); 
          },
          error: () => {
              this.tostada.error('Error al clonar lista');
              this.clonar = false;
          }
      });
  }

   marcarComoVisitado(cafeId: number | string | undefined): void {
    if (!cafeId || !this.list) return;

    this.cerrarMenuCafe(); 

    const cafeIdNum = Number(cafeId);
    const visitados = this.list.idCafesVisitados || [];
    
    const yaVisitado = visitados.some(id => Number(id) === cafeIdNum);
    
    let nuevosVisitados: number[];
    let mensaje: string;
    let tipo: 'success' | 'info';

    if (yaVisitado) {
      nuevosVisitados = visitados.filter(id => Number(id) !== cafeIdNum);
      mensaje = 'Marca de "Visitado" eliminada.';
      tipo = 'info';
    } else {
      nuevosVisitados = [...visitados, cafeIdNum];
      mensaje = '¡Marcado como visitado! ¡Gran café!';
      tipo = 'success';
    }

    const listaActualizada: List = {
        ...this.list,
        idCafesVisitados: nuevosVisitados,
    };
    
    this.listService.putList(listaActualizada).subscribe({
        next: (res) => {
            this.list = res; 
            this.tostada.show(mensaje, tipo);
        },
        error: (err) => {
            console.error('Error al guardar estado de visitado:', err);
            this.tostada.show(`Error al guardar: ${err.message}`, 'error');
        }
    });
  }

  esVisitado(cafeId: string | number | undefined): boolean {
    if (!cafeId || !this.list) return false;
    const visitados = this.list.idCafesVisitados || [];
    return visitados.some(id => String(id) === String(cafeId));
  }

  toggleMenuCafe(cafeId: string | number): void {
    this.menuCafeAbiertoId = this.menuCafeAbiertoId === cafeId ? null : cafeId;
  }

  cerrarMenuCafe(): void {
    this.menuCafeAbiertoId = null;
  }

  eliminarCafeDeLista(cafeId: number | string | undefined): void {
    if (!cafeId || !this.list) return;

    this.cerrarMenuCafe();

    const cafeIdNum = Number(cafeId);
    const nuevosCafes = this.list.idCafes.filter(id => Number(id) !== cafeIdNum);
    const nuevosVisitados = (this.list.idCafesVisitados || []).filter(id => Number(id) !== cafeIdNum);

    const listaActualizada: List = {
      ...this.list,
      idCafes: nuevosCafes,
      idCafesVisitados: nuevosVisitados,
    };

    this.listService.putList(listaActualizada).subscribe({
      next: (res) => {
        this.list = res;
        this.cafes = this.cafes.filter(cafe => Number(cafe.id) !== cafeIdNum);
        this.actualizarPaginacion();
        this.tostada.info('Café eliminado de la lista');
      },
      error: (err) => {
        console.error('Error al eliminar café:', err);
        this.tostada.error('Error al eliminar el café');
      }
    });
  }

  cancelarEdicion(): void {
    this.editandoNombre = false;
    this.nombreListaEditado = this.list?.nombre || '';
  }

  iniciarEdicionNombre(): void {
    if (!this.list) return;
    this.editandoNombre = true;
    this.nombreListaEditado = this.list.nombre;
  }

  manejarKeypress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.confirmarCambioNombre();
    } else if (event.key === 'Escape') {
      this.cancelarEdicion();
    }
  }

  confirmarCambioNombre(): void {
    if (!this.list) return;

    const nuevoNombre = this.nombreListaEditado.trim();

    if (nuevoNombre === this.list.nombre || nuevoNombre.length === 0) {
      this.cancelarEdicion();
      return;
    }

    this.mostrarConfirmacionNombre = true;
  }

  confirmarGuardarNombre(): void {
    this.mostrarConfirmacionNombre = false;
    this.guardarNombre();
  }

  cancelarGuardarNombre(): void {
    this.mostrarConfirmacionNombre = false;
    this.cancelarEdicion();
  }

  guardarNombre(): void {
    if (!this.list) return;

    const nuevoNombre = this.nombreListaEditado.trim();

    if (nuevoNombre === this.list.nombre || nuevoNombre.length === 0) {
      this.cancelarEdicion();
      return;
    }

    const listaActualizada: List = {
      ...this.list,
      nombre: nuevoNombre,
    };

    this.listService.putList(listaActualizada).subscribe({
      next: (res) => {
        this.list = res; 
        this.editandoNombre = false;
        this.tostada.show(`Nombre de lista actualizado a "${res.nombre}"`, 'success');
      },
      error: (err) => {
        console.error('Error al guardar nombre:', err);
        this.tostada.show(`Error al guardar: ${err.message}`, 'error');
        this.editandoNombre = true; 
      },
    });
  }

  removerCafeDeLista(cafeId: number | string | undefined): void {
    if (!this.list || !cafeId) return;

    const cafeNombre = this.cafes.find(c => String(c.id) === String(cafeId))?.nombre || 'Café';

    const cafeIdNum = Number(cafeId);
    const nuevosIdCafes = this.list.idCafes.filter(id => Number(id) !== cafeIdNum);
    
    const listaActualizada: List = {
      ...this.list,
      idCafes: nuevosIdCafes,
    };

    this.listService.putList(listaActualizada).subscribe({
      next: (res) => {
        this.list = res; 
        
        this.cafes = this.cafes.filter(c => String(c.id) !== String(cafeId)); 
        
        this.tostada.show(`"${cafeNombre}" removido de la lista "${res.nombre}".`, 'success');
      },
      error: (err) => {
        console.error('Error al remover café:', err);
        this.tostada.show(`Error al remover "${cafeNombre}": ${err.message}`, 'error');
      },
    });
    this.actualizarPaginacion();
  }

  confirmarEliminarLista(): void {
    this.mostrarConfirmacionEliminar = true;
  }

  cancelarEliminarLista(): void {
    this.mostrarConfirmacionEliminar = false;
  }

  eliminarLista(): void {
    if (!this.list) return;

    this.listService.deleteList(this.list.id).subscribe({
      next: () => {
        this.tostada.success('Lista eliminada correctamente');
        this.router.navigate(['/lista']);
      },
      error: (err) => {
        console.error('Error al eliminar lista:', err);
        this.tostada.error('Error al eliminar la lista');
        this.mostrarConfirmacionEliminar = false;
      }
    });
  }

  actualizarPaginacion() {
    const totalPags = Math.ceil(this.cafes.length / this.cafesPorPagina);
    this.totalPaginas.set(totalPags);
    
    const inicio = (this.paginaActual() - 1) * this.cafesPorPagina;
    const fin = inicio + this.cafesPorPagina;
    this.cafesPaginados.set(this.cafes.slice(inicio, fin));
  }

  onPageChange(direction: 'next' | 'previous') {
    if (direction === 'next' && this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update(p => p + 1);
    } else if (direction === 'previous' && this.paginaActual() > 1) {
      this.paginaActual.update(p => p - 1);
    }
    this.actualizarPaginacion();
  }

  onCafeClick(cafeId: string | number) {
    this.router.navigate(['/cafes', cafeId]);
  }

}