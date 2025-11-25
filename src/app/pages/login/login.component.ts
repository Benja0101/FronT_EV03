import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';

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
          console.log('✅ Login exitoso, verificando token...');
          
          // Verificar que el token esté realmente guardado antes de navegar
          const token = localStorage.getItem('access_token');
          if (token) {
            console.log('✅ Token confirmado en localStorage:', token.substring(0, 20) + '...');
            console.log('🔄 Redirigiendo a dashboard...');
            this.router.navigate(['admin/dashboard']);
          } else {
            console.error('❌ Token no encontrado después del login');
            this.error = 'Error al guardar la sesión. Intente nuevamente.';
          }
        },
        error: (err) => {
          console.error('❌ Error de login', err);
          this.error = err.error?.detail || 'Credenciales inválidas. Intente nuevamente.';
        }
      });
  }

  goToClientHome() {
    console.log('🏠 Navegando a home de clientes');
    this.router.navigate(['cliente/home']);
  }
}
