import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductoService, Producto } from '../services/producto.service';

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
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.loading = true;
    this.error = '';

    this.productoService.getAllProductos().subscribe({
      next: (data) => {
        this.productos = Array.isArray(data) ? data : (data as any).results || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos', err);
        this.error = 'Error al cargar productos. Intente nuevamente.';
        this.loading = false;
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
