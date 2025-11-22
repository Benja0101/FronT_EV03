import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClienteService, Cliente } from '../services/cliente.service';

@Component({
  selector: 'app-clientes-lista',
  imports: [CommonModule],
  templateUrl: './clientes-lista.component.html',
  styleUrls: ['./clientes-lista.component.css']
})
export class ClientesListaComponent implements OnInit {
  clientes: Cliente[] = [];
  loading = false;
  error = '';

  constructor(
    private clienteService: ClienteService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.loading = true;
    this.error = '';

    this.clienteService.getAllClientes().subscribe({
      next: (data) => {
        this.clientes = Array.isArray(data) ? data : (data as any).results || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes', err);
        this.error = 'Error al cargar clientes. Intente nuevamente.';
        this.loading = false;
      }
    });
  }

  irACrear() {
    this.router.navigate(['/clientes/crear']);
  }

  editar(rut: string) {
    this.router.navigate(['/clientes/editar', rut]);
  }

  eliminar(rut: string) {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      this.clienteService.deleteCliente(rut).subscribe({
        next: () => {
          console.log('Cliente eliminado');
          this.cargarClientes();
        },
        error: (err) => {
          console.error('Error al eliminar', err);
          this.error = 'Error al eliminar el cliente.';
        }
      });
    }
  }
}
