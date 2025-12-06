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

  // Paginación
  paginaActual: number = 1;
  totalPaginas: number = 1;
  totalClientes: number = 0;
  clientesPorPagina: number = 12;

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

    this.clienteService.getClientes(this.paginaActual).subscribe({
      next: (response) => {
        console.log('✅ Clientes recibidos:', response);
        this.clientes = response.results || [];
        this.totalClientes = response.count || 0;
        this.totalPaginas = Math.ceil(this.totalClientes / this.clientesPorPagina);
        console.log('📦 Clientes procesados:', this.clientes.length);
        console.log('📦 Total clientes:', this.totalClientes);
        console.log('📦 Total páginas:', this.totalPaginas);
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

  // Métodos de paginación
  irAPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas || pagina === this.paginaActual) {
      return;
    }
    this.paginaActual = pagina;
    this.cargarClientes();
    this.scrollToTop();
  }

  paginaSiguiente() {
    if (this.paginaActual < this.totalPaginas) {
      this.irAPagina(this.paginaActual + 1);
    }
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.irAPagina(this.paginaActual - 1);
    }
  }

  obtenerPaginas(): (number | string)[] {
    const paginas: (number | string)[] = [];
    const maxPaginas = 5;

    if (this.totalPaginas <= maxPaginas + 2) {
      for (let i = 1; i <= this.totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      paginas.push(1);

      if (this.paginaActual > 3) {
        paginas.push('...');
      }

      const inicio = Math.max(2, this.paginaActual - 1);
      const fin = Math.min(this.totalPaginas - 1, this.paginaActual + 1);

      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }

      if (this.paginaActual < this.totalPaginas - 2) {
        paginas.push('...');
      }

      if (this.totalPaginas > 1) {
        paginas.push(this.totalPaginas);
      }
    }

    return paginas;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
