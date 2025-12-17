import { Component, OnInit, signal, computed, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListItemComponent } from '../../../../shared/list-item/list-item';
import { ModalDrawerComponent } from '../../../../shared/modal-drawer/modal-drawer.component';
import { PillsComponent } from '../../../../shared/pill/pills';

import { CafeService } from '../../service/cafeService';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewForm } from '../../../review/pages/review-form/review-form';
import { ReviewList } from '../../../review/pages/review-list/review-list';
import Review from '../../../review/model/Review';
import ReviewRequest from '../../../review/model/ReviewRequest';
import Cafe from '../../model/CafeModel';
import { COSTOS_PROMEDIO } from '../../../../shared/constantes/costo-promedio';
import { ListService } from '../../../lista/service/list-service';
import { AuthService } from '../../../../core/services/auth-service';

interface CafeDetailDTO {
  id: number;
  osmId: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono?: string;
  email?: string;
  website?: string;
  cuisine?: string;
  openingHours?: string;
  takeaway?: boolean;
  delivery?: boolean;
  internet_access?: boolean;
  outdoor_seating?: boolean;
  puntuacion?: number;
  costoPromedio?: 'BARATO' | 'MEDIO' | 'CARO' | null;
  etiquetasTop3?: string[];
  abiertoAhora?: boolean; 
}

@Component({
  selector: 'app-cafe-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ListItemComponent,
    ModalDrawerComponent,
    PillsComponent,
    ReviewForm,
    ReviewList

  ],
  templateUrl: './cafe-detail.html',
  styleUrls: ['./cafe-detail.css'],
})
export class CafeDetailComponent implements OnInit {

  @Input() cafeId: number | null = null;
  @Output() back = new EventEmitter<void>();

  cafeRaw = signal<CafeDetailDTO | null>(null);
  loading = true;

  cafe = computed(() => {
    const c = this.cafeRaw();
    if (!c) return null;
    return {
      ...c,
      opening_hours: c.openingHours 
    } as any;
  });

  promedioPuntaje = computed(() => this.cafe()?.puntuacion || 0);
  precioPromedio = computed(() => this.cafe()?.costoPromedio || null);
  topEtiquetasConIndex = computed(() => {
    const etiquetas = this.cafe()?.etiquetasTop3 || [];
    return etiquetas.map((tag: string, index: number) => ({ tag, index }));
  });

  cafeAttributes = computed(() => {

    const cafeData = this.cafe();
    if (!cafeData) return [];

    const attributes: Array<{ text: string; icon: string; type: 'default' | 'open' | 'closed' | 'info' }> = [];

    if (cafeData.delivery) {
      attributes.push({ text: 'Delivery', icon: '🚚', type: 'default' });
    }
    if (cafeData.takeaway) {
      attributes.push({ text: 'Takeaway', icon: '📦', type: 'default' });
    }
    if (cafeData.internet_access) {
      attributes.push({ text: 'Internet', icon: '📶', type: 'default' });
    }
    if (cafeData.outdoor_seating) {
      attributes.push({ text: 'Exterior', icon: '🌳', type: 'default' });
    }

   if (cafeData.openingHours?.trim()) {
  if (cafeData.abiertoAhora !== undefined) {
    attributes.push({
      text: cafeData.abiertoAhora ? 'Abierto' : 'Cerrado',
      icon: cafeData.abiertoAhora ? '✓' : '✕',
      type: cafeData.abiertoAhora ? 'open' : 'closed'
    });
  }
} else {
  attributes.push({
    text: 'No hay información sobre el horario de apertura',
    icon: 'ℹ',
    type: 'info'
  });
}




    return attributes;
  });

 


  isModalOpen = signal(false);
  loadingLists = signal(false);
  showCreateForm = signal(false);
  newListName = signal('');
  creatingList = signal(false);

  userLists = signal<any[]>([]);
  userListItems = computed(() => {
    return this.userLists().map(list => {
      // Soportar ambos formatos: `cafes` (array de objetos) o `idCafes` (array de ids)
      const cafesArr = list.cafes && Array.isArray(list.cafes)
        ? list.cafes
        : (Array.isArray(list.idCafes) ? list.idCafes.map((id: any) => ({ id })) : []);

      const isAdded = cafesArr.some((cafe: Cafe) => Number(cafe.id) === this.cafeId);

      return {
        listId: list.id,
        item: {
          title: list.nombre,
          description: `${cafesArr.length} café${cafesArr.length !== 1 ? 's' : ''}`,
          action: isAdded ? '-' : '+',
          isAdded
        }
      };
    });
  });

