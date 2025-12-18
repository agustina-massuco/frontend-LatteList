import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth-service';
import { UserService } from '../../service/user-service';
import { Router } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { UserRegistro } from '../user-registro/user-registro'; 
import { ModalDrawerComponent } from '../../../../shared/modal-drawer/modal-drawer.component';
import { ForgotPassword } from '../forgot-password/forgot-password';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../shared/Icons/app-icon-componet';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ModalDrawerComponent, ForgotPassword, IconComponent],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword implements OnInit {

  form!: FormGroup;
  mensajeError: string = '';

  mostrarClaveActual = false;
  mostrarNuevaClave = false;
  mostrarConfirmarClave = false;
  
  showForgotModal = false;

  constructor(
    public fb: FormBuilder,
    private authSer: AuthService,
    private userSer: UserService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      claveActual: ['', Validators.required],
      nuevaClave: ['', [Validators.required, Validators.minLength(8), UserRegistro.passwordValidator]], 
      confirmarClave: ['', Validators.required]
    }, {
      validators: [this.passwordsMatchValidator]
    });
  }

  onSubmit() {
    this.mensajeError = '';
    
    if (this.form.invalid) {
      this.toastService.warning('Verifique los errores en el formulario');
      return;
    }

    const actual = this.form.get('claveActual')?.value;
    const nueva = this.form.get('nuevaClave')?.value;

    this.userSer.changePassword(actual, nueva).subscribe({
      next: () => {
        this.toastService.success('Contraseña actualizada. Inicia sesión nuevamente.');
        this.authSer.logout();
        this.router.navigate(['/auth/login']);
      },
      error: (e) => {
        console.error(e);
        
        const msg = e.error?.message || 'Error al cambiar la contraseña.';
        
        if (msg.toLowerCase().includes('igual a la anterior')) {
             this.form.get('nuevaClave')?.setErrors({ sameAsOld: true });
        } 
        else if (msg.toLowerCase().includes('incorrecta')) {
             this.form.get('claveActual')?.setErrors({ incorrect: true });
             this.mensajeError = 'La contraseña ingresada no coincide con la actual.';
        } 
        else {
             this.toastService.error(msg);
             this.mensajeError = msg; 
        }
      }
    });
  }
  
  passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
      const nueva = group.get('nuevaClave');
      const confirmar = group.get('confirmarClave');
      if (!nueva || !confirmar || confirmar.pristine) return null;
      return nueva.value === confirmar.value ? null : { mismatch: true };
  }
  
  volver() {
    this.router.navigate(['/usuarios/perfil']);
  }
  
  toggleVisibility(field: 'actual' | 'nueva' | 'confirmar') {
    if (field === 'actual') this.mostrarClaveActual = !this.mostrarClaveActual;
    if (field === 'nueva') this.mostrarNuevaClave = !this.mostrarNuevaClave;
    if (field === 'confirmar') this.mostrarConfirmarClave = !this.mostrarConfirmarClave;
  }
}