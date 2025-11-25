import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService, Producto } from '../../services/producto.service';

@Component({
  selector: 'app-productos-lista',
  imports: [CommonModule, FormsModule],
  templateUrl: './productos-lista.component.html',
  styleUrls: ['./productos-lista.component.css']
})
export class ProductosListaComponent implements OnInit {
  productos: Producto[] = [];
  loading = false;
  error = '';
  
  // Modal de edición
  mostrarModal = false;
  productoEditando: Producto = {
    codigo: '',
    nombre: '',
    stock: 0,
    precio: 0
  };
  guardandoEdicion = false;

  constructor(
    private productoService: ProductoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.loading = true;
    this.error = '';
    this.productos = []; // Limpiar productos anteriores

    this.productoService.getAllProductos().subscribe({
      next: (response) => {
        this.productos = response.results || [];
        this.loading = false;
        this.cdr.detectChanges();
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
    this.router.navigate(['/admin/productos/crear']);
  }

  editar(producto: Producto) {
    this.productoEditando = { ...producto };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.error = '';
  }

  guardarEdicion() {
    if (!this.productoEditando.nombre || this.productoEditando.stock < 0 || this.productoEditando.precio <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    this.guardandoEdicion = true;
    this.error = '';

    this.productoService.updateProducto(this.productoEditando.codigo, this.productoEditando).subscribe({
      next: () => {
        this.guardandoEdicion = false;
        this.mostrarModal = false;
        this.cargarProductos();
        alert('✅ Producto actualizado exitosamente');
      },
      error: (err) => {
        console.error('Error al actualizar producto', err);
        this.guardandoEdicion = false;
        this.error = 'Error al actualizar el producto';
        alert('❌ Error al actualizar el producto');
      }
    });
  }

  eliminar(codigo: string) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      this.productoService.deleteProducto(codigo).subscribe({
        next: () => {
          this.cargarProductos();
          alert('Producto eliminado exitosamente');
        },
        error: (err) => {
          console.error('Error al eliminar', err);
          if (err.status === 500) {
            this.error = 'No se puede eliminar este producto porque está asociado a una o más ventas.';
            alert('❌ No se puede eliminar este producto porque está asociado a una o más ventas.');
          } else if (err.status === 404) {
            this.error = 'Producto no encontrado.';
          } else {
            this.error = 'Error al eliminar el producto.';
          }
        }
      });
    }
  }
}
