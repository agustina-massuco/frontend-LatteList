import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import { UserService } from '../../service/user-service';
import { forkJoin } from 'rxjs';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewList } from '../../../review/pages/review-list/review-list';
import { ReviewForm } from '../../../review/pages/review-form/review-form';
import User from '../../model/User';
import Review from '../../../review/model/Review';
import Cafe from '../../../cafes/model/CafeModel';
import { ReviewService } from '../../../review/service/review-service';
import { CafeService } from '../../../cafes/service/cafeService';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [RouterLink, CommonModule, DecimalPipe, FormsModule, ReviewList, ReviewForm],
  templateUrl: './user-details.html',
  styleUrl: './user-details.css',
})
export class UserDetails implements OnInit {

  user: User | null = null;
  viendoMiPerfil: boolean = false;
  readonly defaultProfileImage = '/images/grano.png';

  allUserReviews: Review[] = []; 
  
  cafeMap = new Map<string, Cafe>(); 

  loadingReviews: boolean = true;
  loadingError: string = '';

  formVisible: boolean = false;
  reviewEditar: Review | null = null;
  cafeSeleccionado: Cafe | null = null;

  modalVisible: boolean = false;
  modalTitulo: string = '';
  modalMensaje: string = '';

  accionPendiente: 'desactivar_propia' | 'inactivar_ajena' | 'eliminar_user' | 'alta_user' | 
                   'baja_review' | 'alta_review' | 'eliminar_review' | null = null;

  idAfectada?: string | number;
  reviewAfectada?: Review;
  menuResenaAbiertoId: string | null = null;
  isOnlyAdmin: boolean = false;

