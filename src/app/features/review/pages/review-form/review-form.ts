import { ChangeDetectorRef, Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../service/review-service';
import { AuthService } from '../../../../core/services/auth-service';
import { ConfirmacionModal } from '../../../../shared/confirmacion-modal/confirmacion-modal';
import Review from '../../model/Review'; 
import ReviewRequest from '../../model/ReviewRequest'; 
import ReviewResponse from '../../model/Review'; 
import Cafe from '../../../cafes/model/CafeModel';
import { COSTOS_PROMEDIO } from '../../../../shared/constantes/costo-promedio';


@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [FormsModule, ConfirmacionModal],
  templateUrl: './review-form.html',
  styleUrls: ['./review-form.css'],
})
export class ReviewForm implements OnInit, OnDestroy ,OnChanges{
COSTOS_PROMEDIO=COSTOS_PROMEDIO;

  mensajeErrorPuntuacion: string | null = null;
  mensajeErrorEtiquetas: string | null = null;

  @Input() reviewEditar: Review | null = null;
  private _cafe!: Cafe;
  @Input() set cafe(value: Cafe) {
    this._cafe = value;
    if (this.review) this.review.cafeId =Number(value?.id) }
  get cafe() { return this._cafe; }

  @Output() resenaEnviada = new EventEmitter<Review>();
  @Output() cancelar = new EventEmitter<void>();

  review!: Review; 
  private reviewOriginal!: Review;

  hover = 0;
  fotosPreview: string[] = [];
  mensajeFotos: string = '';
  maxFotos: number = 4;
  
  formVisible = true;

  modalVisible = false;
  modalTitulo = '';
  modalMensaje = '';

  mensajeTemporal: string | null = null;

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


  constructor(
    private cdr: ChangeDetectorRef,
    private rs: ReviewService,
    public auth: AuthService
  ) {}

 ngOnInit() {
  document.body.classList.add('modal-open');

  if (this.reviewEditar) {
    this.reviewOriginal = structuredClone(this.reviewEditar);
    this.review = structuredClone(this.reviewEditar);

    this.fotosPreview = [...(this.review.fotos || [])];
  } else {
    this.review = this.crearReviewVacia();
  }
}


  ngOnDestroy() {
    document.body.classList.remove('modal-open');
  }

 
  ngOnChanges(changes: SimpleChanges) {
  if (changes['reviewEditar'] && this.reviewEditar) {
    this.reviewOriginal = structuredClone(this.reviewEditar);
    this.review = structuredClone(this.reviewEditar);

    if (!this.review.etiquetas) this.review.etiquetas = [];
    if (!this.review.fotos) this.review.fotos = [];

    this.fotosPreview = [...this.review.fotos];
  }
}


  crearReviewVacia(): Review{
    const user = this.auth.getUserFromToken();
    return {
      
      id: 0, 
      fecha: new Date().toISOString(),
      estado: 'ACTIVA',
      puntuacion: 0,
      comentario: '',
      userId: Number(user?.id ?? 0),
      cafeId: Number(this.cafe?.id || 0),
      etiquetas: [],
      costoPromedio: null,
      fotos: [],
      likes: 0, 
    dislikes: 0, 
    reaccionUsuario: null
    };
  }
agregarEtiqueta(etiqueta: string) {
  if (!etiqueta) return;

  this.mensajeErrorEtiquetas = null;

  if (this.review.etiquetas.includes(etiqueta)) return;

  if (this.review.etiquetas.length >= 3) {
    this.mensajeErrorEtiquetas = 'Solo podés seleccionar hasta 3 etiquetas';
    return;
  }
  this.review.etiquetas.push(etiqueta);
}


  quitarEtiqueta(etiqueta: string) {
    this.review.etiquetas = this.review.etiquetas.filter(e => e !== etiqueta);
    this.mensajeErrorEtiquetas = null; 
  }

