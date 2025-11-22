import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductoService, Producto } from '../../services/producto.service';

@Component({
  selector: 'app-productos-lista',
  imports: [CommonModule],
  templateUrl: './productos-lista.component.html',
  styleUrls: ['./productos-lista.component.css']
})
export class ProductosListaComponent implements OnInit {
  productos: Producto[] = [];
  loading = false;
  error = '';

  constructor(
    private productoService: ProductoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔵 ProductosListaComponent - ngOnInit ejecutado');
    this.cargarProductos();
  }

  cargarProductos() {
    console.log('🔵 Iniciando carga de productos...');
    this.loading = true;
    this.error = '';
    this.productos = []; // Limpiar productos anteriores

    this.productoService.getAllProductos().subscribe({
      next: (response) => {
        console.log('✅ Productos recibidos:', response);
        this.productos = response.results || [];
        console.log('📦 Productos procesados:', this.productos.length);
        console.log('📦 Productos array:', this.productos);
        this.loading = false;
        console.log('✅ Loading = false');
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('🔄 Detección de cambios forzada');
      },
      error: (err) => {
        console.error('❌ Error al cargar productos:', err);
        this.error = 'Error al cargar productos. Intente nuevamente.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  irACrear() {
    this.router.navigate(['/productos/crear']);
  }

  eliminar(codigo: string) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      this.productoService.deleteProducto(codigo).subscribe({
        next: () => {
          console.log('Producto eliminado');
          this.cargarProductos();
        },
        error: (err) => {
          console.error('Error al eliminar', err);
          this.error = 'Error al eliminar el producto.';
        }
      });
    }
  }
}
