import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import User from '../../model/User';
import { catchError, EMPTY, of, switchMap, tap, throwError } from 'rxjs';
import { ModalDrawerComponent } from '../../../../shared/modal-drawer/modal-drawer.component';
import { ForgotPassword } from '../forgot-password/forgot-password';
import { UserService } from '../../service/user-service';


@Component({
  selector: 'app-user-login',
  imports: [ReactiveFormsModule, RouterLink, ModalDrawerComponent, ForgotPassword], 
  templateUrl: './user-login.html',
  styleUrl: './user-login.css',
})
export class UserLogin implements OnInit {

  loginForm!: FormGroup;
  mensajeError: string | null = null;
  isProcessing: boolean = false;
  mostrarClave: boolean = false;
  usuarioParaReactivar: User | null = null;


  showForgotModal = signal<boolean>(false);
  showReactivateModal = signal<boolean>(false);


  constructor(
    public fb: FormBuilder,
    private authSer: AuthService,
    private userSer: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

   toggleVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') this.mostrarClave = !this.mostrarClave;
  }

  onSubmit() {
    this.mensajeError = null;
    this.isProcessing = true;
    
    if (this.loginForm.invalid) {
      this.mensajeError = 'Credenciales inválidas. Por favor, verifica tu email y contraseña.';
      this.isProcessing = false;
      return;
    }

    this.authSer.login(this.loginForm.value.email, this.loginForm.value.password).pipe(
      
      switchMap((user: User) => {
          console.log("Usuario recibido:", user.nombre, "Estado:", user.estado);

          switch (user.estado) {
            case 'ACTIVO':
                return of(user);

            case 'INACTIVO':
               return throwError(() => new Error('CUENTA_SUSPENDIDA'));

            case 'DESACTIVADO':

                this.usuarioParaReactivar = user;
                this.showReactivateModal.set(true); 
                this.isProcessing = false; 
                return EMPTY; 

            case 'ELIMINADO':
                return throwError(() => new Error('CUENTA_ELIMINADA'));

            default:
                return throwError(() => new Error('ESTADO_DESCONOCIDO'));
          }
      }),
      
      tap(() => {
        console.log('Login finalizado con éxito');
        this.loginForm.reset();
        this.isProcessing = false;
        this.router.navigate(['/home']); 
      }),

      catchError((e) => {
        this.isProcessing = false;
        console.error('Error en proceso de login:', e);
        this.manejarErroresLogin(e); 
        return EMPTY; 
})
    ).subscribe();
  }

  confirmarReactivacion() {
    if (!this.usuarioParaReactivar?.id) return;

    this.isProcessing = true; 

    this.userSer.cambiarEstadoUsuario(this.usuarioParaReactivar.id, 'ACTIVO').subscribe({
      next: () => {
        console.log("Cuenta reactivada con éxito");
        this.showReactivateModal.set(false);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error("Error al reactivar", err);
        this.mensajeError = "No se pudo reactivar la cuenta. Intenta más tarde.";
        this.isProcessing = false;
        this.showReactivateModal.set(false);
      }
    });
  }

  cancelarReactivacion() {
    this.showReactivateModal.set(false);
    this.usuarioParaReactivar = null;
    this.authSer.logout(); 
    this.loginForm.reset();
  }

  private manejarErroresLogin(e: any) {
    if (e.message === 'CUENTA_SUSPENDIDA') {
        this.mensajeError = 'Tu cuenta ha sido suspendida por un administrador debido al incumplimiento de normas.';
        return;
    }
    if (e.message === 'CUENTA_ELIMINADA') {
        this.mensajeError = 'Esta cuenta fue eliminada permanentemente y no puede recuperarse.';
        return;
    }

    if (e.status === 403) {
       
        const msgBackend = typeof e.error === 'string' ? e.error : e.error?.message;
        
        if (msgBackend && (msgBackend.includes('suspendida') || msgBackend.includes('bloqueada'))) {
             this.mensajeError = 'Tu cuenta ha sido suspendida por un administrador.';
        } else {
             this.mensajeError = 'Credenciales inválidas. Verifica email y contraseña.';
        }
    } 
    else if (e.status === 401 || e.message === 'Credenciales inválidas') {
        this.mensajeError = 'Credenciales inválidas. Verifica email y contraseña.';
    } 
    else {
        this.mensajeError = 'Error desconocido durante el inicio de sesión.';
    }
  }


}