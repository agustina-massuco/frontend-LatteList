
import { ChangeDetectorRef, Component, computed, EventEmitter, Input, OnChanges, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { ReviewService } from '../../service/review-service';
import { AuthService } from '../../../../core/services/auth-service';
import { UserService } from '../../../users/service/user-service';
import { ConfirmacionModal } from '../../../../shared/confirmacion-modal/confirmacion-modal';
import Cafe from '../../../cafes/model/CafeModel';
import Review from '../../model/Review';
import User, { EstadoUsuario } from '../../../users/model/User';
import { TipoReaccion } from '../../model/LikeReview';

@Component({
    selector: 'app-review-list',
    standalone: true,
    imports: [FormsModule, CommonModule, ConfirmacionModal],
    templateUrl: './review-list.html',
    styleUrls: ['./review-list.css']
})
export class ReviewList implements OnInit, OnChanges {

    readonly ESTADO_ACTIVA = 'ACTIVA';
    readonly ESTADO_INACTIVA = 'INACTIVA';
    readonly ESTADO_ELIMINADA = 'ELIMINADA';
    readonly defaultProfileImage = '/images/grano.png';

    @Input() cafeId!: number;
    @Input() actualizar!: boolean;
    @Input() mostrarBotonAgregar: boolean = false;
    @Input() modoVista: 'cafe' | 'perfil' = 'cafe';

    @Input() set reviewsUsuario(value: Review[] | undefined) {
        if (value) {
            this.reviewsUsuarioSignal.set([...value]);
        }
    }
    get reviewsUsuario(): Review[] | undefined {
        return this.reviewsUsuarioSignal();
    }
    private reviewsUsuarioSignal = signal<Review[]>([]);
    private reviewsCafeSignal = signal<Review[]>([]);

    @Input() cafeMap?: Map<string, Cafe>;

    @Output() editarResena = new EventEmitter<Review>();
    @Output() resenaEliminada = new EventEmitter<Review>();
    @Output() agregarResenaNueva = new EventEmitter<void>();


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

    loading: boolean = true;
    error: string = '';
    estrellas = [1, 2, 3, 4, 5];
    ordenSeleccionado = signal<'fechaDesc' | 'fechaAsc' | 'puntuacionAlta' | 'puntuacionBaja' | 'misPrimeras'>('fechaDesc');
    filtroActivo = signal<'todos' | 'activas' | 'inactivas'>('todos');
    mensajeTemporal: string = '';
    @Output() reseñasActualizadas = new EventEmitter<void>();


    modalVisible: boolean = false;
    modalTitulo: string = '';
    modalMensaje: string = '';
    reviewSeleccionada?: Review;
    accionPendiente: 'baja' | 'alta' | 'eliminar' | null = null;
    userMap = new Map<number, User>();

    imagenSeleccionada?: string;
    indiceActual = 0;
    fotosActuales: string[] = [];

    constructor(
        private reviewService: ReviewService,
        private userService: UserService,
        public auth: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef) { }

 
    reviewsBase = computed(() => {
        const todasLasResenas = this.reviewsCafeSignal();
        const esAdmin = this.auth.isAdmin(); 


        let lista = todasLasResenas.filter(r => r.estado !== this.ESTADO_ELIMINADA);

        if (!esAdmin) {
            lista = lista.filter(r => {
                const estadoRecibido = r.estado;
                const estadoEsperado = this.ESTADO_ACTIVA;


                return estadoRecibido === estadoEsperado;
            });
        }

        return lista;
    });

    reviewsOrdenadasYFiltradas = computed(() => {

        let lista = [...this.reviewsBase()];
        const orden = this.ordenSeleccionado();
        const filtro = this.filtroActivo(); 
        const esAdmin = this.auth.isAdmin();

        if (esAdmin) {
            if (filtro === 'activas') {
                lista = lista.filter(r => r.estado === 'ACTIVA');
            } else if (filtro === 'inactivas') {
                lista = lista.filter(r => r.estado.toUpperCase() !== this.ESTADO_ACTIVA);
            }
        }

        switch (orden) {
            case 'fechaDesc':
                lista.sort((a, b) => {
                    if (a.fecha === b.fecha) {
                        return b.id - a.id;
                    }
                    return b.fecha.localeCompare(a.fecha);
                });
                break;
            case 'fechaAsc':
                lista.sort((a, b) => {
                    if (a.fecha === b.fecha) {
                        return a.id - b.id;
                    }
                    return a.fecha.localeCompare(b.fecha);
                });
                break;
            case 'puntuacionAlta':
                lista.sort((a, b) => b.puntuacion - a.puntuacion);
                break;
            case 'puntuacionBaja':
                lista.sort((a, b) => a.puntuacion - b.puntuacion);
                break;
            case 'misPrimeras':
                const user = this.auth.getUserFromToken();
                if (user && user.id) {
                    lista = lista.filter(r => r.userId === Number(user.id))
                        .sort((a, b) => b.fecha.localeCompare(a.fecha));
                } else {
                    lista = [];
                }
                break;
        }

        return lista;
    });
    
    ngOnInit() {
        this.cargarDataInicial();
        window.addEventListener('keydown', (event) => {
            if (!this.imagenSeleccionada) return;
            if (event.key === 'ArrowLeft') this.anteriorImagen();
            if (event.key === 'ArrowRight') this.siguienteImagen();
            if (event.key === 'Escape') this.cerrarLightbox();
        });
    }

    ngOnChanges() {
        if (this.cafeId) {
            this.cargarDataInicial();
        }
    }


cargarDataInicial() {
        this.loading = true;
        this.error = '';

        // ❌ ELIMINAMOS COMPLETAMENTE EL BLOQUE DE USUARIOS SIMULADOS
        /*
        const simulatedUsers: User[] = [
          { id: 1, nombre: 'User', apellido: 'Test', email: 'test@correo.com', estado: 'ACTIVO', fotoPerfil: '', tipoUser: 'CLIENTE', password: '' },
          //...
        ];
        const usersActivos = simulatedUsers.filter(u => u.estado === 'ACTIVO');
        this.userMap = new Map(usersActivos.map(u => [u.id, u]));
        */

        const incluirInactivas = this.auth.isAdmin();
        const idNum = Number(this.cafeId);

        if (isNaN(idNum) || idNum === 0) {
            this.error = 'ID inválido.';
            this.loading = false;
            return;
        }

        let reviewObservable: Observable<Review[]>;

        if (this.modoVista === 'cafe') {
            // Asume que getByCafe devuelve el objeto Review con userNombre, userApellido, etc.
            reviewObservable = this.reviewService.getByCafe(idNum, incluirInactivas);
        } else {
            // Asume que getByUsuario devuelve el objeto Review con userNombre, userApellido, etc.
            reviewObservable = this.reviewService.getByUsuario(idNum, incluirInactivas);
        }

        reviewObservable.subscribe({
            next: (reviews) => {
                const reviewsValidas: Review[] = reviews.map(r => {
                    // Ya NO BUSCAMOS EN userMap. Usamos los datos que vienen en 'r'.
                    
                    // Solo usamos los valores por defecto si el backend no los trae:
                    const nombre = r.userNombre ?? 'Usuario';
                    const apellido = r.userApellido ?? '';
                    const foto = r.userFotoPerfil || this.defaultProfileImage;

                    return {
                        ...r,
                        etiquetas: r.etiquetas ?? [],
                        fotos: r.fotos ?? [],
                        likes: r.likes ?? 0,
                        dislikes: r.dislikes ?? 0,
                        reaccionUsuario: r.reaccionUsuario ?? null,

                        // Asignamos el valor que vino de la API o el default:
                        userNombre: nombre,
                        userApellido: apellido,
                        userFotoPerfil: foto 
                    };
                }).filter(r => r.estado !== this.ESTADO_ELIMINADA);


                if (this.modoVista === 'cafe') {
                    this.reviewsCafeSignal.set(reviewsValidas);
                } else {
                    this.reviewsUsuarioSignal.set(reviewsValidas);
                }
                this.loading = false;
            },
            error: (err) => {
                this.error = `Error al cargar reseñas del ${this.modoVista}: ${err.message || 'Desconocido'}`;
                console.error(err);
                this.loading = false;
            }
        });

    }

    getFotoPerfil(user: User): string {
        if (!user.fotoPerfil || user.fotoPerfil.trim() === '') {
            return this.defaultProfileImage;
        }
        return user.fotoPerfil;
    }

    verPerfilUsuario(id: string) {
        this.router.navigate(['/auth/perfil', id]);
    }

    onUserNameClick(event: Event, userId: number) {
        if (this.auth.isAdmin()) {
            event.stopPropagation();
            this.verPerfilUsuario(userId.toString());
        }
    }


    formatearFecha(fecha: string): string {
        const [year, month, day] = fecha.split('-');
        return `${day}/${month}/${year}`;
    }


    esPropietaria(review: Review): boolean {
        const user = this.auth.getUserFromToken();
        return user ? review.userId === Number(user.id) : false;
    }

    getCafeName(cafeId: number): string {
        if (this.modoVista === 'perfil' && this.cafeMap) {
            return this.cafeMap.get(cafeId.toString())?.nombre || 'Café Desconocido';
        }
        return 'Café Desconocido';
    }

    irACafeDetail(cafeId: number) {
        if (this.modoVista === 'perfil') {
            this.router.navigate(['/cafes', cafeId.toString()]);
        }
    }

    getClaseAdmin(review: Review): string {
        return review.estado === this.ESTADO_ACTIVA ? 'admin-activa' : 'admin-inactiva';
    }

    abrirFormularioEdicion(review: Review) {
        this.editarResena.emit(review);
    }

getCostoTexto(costo: 'BARATO' | 'MEDIO' | 'CARO' | null): string {
  switch(costo) {
    case 'BARATO': return '$';
    case 'MEDIO': return '$$';
    case 'CARO': return '$$$';
    default: return '';
  }
}


    getEtiquetaLabel(etiqueta: string): string {
        const encontrada = this.etiquetasDisponibles.find(e => e.value === etiqueta);
        return encontrada ? encontrada.label : etiqueta;
    }



    confirmarBaja(review: Review) {
        this.reviewSeleccionada = review;
        this.accionPendiente = 'baja';
        this.modalTitulo = 'Confirmar desactivación ';
        this.modalMensaje = '¿Estás segura que quieres desactivarla?';
        this.modalVisible = true;
        this.cdr.detectChanges();
    }

    confirmarAlta(review: Review) {
        this.reviewSeleccionada = review;
        this.accionPendiente = 'alta';
        this.modalTitulo = 'Confirmar activación';
        this.modalMensaje = '¿Estás segura que quieres activar esta reseña?';
        this.modalVisible = true;
        this.cdr.detectChanges();
    }

    eliminarReview(review: Review) {

        this.reviewSeleccionada = review;
        this.accionPendiente = 'eliminar';
        this.modalTitulo = 'Confirmar eliminación';
        this.modalMensaje = 'Esta acción es definitiva. ¿Querés eliminar la reseña?';
        this.modalVisible = true;
    }

    ejecutarAccionConfirmada() {
        if (!this.reviewSeleccionada || !this.accionPendiente) return;

        const review = this.reviewSeleccionada;
        const reviewId = review.id;

        let obs: Observable<void>;
        let mensajeExito: string;

        switch (this.accionPendiente) {
            case 'baja':
                obs = this.reviewService.desactivar(reviewId);
                mensajeExito = 'Reseña desactivada con éxito.';
                break;

            case 'eliminar':
                obs = this.reviewService.eliminar(reviewId);
                mensajeExito = 'Reseña eliminada con éxito.';
                break;

            case 'alta':
                obs = this.reviewService.activar(reviewId);
                mensajeExito = 'Reseña activada con éxito.';
                break;

            default:
                this.cerrarModal();
                return;
        }

        obs.subscribe({
            next: () => {
                this.mostrarMensaje(mensajeExito);
                this.reseñasActualizadas.emit();


                if (this.modoVista === 'perfil') {
                    if (this.accionPendiente === 'eliminar') {
                        this.resenaEliminada.emit(review);
                    } else {
                        this.cargarDataInicial();
                    }
                } else {
                    this.cargarDataInicial();
                }
            },
            error: (err) => {
                console.error('Error al ejecutar acción de reseña:', err);
                this.mostrarMensaje('Error al actualizar la reseña');
            }
        });

        this.cerrarModal();
    }


    cerrarModal() {
        this.modalVisible = false;
        this.reviewSeleccionada = undefined;
        this.accionPendiente = null;
    }

    mostrarMensaje(msg: string) {
        this.mensajeTemporal = msg;
        setTimeout(() => this.mensajeTemporal = '', 2000);
    }

    abrirLightbox(fotos: string[] | string, fotoSeleccionada?: string) {
        if (Array.isArray(fotos)) {
            this.fotosActuales = fotos;
            this.indiceActual = fotoSeleccionada ? fotos.indexOf(fotoSeleccionada) : 0;
            this.imagenSeleccionada = fotoSeleccionada || fotos[0];
        } else {
            this.fotosActuales = [fotos];
            this.indiceActual = 0;
            this.imagenSeleccionada = fotos;
        }
    }

    cerrarLightbox() {
        this.imagenSeleccionada = undefined;
        this.fotosActuales = [];
        this.indiceActual = 0;
    }

    anteriorImagen() {
        if (this.fotosActuales.length === 0) return;
        this.indiceActual = (this.indiceActual - 1 + this.fotosActuales.length) % this.fotosActuales.length;
        this.imagenSeleccionada = this.fotosActuales[this.indiceActual];
    }

    siguienteImagen() {
        if (this.fotosActuales.length === 0) return;
        this.indiceActual = (this.indiceActual + 1) % this.fotosActuales.length;
        this.imagenSeleccionada = this.fotosActuales[this.indiceActual];
    }

    anteriorFoto(event: MouseEvent) {
        event.stopPropagation();
        this.anteriorImagen();
    }

    siguienteFoto(event: MouseEvent) {
        event.stopPropagation();
        this.siguienteImagen();
    }

























    readonly TIPO_LIKE: TipoReaccion = 'LIKE';
    readonly TIPO_DISLIKE: TipoReaccion = 'DISLIKE';

manejarReaccion(review: Review, nuevaReaccion: TipoReaccion): void {
  const currentUser = this.auth.getUserFromToken();
  if (!currentUser?.id) {
    this.mostrarMensaje('Debes iniciar sesión para reaccionar.');
    return;
  }

  const reviewId = review.id;
  const userId = Number(currentUser.id);
  const esMismo = review.reaccionUsuario === nuevaReaccion;
   
  this.actualizarEstadoReaccionLocal(review, nuevaReaccion);
   console.log(review)
  const obs = esMismo
    ? this.reviewService.quitarReaccion(reviewId, userId)
    : this.reviewService.reaccionar(reviewId, userId, nuevaReaccion);

  obs.pipe(
    catchError(err => {
      console.error('Error al registrar la reacción:', err);
      this.mostrarMensaje('Error al procesar la reacción.');

      this.actualizarEstadoReaccionLocal(review, review.reaccionUsuario!);
      return throwError(() => new Error('Error en la reacción'));
    })
  ).subscribe();
}
actualizarEstadoReaccionLocal(reviewActual: Review, nuevaReaccion: TipoReaccion): void {
  const reviewsSignal = this.modoVista === 'cafe'
    ? this.reviewsCafeSignal
    : this.reviewsUsuarioSignal;

  reviewsSignal.update(reviews =>
    reviews.map(r => {
      if (r.id !== reviewActual.id) return r;

      let likes = r.likes;
      let dislikes = r.dislikes;
      const reaccionActual = r.reaccionUsuario;

      if (reaccionActual === 'LIKE') likes--;
      if (reaccionActual === 'DISLIKE') dislikes--;

      if (reaccionActual === nuevaReaccion) {
        return { ...r, likes, dislikes, reaccionUsuario: null };
      }

      if (nuevaReaccion === 'LIKE') likes++;
      if (nuevaReaccion === 'DISLIKE') dislikes++;

      return { ...r, likes, dislikes, reaccionUsuario: nuevaReaccion };
    })
  );
}

}