  formVisible = false;
  reviewEditar: any = null;
  cafeSeleccionado: any = null;
  actualizarLista = false;

  constructor(
    private cafeService: CafeService,
    private router: Router,
    private route: ActivatedRoute,
    private listasService: ListService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const idFromUrl = Number(this.route.snapshot.paramMap.get('id'));
  console.log('📌 ID desde URL:', idFromUrl);
   this.cafeId = idFromUrl;
    if (this.cafeId) {
      this.loading = true;

      this.cafeService.getCafeById(this.cafeId).subscribe({
        next: (cafe) => {
          console.log(cafe.id);
          if (cafe) {
            this.cafeRaw.set(cafe as any);
          } else {
            console.warn('No se encontró el café con id', this.cafeId);
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando café:', err);
          this.loading = false;
        },
      });
    } else {
      this.loading = false;
    }
  }

  refreshCafeDetail(): void {
  const cafeActual = this.cafe();
  if (!cafeActual) return;

  this.cafeService.getCafeById(cafeActual.id).subscribe({
    next: (cafe) => this.cafeRaw.set(cafe),
    error: (err) => console.error('Error refrescando café', err)
  });
}

get cafeIdActual(): number {
  return this.cafe()?.id || 0;
}


  getEstrellas(): string[] {
    const puntos = Math.round(this.promedioPuntaje() * 2) / 2; // Redondear a .5
    const estrellas: string[] = [];

    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(puntos)) {
        estrellas.push('★');
      } else if (i - 0.5 <= puntos) {
        estrellas.push('⯨');
      } else {
        estrellas.push('☆');
      }
    }

    return estrellas;
  }

  COSTOS_PROMEDIO = COSTOS_PROMEDIO;

getPrecioSimbolo(): string {
  const c = this.cafe();
  if (!c || !c.costoPromedio) return '';
  const costo = this.COSTOS_PROMEDIO.find(cp => cp.value === c.costoPromedio);
  return costo ? costo.label : '';
}


  formatearDireccion(direccion: string): string {
    if (!direccion) return '';
    return direccion.split(',')[0].trim();
  }

 getHorarioBonito(cafe: CafeDetailDTO): string {
  if (!cafe.openingHours) return 'Sin horario';

  const diasMap: Record<string, string> = {
    Mo: 'Lunes',
    Tu: 'Martes',
    We: 'Miércoles',
    Th: 'Jueves',
    Fr: 'Viernes',
    Sa: 'Sábado',
    Su: 'Domingo',
  };

  const horario = cafe.openingHours.split(';')[0].trim();

  const [dias, horas] = horario.split(' ');

  const diasBonitos = dias
    .split('-')
    .map(d => diasMap[d] ?? d)
    .join(' a ');

  return `${diasBonitos} ${horas}`;
}

  volver(): void {
   this.router.navigate(['/cafes']);
  }


 
    //list 

openListModal(): void {
  this.isModalOpen.set(true);
  this.cargarListas();
}

cargarListas(): void {
  this.loadingLists.set(true);

  this.listasService.getUserLists().subscribe({
    next: listas => {
      this.userLists.set(listas);
      this.loadingLists.set(false);
    },
    error: err => {
      console.error(err);
      this.loadingLists.set(false);
    }
  });
}

closeModal(): void {
  this.isModalOpen.set(false);
}

createNewList(): void {
  this.showCreateForm.set(true);
}

cancelCreateList(): void {
  this.showCreateForm.set(false);
  this.newListName.set('');
}


saveNewList(): void {
  const nombre = this.newListName().trim();
  if (!nombre) return;

  this.creatingList.set(true);

  this.listasService.postList(nombre).subscribe({
    next: () => {
      this.creatingList.set(false);
      this.showCreateForm.set(false);
      this.newListName.set('');
      this.cargarListas();
    },
    error: err => {
      console.error(err);
      this.creatingList.set(false);
    }
  });
}