  constructor(
    private route: ActivatedRoute,
    public authSer: AuthService,
    private userSer: UserService,
    private router: Router,
    private reviewSer: ReviewService, 
    private cafeSer: CafeService,
    private tostada: ToastService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const urlId = params.get('id');

      if (urlId) {
        this.cargarPerfil(urlId);
      } else {
        const logUser = this.authSer.getUserFromToken();
        if (logUser && logUser.id) {
          this.cargarPerfil(logUser.id.toString());
          this.viendoMiPerfil = true;
        } else {
          this.router.navigate(['/home']);
        }
      }
    });
  }

  calcularPromedioPuntuacion(): number {
    if (!this.allUserReviews || this.allUserReviews.length === 0) return 0;
    const total = this.allUserReviews.reduce((sum, r) => sum + r.puntuacion, 0);
    return total / this.allUserReviews.length;
  }

  cargarPerfil(userId: string) {
    this.userSer.getUser(userId).subscribe({
      next: (data) => {
        this.user = data;
        
        const loggedUser = this.authSer.getUserFromToken();
        this.viendoMiPerfil = loggedUser ? loggedUser.id.toString() === userId.toString() : false;
        
        if (this.user.tipoUser === 'ADMIN') {
            this.loadingReviews = false;
        } else {
            this.cargarReviewsYCafes(userId);
        }
      },
      error: (e) => {
        console.error('Error cargando el perfil', e);
        this.router.navigate(['/home']); 
      }
    });
  }

  cargarReviewsYCafes(userId: string) {
    this.loadingReviews = true;
    this.loadingError = '';
    
    const soyAdmin = this.authSer.isAdmin();
    const userIdNum = Number(userId);

    forkJoin({
        cafes: this.cafeSer.getAllCafes(),
        reviews: this.reviewSer.getByUsuario(userIdNum, soyAdmin) 
    }).subscribe({
      next: ({ cafes, reviews }) => {
        
        this.cafeMap = new Map(cafes.map(c => [c.id!.toString(), c]));

        const reviewsTyped = reviews as unknown as Review[];
        this.allUserReviews = reviewsTyped.filter(r => r.estado !== 'ELIMINADO');
        
        this.loadingReviews = false;
      },
      error: (err) => {
        console.error('Error cargando datos:', err);
        this.loadingError = 'No se pudieron cargar las reseñas.';
        this.loadingReviews = false;
      }
    });
  }

  confirmarDesactivacionPropia() {
    this.modalTitulo = 'Pausar mi Cuenta';
    this.modalMensaje = 'Tu cuenta pasará será desactivada. No serás visible, pero tus datos se guardan.';
    this.accionPendiente = 'desactivar_propia';
    this.idAfectada = this.user!.id;
    this.modalVisible = true;
  }

  confirmarEliminacionPropia() {
    this.modalTitulo = 'Eliminar mi Cuenta Definitivamente';
    this.modalMensaje = 'Acción IRREVERSIBLE. Tus listas se borrarán y tus reseñas desaparecerán.';
    this.accionPendiente = 'eliminar_user';
    this.idAfectada = this.user!.id;
    this.modalVisible = true;
  }

  confirmarInactivacionAjena() {
    this.modalTitulo = 'Suspender Usuario (Ban)';
    this.modalMensaje = 'El usuario pasará a estado INACTIVO ya no podra ingresar a su cuenta y sus reseñas no seran visibles al publico.';
    this.accionPendiente = 'inactivar_ajena';
    this.idAfectada = this.user!.id;
    this.modalVisible = true;
  }

  darDeAltaUser(id: number) {
    this.modalTitulo = 'Reactivar Usuario';
    this.modalMensaje = 'El usuario volverá a estar ACTIVO y visible.';
    this.accionPendiente = 'alta_user';
    this.idAfectada = id;
    this.modalVisible = true;
  }

  ejecutarAccionConfirmada() {
    this.modalVisible = false;
    const id = this.idAfectada;
    if (!id) return;

    if (this.accionPendiente === 'desactivar_propia') {
        this.userSer.cambiarEstadoUsuario(id, 'DESACTIVADO').subscribe(() => this.logoutAndRedirect());
    } 
    else if (this.accionPendiente === 'inactivar_ajena') {
        this.userSer.cambiarEstadoUsuario(id, 'INACTIVO').subscribe(() => this.recargarPerfil());
    }
    else if (this.accionPendiente === 'alta_user') {
        this.userSer.cambiarEstadoUsuario(id, 'ACTIVO').subscribe(() => this.recargarPerfil());
    }
    else if (this.accionPendiente === 'eliminar_user') {
        this.userSer.deleteUser(id).subscribe(() => {
            this.logoutAndRedirect(); 
        });
    }

    else if (this.reviewAfectada) {
        const reviewIdNum = Number(this.reviewAfectada.id);

        if (this.accionPendiente === 'baja_review') {
             this.reviewSer.desactivar(reviewIdNum).subscribe(() => this.updateReviewState('INACTIVO'));
        }
        else if (this.accionPendiente === 'alta_review') {
             this.reviewSer.activar(reviewIdNum).subscribe(() => this.updateReviewState('ACTIVO'));
        }
        else if (this.accionPendiente === 'eliminar_review') {
             this.reviewSer.eliminar(reviewIdNum).subscribe(() => {
                this.allUserReviews = this.allUserReviews.filter(r => r.id !== this.reviewAfectada!.id);
             });
        }
    }

    this.resetModalState();
  }

  private updateReviewState(nuevoEstado: 'ACTIVO' | 'INACTIVO') {
    if (this.reviewAfectada) {
        this.reviewAfectada.estado = nuevoEstado;
        if (!this.authSer.isAdmin() && nuevoEstado === 'INACTIVO') {
             this.allUserReviews = this.allUserReviews.filter(r => r.id !== this.reviewAfectada!.id);
        }
    }
  }

  private recargarPerfil() {
    if (this.user) this.cargarPerfil(this.user.id.toString());
  }

  private logoutAndRedirect() {
    this.authSer.logout();
    this.router.navigate(['/home']);
  }

  getFotoPerfil(user: User): string { return user.fotoPerfil || this.defaultProfileImage; }
  
  toggleMenuResena(menuId: string) { 
      this.menuResenaAbiertoId = this.menuResenaAbiertoId === menuId ? null : menuId; 
  }
  
  cerrarMenuResena(menuId: string) { 
      setTimeout(() => { if (this.menuResenaAbiertoId === menuId) this.menuResenaAbiertoId = null; }, 150); 
  }
  
  abrirSelectorFoto() { 
    if (this.viendoMiPerfil) document.getElementById('file-selector')?.click(); 
  }

  async onFileSelected(event: any) { 
    const file = event.target.files[0];
    
    if (!file || !this.user) return;

    if (!file.type.startsWith('image/')) {
        console.warn('No es una imagen válida');
        return;
    }

    try {
        const base64Comprimido = await this.comprimirImagen(file);
        
        const usuarioActualizado: User = {
            ...this.user,
            fotoPerfil: base64Comprimido
        };

        this.userSer.putUser(usuarioActualizado).subscribe({
            next: (uResponse) => {
                this.authSer.actualizarToken(uResponse); 
                this.user = uResponse; 
                this.tostada.success('Foto actualizada correctamente');
            },
            error: (err) => {
                console.error('Error al subir la foto:', err);
                this.tostada.error('Error al actualizar la foto');
            }
        });
    } catch (error) {
        console.error('Error al procesar la imagen:', error);
    }
  }

  private comprimirImagen(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const scaleSize = MAX_WIDTH / img.width;
          
          const finalWidth = (img.width > MAX_WIDTH) ? MAX_WIDTH : img.width;
          const finalHeight = (img.width > MAX_WIDTH) ? (img.height * scaleSize) : img.height;

          canvas.width = finalWidth;
          canvas.height = finalHeight;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, finalWidth, finalHeight);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7); 
          resolve(dataUrl);
        };
        
        img.onerror = (error) => reject(error);
      };
      
      reader.onerror = (error) => reject(error);
    });
  }

  abrirEdicionReview(review: Review) {
     this.reviewEditar = review; 
     this.cafeSeleccionado = this.cafeMap.get(review.cafeId.toString()) || null; 
     this.formVisible = true; 
  }
 
  cancelarResena() { 
    this.reviewEditar = null; this.formVisible = false; 
  }

  manejarResenaEnviada(review: Review) { 
    this.cancelarResena(); this.recargarReviewsUsuario(); 
  }

  recargarReviewsUsuario() { 
    if (this.user) this.cargarReviewsYCafes(this.user.id.toString()); 
  }
  
  darDeBajaReview(review: Review) {
    this.modalTitulo = 'Confirmar Baja de Reseña';
    this.modalMensaje = `¿Estás seguro de dar de baja la reseña?`;
    this.accionPendiente = 'baja_review';
    this.reviewAfectada = review;
    this.modalVisible = true;
  }

  darDeAltaReview(review: Review) {
    this.modalTitulo = 'Confirmar Activación de Reseña';
    this.modalMensaje = `¿Estás seguro de activar la reseña?`;
    this.accionPendiente = 'alta_review';
    this.reviewAfectada = review;
    this.modalVisible = true;
  }

  eliminarReviewDefinitivo(review: Review) {
    this.modalTitulo = 'Confirmar Eliminación DEFINITIVA';
    this.modalMensaje = `¿Estás seguro de ELIMINAR la reseña permanentemente?`;
    this.accionPendiente = 'eliminar_review';
    this.reviewAfectada = review;
    this.modalVisible = true;
  }

  resetModalState() {
     this.accionPendiente = null;
     this.idAfectada = undefined;
     this.reviewAfectada = undefined;
  }
}