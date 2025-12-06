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
  ) {}

  login() {
    this.error = '';
    
    this.authService.login({ username: this.username, password: this.password })
      .subscribe({
        next: () => {
          // Verificar que el token esté guardado antes de navegar
          const token = localStorage.getItem('access_token');
          if (token) {
            this.router.navigate(['admin/dashboard']);
          } else {
            this.error = 'Error al guardar la sesión. Intente nuevamente.';
          }
        },
        error: (err) => {
          this.error = err.error?.detail || 'Credenciales inválidas. Intente nuevamente.';
        }
      });
  }

  goToClientHome() {
    this.router.navigate(['cliente/home']);
  }
}
