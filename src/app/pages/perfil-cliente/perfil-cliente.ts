import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService, Cliente } from '../../services/cliente.service';

@Component({
  selector: 'app-perfil-cliente',
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil-cliente.html',
  styleUrl: './perfil-cliente.css',
})
export class PerfilCliente implements OnInit {
  rutCliente: string = '';
  cliente: Cliente | null = null;
  loading = false;
  error = '';
  success = '';
  editando = false;

  datosEdicion = {
    nombre: '',
    apellido: '',
    email: '',
    comuna: ''
  };

  constructor(
    private clienteService: ClienteService,
    private router: Router
  ) {}

  ngOnInit() {
    // Intentar obtener RUT del localStorage (guardado durante checkout)
    const ventaPendiente = localStorage.getItem('ventaPendiente');
    const pagoCompletado = localStorage.getItem('pagoCompletado');
    
    if (pagoCompletado) {
      const pago = JSON.parse(pagoCompletado);
      this.rutCliente = pago.cliente?.rut || '';
    } else if (ventaPendiente) {
      const venta = JSON.parse(ventaPendiente);
      this.rutCliente = venta.cliente?.rut || '';
    }

    // Si no hay RUT, pedir al usuario que lo ingrese
    if (!this.rutCliente) {
      // Mostrar formulario de búsqueda
      return;
    }

    this.cargarPerfil();
  }

  buscarPerfil() {
    if (!this.rutCliente || this.rutCliente.trim() === '') {
      this.error = 'Por favor, ingresa tu RUT';
      return;
    }

    this.cargarPerfil();
  }

  cargarPerfil() {
    this.loading = true;
    this.error = '';

    this.clienteService.getCliente(this.rutCliente).subscribe({
      next: (data) => {
        this.cliente = data;
        this.datosEdicion = {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email || '',
          comuna: data.comuna
        };
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se encontró un perfil con ese RUT. Debes realizar una compra primero.';
        this.loading = false;
        this.cliente = null;
      }
    });
  }

  iniciarEdicion() {
    this.editando = true;
    this.error = '';
    this.success = '';
  }

  cancelarEdicion() {
    this.editando = false;
    if (this.cliente) {
      this.datosEdicion = {
        nombre: this.cliente.nombre,
        apellido: this.cliente.apellido,
        email: this.cliente.email || '',
        comuna: this.cliente.comuna
      };
    }
  }

  guardarCambios() {
    if (!this.cliente) return;

    // Validaciones
    if (!this.datosEdicion.nombre || !this.datosEdicion.apellido || !this.datosEdicion.comuna) {
      this.error = 'Por favor, completa todos los campos obligatorios';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const clienteActualizado: Cliente = {
      rut: this.cliente.rut,
      nombre: this.datosEdicion.nombre,
      apellido: this.datosEdicion.apellido,
      email: this.datosEdicion.email,
      comuna: this.datosEdicion.comuna
    };

    this.clienteService.updateCliente(this.cliente.rut, clienteActualizado).subscribe({
      next: (response) => {
        this.cliente = response;
        this.success = '¡Perfil actualizado exitosamente!';
        this.editando = false;
        this.loading = false;
        
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.loading = false;
        if (err.error && typeof err.error === 'object') {
          const errores = Object.entries(err.error).map(([key, value]) => `${key}: ${value}`).join(', ');
          this.error = errores;
        } else {
          this.error = 'Error al actualizar el perfil. Por favor, intenta nuevamente.';
        }
      }
    });
  }

  volverAlHome() {
    this.router.navigate(['/cliente/home']);
  }
}
