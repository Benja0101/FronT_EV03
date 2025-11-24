import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClienteService, Cliente } from '../../services/cliente.service';

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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔵 ClientesListaComponent - ngOnInit ejecutado');
    this.cargarClientes();
  }

  cargarClientes() {
    console.log('🔵 Iniciando carga de clientes...');
    this.loading = true;
    this.error = '';
    this.clientes = []; // Limpiar clientes anteriores

    this.clienteService.getAllClientes().subscribe({
      next: (response) => {
        console.log('✅ Clientes recibidos:', response);
        this.clientes = response.results || [];
        console.log('📦 Clientes procesados:', this.clientes.length);
        console.log('📦 Clientes array:', this.clientes);
        this.loading = false;
        console.log('✅ Loading = false');
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('🔄 Detección de cambios forzada');
      },
      error: (err) => {
        console.error('❌ Error al cargar clientes:', err);
        this.error = 'Error al cargar clientes. Intente nuevamente.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  irACrear() {
    this.router.navigate(['/admin/clientes/crear']);
  }

  editar(rut: string) {
    this.router.navigate(['/admin/clientes/editar', rut]);
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
