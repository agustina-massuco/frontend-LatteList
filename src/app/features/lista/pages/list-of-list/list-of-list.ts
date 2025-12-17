import { Component, computed, OnInit, signal, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ListService } from '../../service/list-service';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalDrawerComponent } from '../../../../shared/modal-drawer/modal-drawer.component';
import { ConfirmacionModal } from '../../../../shared/confirmacion-modal/confirmacion-modal';
import { InputSearchComponent } from '../../../../shared/input-search/input-search';
import { PaginatorComponent } from '../../../../shared/paginator/paginator';
import Cafe from '../../../cafes/model/CafeModel';
import { CafeService } from '../../../cafes/service/cafeService';
import List from '../../model/List';
import { IconComponent } from '../../../../shared/Icons/app-icon-componet';
import { AuthService } from '../../../../core/services/auth-service';

@Component({
  selector: 'app-list-of-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, 
    ModalDrawerComponent, ConfirmacionModal, 
    InputSearchComponent, PaginatorComponent,
    IconComponent
  ],
  templateUrl: './list-of-list.html',
  styleUrl: './list-of-list.css',
})
export class ListOfList implements OnInit {
  @ViewChild('searchInput') searchInputComponent!: InputSearchComponent;

  loading: boolean = true;
  error: string | null = null;
  cafeNamesMap = signal<Map<string, string>>(new Map());

  viewMode = signal<'mias' | 'explorar'>('mias');

  search = signal('');
  tempSearchTerm = signal('');
  page = signal(1);
  pageSize = 6; 

  // --- MODALES ---
  isModalOpen = signal(false);
  newListName = signal('');
  crearList = signal(false);
  isDeleteModalOpen = signal(false);
  listIdToDelete = signal<number | null>(null);
  listNameToDelete = signal<string>('');


  constructor(
    public listSer: ListService,
    private cafeSer: CafeService,
    private tostada: ToastService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cafeSer.getAllCafes().subscribe({
      next: (cafes: Cafe[]) => {
        const map = new Map<string, string>();
        cafes.forEach(c => { if (c.id) map.set(c.id.toString(), c.nombre); });
        this.cafeNamesMap.set(map);
        
        this.cargarMisListas();
      },
      error: (err) => {
        this.error = 'Error al cargar cafés.';
        this.loading = false;
      }
    });
  }

  cargarMisListas() {
      this.listSer.getUserLists().subscribe({
          next: () => this.loading = false,
          error: (err) => { this.error = 'Error cargando listas'; this.loading = false; }
      });
  }

  setViewMode(mode: 'mias' | 'explorar') {
    this.viewMode.set(mode);
    this.clearSearch();
    
    if (mode === 'explorar' && this.listSer.publicLists().length === 0) {
        this.loading = true;
        this.listSer.getPublicLists().subscribe({
            next: () => this.loading = false,
            error: () => { this.loading = false; this.tostada.show('Error cargando comunidad', 'error'); }
        });
    }
  }

  filteredLists = computed(() => {
      const mode = this.viewMode();
      const source = mode === 'mias' ? this.listSer.userLists() : this.listSer.publicLists();
      const term = this.search().toLowerCase();

      return source.filter(l => {
          if (!term) return true;
          return l.nombre.toLowerCase().includes(term) || 
                 (l.userNombre && l.userNombre.toLowerCase().includes(term));
      });
  });

  paginatedLists = computed(() => {
      const all = this.filteredLists();
      const start = (this.page() - 1) * this.pageSize;
      return all.slice(start, start + this.pageSize);
  });
  
  listsWithDetails = computed(() => {
    const cafeMap = this.cafeNamesMap();
    return this.paginatedLists().map((list: List) => {
      const count = list.idCafes ? list.idCafes.length : 0;
      const cafeNames = list.idCafes
        ? list.idCafes.map(id => cafeMap.get(id.toString())).filter(n => !!n).slice(0, 3).join(', ')
        : '';

      return {
        ...list,
        cafeCount: list.cafeTotal || count,
        cafeNamesPreview: cafeNames
      };
    });
  });

  totalPages = computed(() => Math.ceil(this.filteredLists().length / this.pageSize));

  sugerencias = computed(() => {
    const term = this.tempSearchTerm().toLowerCase();
    if (!term) return [];
    
    const mode = this.viewMode();
    const source = mode === 'mias' ? this.listSer.userLists() : this.listSer.publicLists();
    
    return source
      .filter(l => l.nombre.toLowerCase().includes(term) || 
                   (l.userNombre && l.userNombre.toLowerCase().includes(term)))
      .slice(0, 5);
  });

  onSearchInput(term: string) { this.tempSearchTerm.set(term); } 
  onSearchSubmit(term: string) { 
      this.search.set(term); 
      this.page.set(1); 
  }

