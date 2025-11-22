import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClienteService, Cliente } from '../../services/cliente.service';

@Component({
  selector: 'app-cliente-editar',
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-editar.component.html',
  styleUrls: ['./cliente-editar.component.css']
})
export class ClienteEditarComponent implements OnInit {
  cliente: Cliente = {
    rut: '',
    nombre: '',
    apellido: '',
    email: '',
    comuna: ''
  };
  loading = false;
  error = '';
  success = '';

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const rut = this.route.snapshot.paramMap.get('rut');
    if (rut) {
      this.cargarCliente(rut);
    }
  }

  cargarCliente(rut: string) {
    this.loading = true;
    this.clienteService.getCliente(rut).subscribe({
      next: (data) => {
        this.cliente = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar cliente', err);
        this.error = 'Error al cargar el cliente';
        this.loading = false;
      }
    });
  }

  actualizar() {
    this.error = '';
    this.success = '';

    this.clienteService.updateCliente(this.cliente.rut, this.cliente).subscribe({
      next: (response) => {
        console.log('Cliente actualizado', response);
        this.success = 'Cliente actualizado exitosamente';
        setTimeout(() => {
          this.router.navigate(['/clientes']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error al actualizar', err);
        if (err.error) {
          const errores = Object.keys(err.error).map(k => `${k}: ${err.error[k]}`);
          this.error = errores.join(' | ');
        } else {
          this.error = 'Error al actualizar el cliente';
        }
      }
    });
  }

  cancelar() {
    this.router.navigate(['/clientes']);
  }
}
