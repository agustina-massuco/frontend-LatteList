import { Component, computed, OnInit, signal, ViewChild, HostListener, ElementRef } from '@angular/core';
import { UserService } from '../../service/user-service';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import { InputSearchComponent } from '../../../../shared/input-search/input-search';
import { CommonModule } from '@angular/common';
import { ListItemComponent } from '../../../../shared/list-item/list-item';
import { PaginatorComponent } from '../../../../shared/paginator/paginator';
import User from '../../model/User';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, InputSearchComponent, ListItemComponent, PaginatorComponent],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList implements OnInit {
  @ViewChild('searchInput') searchInputComponent!: InputSearchComponent;
  @ViewChild('searchContainer', { read: ElementRef }) searchContainer!: ElementRef;

  loggedUser : string | null = null; 
  search = signal('');
  tempSearchTerm = signal('');
  sugerencias = signal<User[]>([]);
  tipoFilter = signal('');
  page = signal(1);
  pageSize = 5;
  estadoFilter = signal('');
  
constructor(
  public userSer: UserService, 
  private auth : AuthService,
  private router: Router) { }


  ngOnInit(): void {
    const user = this.auth.getUserFromToken();
    if(user) this.loggedUser = user.id?.toString() || null; 
    
    this.userSer.getAllUsers().subscribe(); 
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.searchContainer && !this.searchContainer.nativeElement.contains(event.target)) {
      this.sugerencias.set([]);
    }
  }

   filteredUsers = computed(() => {
    const users = this.userSer.users();
    const s = this.search().toLowerCase();
    const tipo = this.tipoFilter();   
    const estado = this.estadoFilter();

    return users.filter(u => {
       if (estado && u.estado !== estado) return false;

      const matchesSearch = 
        u.nombre.toLowerCase().includes(s) ||
        u.apellido.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s);

     const matchesTipo = tipo ? u.tipoUser.toUpperCase() === tipo.toUpperCase() : true;

      return matchesSearch && matchesTipo;
    });
  });


  userList = computed(() => {
    return this.filteredUsers().map(user => this.convertUserToListItem(user));
  });

  paginatedUsers = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.userList().slice(start, end);
  });

  totalPages = computed(() => 
    Math.ceil(this.userList().length / this.pageSize)
  );

  onPageChange(direction: 'next' | 'previous') {
    if (direction === 'next' && this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
    } else if (direction === 'previous' && this.page() > 1) {
      this.page.update(p => p - 1);
    }
  }

  onSearchInput(term: string) {
    this.tempSearchTerm.set(term);
    this.actualizarSugerencias();
  }

  onSearchSubmit(term: string) {
    this.search.set(term);
    this.sugerencias.set([]); 
    this.page.set(1); 
  }

  actualizarSugerencias() {
    const term = this.tempSearchTerm().toLowerCase().trim();
    if (!term) {
      this.sugerencias.set([]);
      return;
    }

    const users = this.userSer.users();
    
    const coincidencias = users.filter(u => {
      //el back a viene con users filtrados activos e inactivos

      return u.nombre.toLowerCase().includes(term) ||
             u.apellido.toLowerCase().includes(term) ||
             u.email.toLowerCase().includes(term);
    });

    this.sugerencias.set(coincidencias.slice(0, 5));
  }

  seleccionarSugerencia(user: User) {
    this.sugerencias.set([]);
    this.tempSearchTerm.set('');
    this.router.navigate(['/usuarios/perfil', user.id]);
  }

  clearSearch() {
    this.search.set('');
    this.tempSearchTerm.set('');
    this.sugerencias.set([]);
    
    if (this.searchInputComponent) {
      this.searchInputComponent.clear();
    }

    this.page.set(1);
  }

  clearFilters() {
    this.search.set('');
    this.tempSearchTerm.set('');
    this.sugerencias.set([]);
    
    if (this.searchInputComponent) {
      this.searchInputComponent.clear();
    }
    
    this.tipoFilter.set('');
    this.estadoFilter.set(''); 

    this.page.set(1);
  }

  onUserClick(userItem: any) {
    if (userItem.id) {
      this.router.navigate(['/usuarios/perfil', userItem.id]);
    }
  }

  private convertUserToListItem(user: User): any {
    const isAdmin = user.tipoUser.toUpperCase() === 'ADMIN';
    let description = isAdmin ? `ADMIN - ${user.email}` : user.email;

    if (user.estado === 'INACTIVO') {
        description += ' (BANEADA)';
    }


    const isMyself = String(user.id) === String(this.loggedUser);
    const displayTitle = isMyself 
      ? `${user.nombre} ${user.apellido} (yo)` 
      : `${user.nombre} ${user.apellido}`;

    return {
      id: user.id,
      image: user.fotoPerfil, 
      title: displayTitle,
      description: description,
      inactive: false, 
      action: undefined 
    };
  }

  
}