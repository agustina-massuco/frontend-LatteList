import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import User from '../../model/User';
import { catchError, EMPTY, of, switchMap, tap, throwError } from 'rxjs';
import { ModalDrawerComponent } from '../../../../shared/modal-drawer/modal-drawer.component';
import { ForgotPassword } from '../forgot-password/forgot-password';


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


  showForgotModal = signal<boolean>(false);

  constructor(
    public fb: FormBuilder,
    private authSer: AuthService,
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
               /* this.mensajeError = 'Tu cuenta estaba inactiva. Reactivando tu perfil...';
              
                return this.userSer.darDeAltaUsuarioCompleto(user.id!).pipe(
                    tap(reactivatedUser => {
                        this.mensajeError = '¡Reactivación exitosa!';
                        this.authSer.actualizarToken(reactivatedUser); 
                    }),
                    catchError(e => {
                        console.error('Error reactivando:', e);
                        return throwError(() => new Error('REACTIVACION_FALLIDA'));
                    })
                );*/

            case 'DESACTIVADO':
            case 'ELIMINADO':
                // Bloqueo total
             //   return throwError(() => new Error('CUENTA_BLOQUEADA'));

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

        let msg = 'Error desconocido durante el inicio de sesión.';

        if (e.message === 'Credenciales inválidas') {
            msg = 'Credenciales inválidas. Verifica email y contraseña.';
        } else if (e.message === 'CUENTA_BLOQUEADA') {
            msg = 'Tu cuenta ha sido suspendida o eliminada permanentemente. Contacta al soporte.';
        } else if (e.message === 'REACTIVACION_FALLIDA') {
            msg = 'Hubo un error al intentar reactivar tu cuenta. Intenta más tarde.';
        }

        this.mensajeError = msg;
        return EMPTY; 
      })
    ).subscribe();
  }


}