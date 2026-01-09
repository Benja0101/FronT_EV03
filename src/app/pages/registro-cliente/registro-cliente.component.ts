import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClienteService, ClienteRegisterRequest } from '../../services/cliente.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro-cliente.component.html',
  styleUrls: ['./registro-cliente.component.css']
})
export class RegistroClienteComponent {
  registroData: ClienteRegisterRequest = {
    rut: '',
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    comuna: '',
    direccion: '',
    telefono: ''
  };
  
  confirmPassword = '';
  error = '';
  success = '';
  loading = false;
  mostrarPassword = false;
  mostrarConfirmPassword = false;

  constructor(
    private clienteService: ClienteService,
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  toggleConfirmPassword() {
    this.mostrarConfirmPassword = !this.mostrarConfirmPassword;
  }

  validarRUT(rut: string): boolean {
    // Eliminar puntos y guión
    const rutLimpio = rut.replace(/\./g, '').replace('-', '');
    
    if (rutLimpio.length < 2) return false;
    
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toUpperCase();
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplo = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo.charAt(i)) * multiplo;
      multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    
    return dv === dvCalculado;
  }

  formatearRUT() {
    let rut = this.registroData.rut.replace(/\./g, '').replace('-', '');
    
    if (rut.length > 1) {
      const cuerpo = rut.slice(0, -1);
      const dv = rut.slice(-1);
      
      // Formatear con puntos
      const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      this.registroData.rut = `${cuerpoFormateado}-${dv}`;
    }
  }

  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validarTelefono(telefono: string): boolean {
    // Formato chileno: +56 9 XXXX XXXX o 9 XXXX XXXX
    const telefonoRegex = /^(\+?56)?(\s?)(9)(\d{8})$/;
    return telefonoRegex.test(telefono.replace(/\s/g, ''));
  }

  validarFormulario(): boolean {
    this.error = '';

    if (!this.registroData.rut || !this.registroData.nombre || !this.registroData.apellido ||
        !this.registroData.email || !this.registroData.password || !this.registroData.comuna) {
      this.error = 'Todos los campos marcados con * son obligatorios';
      return false;
    }

    if (!this.validarRUT(this.registroData.rut)) {
      this.error = 'El RUT ingresado no es válido';
      return false;
    }

    if (!this.validarEmail(this.registroData.email)) {
      this.error = 'El correo electrónico no es válido';
      return false;
    }

    if (this.registroData.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    if (this.registroData.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return false;
    }

    if (this.registroData.telefono && !this.validarTelefono(this.registroData.telefono)) {
      this.error = 'El teléfono debe tener el formato: +56 9 XXXX XXXX o 9 XXXX XXXX';
      return false;
    }

    return true;
  }

  registrar() {
    if (!this.validarFormulario()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.clienteService.registerCliente(this.registroData).subscribe({
      next: (response) => {
        console.log('Cliente registrado exitosamente', response);
        this.success = '¡Registro exitoso! Redirigiendo...';
        
        // Guardar token y datos del cliente
        if (response.token) {
          localStorage.setItem('cliente_token', response.token);
          localStorage.setItem('cliente_data', JSON.stringify(response.cliente));
          localStorage.setItem('cliente_rut', response.cliente.rut);
          localStorage.setItem('user_type', 'cliente');
        }
        
        setTimeout(() => {
          this.router.navigate(['/cliente/home']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error al registrar cliente', err);
        this.loading = false;
        
        if (err.error) {
          if (err.error.rut) {
            this.error = 'El RUT ya está registrado';
          } else if (err.error.email) {
            this.error = 'El correo electrónico ya está registrado';
          } else if (typeof err.error === 'object') {
            const errores = Object.keys(err.error).map(k => {
              const mensaje = Array.isArray(err.error[k]) ? err.error[k][0] : err.error[k];
              return `${k}: ${mensaje}`;
            });
            this.error = errores.join(' | ');
          } else {
            this.error = err.error;
          }
        } else {
          this.error = 'Error al registrar. Por favor, intente nuevamente.';
        }
      }
    });
  }

  irAlLogin() {
    this.router.navigate(['/login-cliente']);
  }
}