toggleCafeInList(listId: number): void {
  const cafeId = this.cafeIdActual;

  const lista = this.userLists().find(l => l.id === listId);
  if (!lista) return;

  // Inicializar cafés si es undefined
  if (!lista.cafes) lista.cafes = [];

  const yaEsta = lista.cafes.some((c: { id: number }) => c.id === cafeId);

  if (yaEsta) {
    lista.cafes = lista.cafes.filter((c: { id: number }) => c.id !== cafeId);
  } else {
    lista.cafes.push({ id: cafeId });
  }

  this.userLists.update(lists => [...lists]);

  this.listasService
    .toggleCafe(listId, cafeId, !yaEsta)
    .subscribe({
      next: () => {},
      error: err => console.error('Error al actualizar la lista de cafés', err)
    });
}



  /////////////////////////////////////////////////////////////////


 mostrarFormulario(cafe: Cafe): void {
    if (!cafe) {
      console.error('No se pudo obtener la información del café para crear la reseña.');
      return;
    }
    this.reviewEditar = null; 
    this.formVisible = true;
    
  }

  
  abrirFormularioEdicion(resena: Review): void {
    this.reviewEditar = resena; 
    this.formVisible = true;
  }

 
  cancelarResena(): void {
    this.formVisible = false;
    this.reviewEditar = null; 
  }

  manejarResenaEnviada(review: ReviewRequest | Review): void {

    this.formVisible = false;
    this.reviewEditar = null;

    this.toggleActualizarLista(); 
        this.refreshCafeDetail();

  }

  manejarResenaEliminada(review: Review): void {

    this.toggleActualizarLista(); 
        this.refreshCafeDetail();

  }

  toggleActualizarLista(): void {
    this.actualizarLista = !this.actualizarLista; 
  }


  //etiquetas!!!
  getEtiquetaLabel(etiqueta: string): string {
  const encontrada = this.etiquetasDisponibles.find(e => e.value === etiqueta);
  return encontrada ? encontrada.label : etiqueta;
}

    etiquetasDisponibles = [
  { value: 'BRUNCH', label: 'Brunch' },
  { value: 'DESAYUNOS', label: 'Desayunos' },
  { value: 'CAFETERIA_ESPECIALIDAD', label: 'Cafetería de Especialidad' },
  { value: 'PANADERIA_ARTESANAL', label: 'Panadería Artesanal' },
  { value: 'PASTELERIA', label: 'Pastelería' },
  { value: 'COMIDA_VEGANA', label: 'Comida Vegana' },
  { value: 'COMIDA_SALUDABLE', label: 'Comida Saludable' },
  { value: 'SIN_TACC', label: 'Sin TACC' },
  { value: 'OPCIONES_SIN_LACTOSA', label: 'Opciones Sin Lactosa' },
  { value: 'SANDWICHES_GOURMET', label: 'Sandwiches Gourmet' },
  { value: 'POSTRES_CASEROS', label: 'Postres Caseros' },
  { value: 'JUGOS_NATURALES', label: 'Jugos Naturales' },
  { value: 'SMOOTHIES', label: 'Smoothies' },
  { value: 'TEMATICO', label: 'Temático' },
  { value: 'MINIMALISTA', label: 'Minimalista' },
  { value: 'VINTAGE', label: 'Vintage' },
  { value: 'PET_FRIENDLY', label: 'Pet Friendly' },
  { value: 'LIBROS', label: 'Libros' },
  { value: 'ARTE', label: 'Arte' },
  { value: 'MUSICA_EN_VIVO', label: 'Música en Vivo' },
  { value: 'ESTILO_COWORKING', label: 'Estilo Coworking' },
  { value: 'FRENTE_AL_MAR', label: 'Frente al Mar' },
  { value: 'ZONA_CENTRICA', label: 'Zona Céntrica' },
  { value: 'ENCHUFES_DISPONIBLES', label: 'Enchufes Disponibles' },
  { value: 'TERRAZA', label: 'Terraza' },
  { value: 'PATIO', label: 'Patio' },
  { value: 'CALEFACCION', label: 'Calefacción' },
  { value: 'AIRE_ACONDICIONADO', label: 'Aire Acondicionado' },
  { value: 'ESTUDIANTES', label: 'Estudiantes' },
  { value: 'GRUPOS_GRANDES', label: 'Grupos Grandes' },
  { value: 'FAMILIAR', label: 'Familiar' },
  { value: 'PAREJAS', label: 'Parejas' }
];

}
