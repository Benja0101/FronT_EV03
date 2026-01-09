import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, ClienteLoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-login-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-cliente.component.html',
  styleUrls: ['./login-cliente.component.css']
})
export class LoginClienteComponent {
  email = '';
  password = '';
  error = '';
  loading = false;
  mostrarPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  login() {
    this.error = '';
    
    if (!this.email || !this.password) {
      this.error = 'Por favor, completa todos los campos';
      return;
    }

    this.loading = true;

    const credentials: ClienteLoginRequest = {
      email: this.email,
      password: this.password
    };

    this.authService.loginCliente(credentials).subscribe({
      next: (response) => {
        console.log('Login exitoso', response);
        // El token y datos ya fueron guardados en el AuthService
        this.router.navigate(['/cliente/home']);
      },
      error: (err) => {
        console.error('Error en login', err);
        this.loading = false;
        
        if (err.error?.detail) {
          this.error = err.error.detail;
        } else if (err.error?.message) {
          this.error = err.error.message;
        } else if (err.status === 401) {
          this.error = 'Correo o contraseña incorrectos';
        } else if (err.status === 404) {
          this.error = 'Usuario no encontrado. Verifica tu correo electrónico';
        } else {
          this.error = 'Error al iniciar sesión. Intenta nuevamente';
        }
      }
    });
  }

  irAlRegistro() {
    this.router.navigate(['/registro-cliente']);
  }

  irAlHome() {
    this.router.navigate(['/cliente/home']);
  }

  irAlLoginAdmin() {
    this.router.navigate(['/login']);
  }
}
