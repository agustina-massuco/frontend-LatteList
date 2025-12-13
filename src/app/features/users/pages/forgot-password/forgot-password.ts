import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth-service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})

export class ForgotPassword {
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  cargando = false;

  @Output() close = new EventEmitter<void>(); 

  constructor(private authSer: AuthService, private toast: ToastService) {}

  enviar() {
    if (this.emailControl.invalid) return;
    this.cargando = true;
    
    this.authSer.forgotPassword(this.emailControl.value!).subscribe({
      next: () => {
        this.cargando = false;
        this.toast.success('Correo enviado.');
        this.close.emit(); 
      },
      error: () => {
        this.cargando = false;
        this.toast.success('Si existe, se envió.');
        this.close.emit(); 
      }
    });
  }

  cancelar() {
    this.close.emit(); 
  }
}