  seleccionarSugerencia(lista: List) {
    this.tempSearchTerm.set('');
    this.search.set('');
    if (this.searchInputComponent) this.searchInputComponent.clear();
    this.router.navigate(['/lista', lista.id]);
  }


  clearSearch() {
      this.search.set('');
      this.tempSearchTerm.set('');
      if(this.searchInputComponent) this.searchInputComponent.clear();
      this.page.set(1);
  }

  esListaMia(lista: List): boolean {
    const currentUser = this.authService.getUserFromToken();
    if (!currentUser?.id || !lista.idUser) return false;
    return String(currentUser.id) === String(lista.idUser);
  }

  onPageChange(dir: 'next' | 'previous') {
      if (dir === 'next' && this.page() < this.totalPages()) this.page.update(p => p + 1);
      if (dir === 'previous' && this.page() > 1) this.page.update(p => p - 1);
  }

  toggleVisibility(list: List) {
      const newState = !list.publica;
      this.listSer.toggleVisibility(list.id, newState).subscribe({
          next: () => this.tostada.show(newState ? 'Tu lista ahora es pública' : 'Tu lista ahora es privada', 'success'),
          error: () => this.tostada.show('Error al cambiar visibilidad', 'error')
      });
  }




  openCreateModal() { 
    this.isModalOpen.set(true); 
    this.newListName.set(''); 
  }

  closeModal() { 
    this.isModalOpen.set(false); 
    this.newListName.set(''); 
    this.crearList.set(false);
   }
  
  saveNewList() {
      const name = this.newListName().trim();
      if (!name) return;
      this.crearList.set(true);
      this.listSer.postList(name).subscribe({
          next: () => {
              this.crearList.set(false);
              this.closeModal();
              this.tostada.show('Lista creada', 'success');
              if(this.viewMode() === 'explorar') this.setViewMode('mias');
          },
          error: () => { this.crearList.set(false); this.tostada.show('Error', 'error'); }
      });
  }

  openDeleteModal(id: number) { this.listIdToDelete.set(id); this.isDeleteModalOpen.set(true); }
  onConfirmDelete() { 
      const id = this.listIdToDelete();
      if(!id) return;
      this.listSer.deleteList(id).subscribe({
          next: () => {
              this.tostada.show('Eliminada', 'success');
              this.isDeleteModalOpen.set(false);
          },
          error: () => this.tostada.show('Error', 'error')
      });
  }
  onCancelDelete() { this.isDeleteModalOpen.set(false); }
}


/*@Component({
  selector: 'app-list-of-list',
  imports: [CommonModule, RouterLink, FormsModule, ModalDrawerComponent, ConfirmacionModal],
  templateUrl: './list-of-list.html',
  styleUrl: './list-of-list.css',
})
export class ListOfList implements OnInit {

  loading: boolean = true;
  error: string | null = null;
  cafeNamesMap = signal<Map<string, string>>(new Map());
  userLists: any;
  
  isModalOpen = signal(false);
  newListName = signal('');
  creatingList = signal(false);

  isDeleteModalOpen = signal(false); 
  listIdToDelete = signal<number | null>(null);
  listNameToDelete = signal<string>('');

  listsWithDetails = computed(() => {
    const lists = this.userLists();
    const cafeMap = this.cafeNamesMap();

    return lists.map((list: List) => {
      const count = list.idCafes.length; 
      
      const cafeNames = list.idCafes
        .map(id => cafeMap.get(id.toString())) 
        .filter((name): name is string => !!name)
        .slice(0, 3)
        .join(', ');

      return {
        ...list,
        cafeCount: list.cafeTotal || count, 
        cafeNamesPreview: cafeNames
      };
    });
  });


  constructor(
    public listSer: ListService,
    private cafeSer: CafeService,
    private tostada: ToastService
  ) {
    
  }


  ngOnInit(): void {
    
    this.userLists = this.listSer.userLists;
  
    this.cafeSer.getAllCafes().subscribe({
      next: (cafes: Cafe[]) => {
        const map = new Map<string, string>();
        cafes.forEach(c => {
            if (c.id) {
                map.set(c.id.toString(), c.nombre);
            }
        });
        this.cafeNamesMap.set(map); 
        
        this.listSer.getUserLists().subscribe({
          next: () => {
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Error al cargar tus listas.';
            this.loading = false;
            console.error(err);
          }
        });
      },
      error: (err) => {
        this.error = 'Error al cargar los datos de los cafés.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  
  
 formatearFecha(isoString: string): string {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString();
    } catch {
      return 'Fecha Inválida';
    }
  }

  openCreateModal() {
    this.isModalOpen.set(true);
    this.newListName.set('');
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.newListName.set('');
    this.creatingList.set(false);
  }

  saveNewList() {
    const name = this.newListName().trim();
    if (!name) return;

    this.creatingList.set(true);
    
    this.listSer.postList(name).subscribe({
      next: () => {
        this.creatingList.set(false);
        this.closeModal();
        this.tostada.show('Lista creada con éxito', 'success');
      },
      error: (err) => {
        console.error('Error al crear:', err);
        this.creatingList.set(false);
        this.tostada.show('Error al crear la lista', 'error');
      }
    });
  }
 


openDeleteModal(listId: number): void {
    const listToDelete = this.listsWithDetails().find((l: List) => l.id === listId);
    
    if (listToDelete) {
      this.listIdToDelete.set(listId);
      this.listNameToDelete.set(listToDelete.nombre);
      this.isDeleteModalOpen.set(true);
    }
  }

 
onConfirmDelete(): void { 
    const id = this.listIdToDelete();
    this.isDeleteModalOpen.set(false);
    
    if (id === null) return; 

    const listName = this.listNameToDelete();
    
    this.listSer.deleteList(id).subscribe({
      next: () => {
        this.tostada.show(`Lista "${listName}" eliminada.`, 'success');
        this.listIdToDelete.set(null);
        this.listNameToDelete.set('');
      },
      error: (err) => {
        this.tostada.show('Error al eliminar.', 'error');
      }
    });
  }

 onCancelDelete(): void { 
    this.isDeleteModalOpen.set(false);
    this.listIdToDelete.set(null);
    this.listNameToDelete.set('');
  }

}*/


