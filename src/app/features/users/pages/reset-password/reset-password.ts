import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; 
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import { UserRegistro } from '../user-registro/user-registro'; 
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule], 
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  
  form!: FormGroup;
  token: string = '';
  mostrarClave: boolean = false;
  mostrarConfirmarClave: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authSer: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'];

    if (!this.token) {
      this.toast.error('Enlace inválido o incompleto.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), UserRegistro.passwordValidator, UserRegistro.noWhitespaceValidator]],
      confirmPassword: ['', Validators.required]
    }, { validators: UserRegistro.passwordsMatchValidator });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.authSer.resetPassword(this.token, this.form.value.password).subscribe({
      next: () => {
        this.toast.success('¡Contraseña restablecida! Inicia sesión.');
        this.router.navigate(['/auth/login']);
      },
      error: (e) => {
        this.toast.error('El enlace ha expirado o es inválido.');
      }
    });
  }

  toggleVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') this.mostrarClave = !this.mostrarClave;
    else if (field === 'confirmPassword') this.mostrarConfirmarClave = !this.mostrarConfirmarClave;
  }
}