  seleccionarEstrella(valor: number) { 
    this.review.puntuacion = valor;
    this.mensajeErrorPuntuacion = null; 
  }
  entrarEstrella(valor: number) { this.hover = valor; }
  salirEstrella() { this.hover = 0; }

 onFileSelected(event: any) {
  const files: FileList = event.target.files;
  this.mensajeFotos = '';

  if (!this.review.fotos) this.review.fotos = [];

  for (let i = 0; i < files.length && this.review.fotos.length < this.maxFotos; i++) {
    const file = files[i];
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const resultado = e.target?.result as string;
      if (!resultado) return;

      const yaExiste = this.review.fotos!.includes(resultado);

      if (yaExiste) {
        this.mensajeFotos = 'No podés subir la misma foto más de una vez';
        return;
      }

      if (this.review.fotos!.length >= this.maxFotos) {
        this.mensajeFotos = `Solo podés subir hasta ${this.maxFotos} fotos`;
        return;
      }

      this.fotosPreview.push(resultado);
      this.review.fotos!.push(resultado);
    };

    reader.readAsDataURL(file);
  }
  event.target.value = '';
}


  quitarFoto(index: number) {
    if (this.review.fotos && this.fotosPreview) {
      this.review.fotos.splice(index, 1);
      this.fotosPreview.splice(index, 1);
    }
  }

cancelarForm() {
  document.body.classList.remove('modal-open');

  if (this.reviewEditar) {
    this.review = structuredClone(this.reviewOriginal);
    this.fotosPreview = [...(this.reviewOriginal.fotos || [])];
  } else {
    this.review = this.crearReviewVacia();
    this.fotosPreview = [];
  }

  this.cancelar.emit();
}



  mostrarModalConfirmacion() {
      this.mensajeErrorPuntuacion = null;

    if (this.review.puntuacion === 0) {
      this.mensajeErrorPuntuacion = ' Seleccioná una puntuación.';
      return;
    }

    this.modalTitulo = this.reviewEditar ? 'Editar reseña' : 'Publicar reseña';
    this.modalMensaje = this.reviewEditar
      ? ' ¿Estás segura que querés modificar esta reseña?'
      : ' ¿Estás segura que querés publicar esta reseña?';
    this.modalVisible = true;
  }

 
  ejecutarAccionConfirmada() {
    const request: ReviewRequest = {
      puntuacion: this.review.puntuacion,
      comentario: this.review.comentario,
      userId: this.review.userId, 
      cafeId: this.review.cafeId,
      etiquetas: this.review.etiquetas,
      costoPromedio: this.review.costoPromedio ?? null,


      fotos: this.review.fotos 
    };

    let observable;
    if (this.reviewEditar) {
    
      if (this.reviewEditar.id === undefined || this.reviewEditar.id === null) {
         console.error("Error: ID de reseña no encontrado para editar.");
         this.mostrarMensaje('Error al editar: ID de reseña no encontrado.');
         this.modalVisible = false;
         return;
      }
      observable = this.rs.editarReview(this.reviewEditar.id as number, request);
    } else {
      console.log('REQUEST:', request);

      observable = this.rs.crearReview(request);
    }

    observable.subscribe({
      next: (res: ReviewResponse) => {
        this.mostrarMensaje(this.reviewEditar
          ? '¡Reseña editada con éxito!'
          : '¡Reseña publicada con éxito!');
          

        this.resenaEnviada.emit(res as Review); 
        this.cancelarForm();
      },
     error: (err) => {

}
    });

    this.modalVisible = false;
  }

  cerrarModal() {
    this.modalVisible = false;
  }

  mostrarMensaje(texto: string) {
    this.mensajeTemporal = texto;
    setTimeout(() => this.mensajeTemporal = null, 3000);
  }

  getLabelEtiqueta(value: string): string {
  const etiqueta = this.etiquetasDisponibles.find(e => e.value === value);
  return etiqueta ? etiqueta.label : value;
}

}

