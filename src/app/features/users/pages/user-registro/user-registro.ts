import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth-service';
import { UserService } from '../../service/user-service';
import { ToastService } from '../../../../shared/toast/toast.service';
import User from '../../model/User';

@Component({
  selector: 'app-user-registro',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-registro.html',
  styleUrl: './user-registro.css',
})
export class UserRegistro implements OnInit {

  form!: FormGroup;
  mode: 'registro' | 'admin' | 'edit' = 'registro';
  userId: number | null = null; 
  fotoPreview: string | null = null;
  emailOriginal!: string;
  mostrarClave: boolean = false;
  mostrarConfirmarClave: boolean = false;


  static noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }

  static passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    if (!value) return null;

    const errors: ValidationErrors = {};
    if (!/[A-Z]/.test(value)) errors['noMayuscula'] = true;
    if (!/[a-z]/.test(value)) errors['noMinuscula'] = true;
    if (!/\d/.test(value)) errors['noNumero'] = true;
    if (!/[@$!%*?&]/.test(value)) errors['noEspecial'] = true;
    
    return Object.keys(errors).length ? errors : null;
  }

  static passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const passwordControl = group.get('password');
    const confirmPasswordControl = group.get('confirmPassword');

    if (!passwordControl || !confirmPasswordControl || confirmPasswordControl.pristine) {
      return null;
    }
    if (passwordControl.value !== confirmPasswordControl.value) {
      confirmPasswordControl.setErrors({ mismatch: true });
      return { passwordsMismatch: true };
    }
    if (confirmPasswordControl.hasError('mismatch')) {
       const errors = { ...confirmPasswordControl.errors };
       delete errors['mismatch'];
       confirmPasswordControl.setErrors(Object.keys(errors).length ? errors : null);
    }
    return null;
  }

  constructor(
    private fb: FormBuilder,
    private authSer: AuthService,
    private userSer: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.determinarModo();
    this.inicializarFormulario();
    if (this.mode === 'edit') {
      this.cargarDatosParaEdicion();
    }
  }


  onSubmit() {
    if (this.form.invalid) {
      this.toast.warning('Por favor, revisa los errores en el formulario.');
      this.form.markAllAsTouched(); 
      return;
    }

    if (this.mode === 'edit' && !this.isFormDirty) {
      this.toast.info('No se detectaron cambios para guardar.');
      return;
    }

    const formValue = this.form.value;
    
    const userToSend: User = {
        id: this.userId || 0, 
        nombre: formValue.nombre.trim(), 
        apellido: formValue.apellido.trim(),
        email: formValue.email.trim(),
        password: formValue.password || '', 
        tipoUser: formValue.tipoUser,
        estado: 'ACTIVO', 
        fotoPerfil: this.fotoPreview || undefined
          };

    if (this.mode === 'edit' && userToSend.email === this.emailOriginal) {
        this.procesarActualizacion(userToSend);
    } else {
        this.userSer.verificarEmailExistente(userToSend.email).subscribe(existe => {
            if (existe) {
                this.toast.error('Ese email ya está registrado.');
            } else {
                if (this.mode === 'edit') {
                    this.procesarActualizacion(userToSend);
                } else {
                    this.procesarCreacion(userToSend);
                }
            }
        });
    }
  }


  private procesarActualizacion(user: User) {
    this.userSer.putUser(user).subscribe({
      next: (userActu) => {
        this.toast.success('Perfil actualizado con éxito.');
        this.authSer.actualizarToken(userActu); 
        this.form.markAsPristine();
        this.router.navigate(['/auth/perfil']);
      },
      error: (e) => {
        this.toast.error(e.message || 'Error al actualizar perfil');
      }
    });
  }

  private procesarCreacion(user: User) {
    this.userSer.postUser(user).subscribe({
      next: (response) => {
        this.toast.success('Registro completado con éxito.');
        
        if (this.mode === 'admin') {
          this.form.reset();
          this.router.navigate(['/admin/listado']);
        } else {
          this.authSer.login(user.email, user.password!).subscribe({
            next: () => this.router.navigate(['/home']),
            error: () => {
                this.toast.warning('Cuenta creada, por favor inicia sesión.');
                this.router.navigate(['/auth/login']);
            }
          });
        }
      },
      error: (e) => {
        this.toast.error(e.message || 'Error al registrar usuario');
      }
    });
  }


  private inicializarFormulario() {
    let tipoUserDefecto = 'cliente';
    if (this.mode === 'admin') tipoUserDefecto = 'admin';

    const formControls: any = {
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), UserRegistro.noWhitespaceValidator]],
      apellido: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), UserRegistro.noWhitespaceValidator]],
      email: ['', [Validators.required, Validators.email]],
      tipoUser: [tipoUserDefecto],
      fotoPerfil: []
    };

    let formOptions: any = {};

    if (this.mode !== 'edit') {
      formControls['password'] = ['', [
        Validators.required,
        Validators.minLength(8),
        UserRegistro.passwordValidator
      ]];
      formControls['confirmPassword'] = ['', Validators.required];  
      formOptions['validators'] = [UserRegistro.passwordsMatchValidator];
    }

    this.form = this.fb.group(formControls, formOptions);
  }

  private cargarDatosParaEdicion(): void {
    if (this.userId) {
      const user = this.authSer.getUserFromToken();
      if (user) {
        this.form.patchValue({
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          tipoUser: user.tipoUser,
          fotoPerfil: user.fotoPerfil
        });
        this.fotoPreview = user.fotoPerfil || null;
        this.emailOriginal = user.email;
        this.form.markAsPristine();
      }
    }
  }


  quitarFotoPerfil(): void {
    this.fotoPreview = null; 
    this.form.patchValue({ fotoPerfil: null }); 
    const fileInput = document.getElementById('fotoPerfilInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }



  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        this.toast.warning('Por favor sube solo archivos de imagen.');
        return;
    }

    this.comprimirImagen(file).then(base64Comprimido => {
        this.fotoPreview = base64Comprimido;
        this.form.patchValue({ fotoPerfil: this.fotoPreview });
        this.form.markAsDirty();
    }).catch(err => {
        console.error(err);
        this.toast.error('Error al procesar la imagen');
    });
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


  
  toggleVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') this.mostrarClave = !this.mostrarClave;
    else if (field === 'confirmPassword') this.mostrarConfirmarClave = !this.mostrarConfirmarClave;
  }

  volver(): void {
    if (this.mode === 'edit') this.router.navigate(['/auth/perfil']);
    else if (this.mode === 'admin') this.router.navigate(['/admin/listado']);
    else this.router.navigate(['/home']);
  }

  get isFormDirty(): boolean {
    return this.form ? this.form.dirty : false;
  }

  private determinarModo() {
    const urlSegments = this.route.snapshot.url.map(segment => segment.path).join('/');
    if (urlSegments.includes('registrarAdmin')) {
      this.mode = 'admin';
    } else if (urlSegments.includes('perfil/editar')) {
      this.mode = 'edit';
      const user = this.authSer.getUserFromToken();
      if (user) this.userId = user.id; 
      else this.router.navigate(['/auth/login']);
    }
  }
}