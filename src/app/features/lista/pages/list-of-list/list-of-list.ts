import { Component, computed, OnInit, signal } from '@angular/core';
import { ListService } from '../../service/list-service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import List from '../../model/List';
import { CafeService } from '../../../cafes/service/cafe-service';
import { ToastService } from '../../../../core/services/toast.service';
import { ModalDrawerComponent } from '../../../../shared/modal-drawer/modal-drawer.component';
import { ConfirmacionModal } from '../../../../shared/confirmacion-modal/confirmacion-modal';
import Cafe from '../../../cafes/model/CafeModel';

@Component({
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
  
    this.cafeSer.getCafes().subscribe({
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

}