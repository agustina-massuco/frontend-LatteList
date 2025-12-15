import { Component, signal, computed, effect, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SwitchComponent } from '../../../../shared/switch/switch';
import { ListItemComponent, ListItem } from '../../../../shared/list-item/list-item';
import { PaginatorComponent } from '../../../../shared/paginator/paginator';
import { ModalDrawerComponent } from '../../../../shared/modal-drawer/modal-drawer.component';
import { InputSearchComponent } from '../../../../shared/input-search/input-search';
import Cafe from '../../model/CafeModel';
import { CafeService } from '../../service/cafeService';

@Component({
  selector: 'app-cafe-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    InputSearchComponent,
    SwitchComponent,
    ListItemComponent,
    PaginatorComponent,
    ModalDrawerComponent
  ],
  templateUrl: './cafe-list.html',
  styleUrls: ['./cafe-list.css'],
})
export class CafeListComponent implements OnInit {

  @Output() cafeSelected = new EventEmitter<number>();

  filtros = signal({
    delivery: null as boolean | null,
    takeaway: null as boolean | null,
    internet_access: null as boolean | null,
    outdoor_seating: null as boolean | null,
    abiertoAhora: null as boolean | null,
    search: ''
  });

  searchTerm = signal('');
  sugerencias = signal<Cafe[]>([]);

  cafeList = signal<Cafe[]>([]);

  paginaActual = signal(1);
  itemsPorPagina = 10;

  totalPaginas = computed(() =>
    Math.ceil(this.cafeList().length / this.itemsPorPagina)
  );

  cafesPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    const cafes = this.cafeList().slice(inicio, inicio + this.itemsPorPagina);
   
    return cafes.map(cafe => ({
      ...this.cafeToListItem(cafe),
      id: cafe.id 
    }));
  });

 

  isModalOpen = signal(false);
  selectedCafe = signal<any | null>(null);

  loadingLists = signal(false);
  userLists = signal<any[]>([]);
  userListItems = signal<any[]>([]);
  showCreateForm = signal(false);
  newListName = signal('');
  creatingList = signal(false);

  constructor(
    private cafeService: CafeService,
    private router: Router
    
  ) {
    effect(() => {
      const _ = this.filtros();
      this.loadCafes();
    });
  }

  loadCafes(): void {
    console.log('🔄 Cargando cafés con filtros:', this.filtros());
    this.cafeService.getCafes(this.filtros()).subscribe({
      next: (data) => {
        console.log('✅ Cafés cargados:', data);
        this.cafeList.set(data);
        this.paginaActual.set(1); 
      },
      error: (e) => {
        console.error('❌ Error cargando cafés:', e);
      }
    });
  }

  alternarFiltro(nombre: string): void {
    this.filtros.update((f) => {
      const actual = f[nombre as keyof typeof f];
      return {
        ...f,
        [nombre]: actual === true ? null : true
      };
    });
  }

  clearFilters(): void {
    this.filtros.set({
      delivery: null,
      takeaway: null,
      internet_access: null,
      outdoor_seating: null,
      abiertoAhora: null,
      search: ''
    });
    this.searchTerm.set('');
    this.sugerencias.set([]);
  }

  onSearchInput(text: string): void {
    this.searchTerm.set(text);

    if (text.trim().length === 0) {
      this.sugerencias.set([]);
      return;
    }

    this.cafeService.searchCafes(text).subscribe({
      next: (suger) => this.sugerencias.set(suger),
      error: (e) => console.error('Error buscando cafés:', e)
    });
  }

  onSearchSubmit(text: string): void {
    this.searchTerm.set(text);
    this.filtros.update((f) => ({ ...f, search: text }));
    this.sugerencias.set([]);
  }

  seleccionarSugerencia(cafe: Cafe): void {
  this.searchTerm.set(cafe.nombre);
  this.filtros.update((f) => ({ ...f, search: cafe.nombre }));
  this.sugerencias.set([]);
  this.router.navigate(['/cafes', cafe.id]);
}

  clearSearch(): void {
    this.searchTerm.set('');
    this.filtros.update((f) => ({ ...f, search: '' }));
    this.sugerencias.set([]);
  }


 onCafeClick(cafe: string): void {
     this.router.navigate(['/cafes', cafe]);
  }

  private cafeToListItem(cafe: Cafe): ListItem {
    return {
      title: cafe.nombre,
      description: cafe.direccion || 'Sin dirección',
      action: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 6a4 4 0 0 1 4 4v11a1 1 0 0 1 -1.514 .857l-4.486 -2.691l-4.486 2.691a1 1 0 0 1 -1.508 -.743l-.006 -.114v-11a4 4 0 0 1 4 -4h4z" />
        <path d="M16 2a4 4 0 0 1 4 4v11a1 1 0 0 1 -2 0v-11a2 2 0 0 0 -2 -2h-5a1 1 0 0 1 0 -2h5z" />
      </svg>`
    };
  }
  onPageChange(direction: 'next' | 'previous'): void {
    if (direction === 'next' && this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update(p => p + 1);
    } else if (direction === 'previous' && this.paginaActual() > 1) {
      this.paginaActual.update(p => p - 1);
    }
  }


  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedCafe.set(null);
  }

  onBookmarkClick(cafe: any): void {
    this.selectedCafe.set(cafe);
    this.isModalOpen.set(true);
  }

 
  ngOnInit(): void {
    this.loadCafes();
  }




  //LISTAS. 
  createNewList(): void {
    console.log('TODO: createNewList');
  }

  cancelCreateList(): void {
    this.showCreateForm.set(false);
  }

  saveNewList(): void {
    console.log('TODO: saveNewList');
  }

  toggleCafeInList(listId: number): void {
    console.log('TODO: toggleCafeInList', listId);
  }
}
