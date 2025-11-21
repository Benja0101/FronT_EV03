import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class Login {
  username = '';
  password = '';
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    console.log('🔧 LoginComponent inicializado');
    console.log('📍 AuthService disponible:', !!this.authService);
  }

  login() {
    console.log('🚀 Método login() ejecutado');
    console.log('👤 Username:', this.username);
    console.log('🔑 Password:', this.password ? '***' : '(vacío)');
    
    this.error = '';
    
    this.authService.login({ username: this.username, password: this.password })
      .subscribe({
        next: () => {
          console.log('✅ Login exitoso');
          this.router.navigate(['/clientes']);
        },
        error: (err) => {
          console.error('❌ Error de login', err);
          this.error = err.error?.detail || 'Credenciales inválidas. Intente nuevamente.';
        }
      });
  }
}