/*
<div class="list-container">
    <div class="list-header">
    <h2>Mis Listas de Cafés</h2>

    <button (click)="openCreateModal()" class="btn-create-list">
        Crear Nueva Lista
    </button>
    </div>
    
    <hr>

    @if (loading) {
        <p class="loading-message">Cargando listas y detalles de cafés...</p>
    } @else if (error) {
        <p class="error-message">Error: {{ error }}</p>
    } @else {
        
        @if (listsWithDetails().length === 0) {
            <p class="empty-message">Aún no tienes listas creadas. ¡Empieza a guardar tus cafés favoritos!</p>
            } @else {
            
            <div class="list-cards-grid">
                @for (list of listsWithDetails(); track list.id) {
                    
                    <div class="list-card" [routerLink]="['/lista/', list.id]">
                        
                        <div class="list-header">
                            <h3 class="list-name">{{ list.nombre }}</h3>
                            
                            <span class="list-date">
                                Creada: {{ formatearFecha(list.fechaCreacion) }}
                            </span>
                        </div>
                        
                        <div class="list-stats">
                            <p class="cafe-count">
                                {{ list.cafeCount }} {{ list.cafeCount === 1 ? 'Café' : 'Cafés' }}
                            </p>
                            
                            @if (list.cafeNamesPreview) {
                                <p class="cafe-preview">
                                    Cafés: {{ list.cafeNamesPreview }}
                                </p>
                            } @else {
                                <p class="cafe-preview">
                                    Aún no se han añadido cafés.
                                </p>
                            }
                        </div>
                        
                        <span class="view-details-prompt">Abrir Lista </span>

                        <button class="btn-delete-list" title="Eliminar lista" (click)="$event.stopPropagation(); openDeleteModal(list.id)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                </svg>
            </button>
                    </div>
                }
            </div>
        }
    }
</div>
<!-- Modal para crear nueva lista -->
<app-modal-drawer [isOpen]="isModalOpen()" [title]="'Crear Nueva Lista'" (close)="closeModal()">
  <div class="modal-content-wrapper">
    <div class="create-form-container">
      <input 
        type="text" 
        class="list-name-input" 
        placeholder="Nombre de la lista"
        [(ngModel)]="newListName"
        [disabled]="creatingList()"
        (keyup.enter)="saveNewList()"
        autofocus
      />
      <div class="form-buttons">
        <button 
          class="save-btn" 
          (click)="saveNewList()"
          [disabled]="creatingList() || !newListName().trim()"
        >
          @if (creatingList()) {
            <span>Guardando...</span>
          } @else {
            <span>Guardar</span>
          }
        </button>
        <button 
          class="cancel-btn" 
          (click)="closeModal()"
          [disabled]="creatingList()"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</app-modal-drawer>


<app-confirmacion-modal
  [visible]="isDeleteModalOpen()"
  [titulo]="'Eliminar Lista'"
  [mensaje]="'¿Estás segura de que quieres eliminar la lista ' + listNameToDelete() + '   de forma permanente? Esta acción no se puede deshacer.'"
  [textoConfirmar]="'Eliminar'"
  [textoCancelar]="'Cancelar'"
  (confirmar)="onConfirmDelete()"
  (cancelar)="onCancelDelete()"
  (overlayClick)="onCancelDelete()"
></app-confirmacion-modal>

*/