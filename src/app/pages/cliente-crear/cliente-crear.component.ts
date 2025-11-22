import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService, Cliente } from '../../services/cliente.service';

@Component({
  selector: 'app-cliente-crear',
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-crear.component.html',
  styleUrls: ['./cliente-crear.component.css']
})
export class ClienteCrearComponent {
  cliente: Cliente = {
    rut: '',
    nombre: '',
    apellido: '',
    email: '',
    comuna: ''
  };
  error = '';
  success = '';

  constructor(
    private clienteService: ClienteService,
    private router: Router
  ) {}

  crear() {
    this.error = '';
    this.success = '';

    this.clienteService.createCliente(this.cliente).subscribe({
      next: (response) => {
        console.log('Cliente creado', response);
        this.success = 'Cliente creado exitosamente';
        setTimeout(() => {
          this.router.navigate(['/clientes']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error al crear cliente', err);
        if (err.error) {
          const errores = Object.keys(err.error).map(k => `${k}: ${err.error[k]}`);
          this.error = errores.join(' | ');
        } else {
          this.error = 'Error al crear el cliente';
        }
      }
    });
  }

  cancelar() {
    this.router.navigate(['/clientes']);
  }
}
