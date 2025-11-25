import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService, Producto } from '../../services/producto.service';

@Component({
  selector: 'app-producto-editar',
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-editar.html',
  styleUrl: './producto-editar.css'
})
export class ProductoEditar implements OnInit {
  producto: Producto = {
    codigo: '',
    nombre: '',
    stock: 0,
    precio: 0
  };
  loading = false;
  error = '';
  success = '';

  constructor(
    private productoService: ProductoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const codigo = this.route.snapshot.paramMap.get('codigo');
    if (codigo) {
      this.cargarProducto(codigo);
    }
  }

  cargarProducto(codigo: string) {
    this.loading = true;
    this.productoService.getProducto(codigo).subscribe({
      next: (data) => {
        this.producto = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar producto', err);
        this.error = 'Error al cargar el producto';
        this.loading = false;
      }
    });
  }

  actualizar() {
    this.error = '';
    this.success = '';

    this.productoService.updateProducto(this.producto.codigo, this.producto).subscribe({
      next: (response) => {
        console.log('Producto actualizado', response);
        this.success = 'Producto actualizado exitosamente';
        setTimeout(() => {
          this.router.navigate(['/admin/productos']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error al actualizar', err);
        if (err.error) {
          const errores = Object.keys(err.error).map(k => `${k}: ${err.error[k]}`);
          this.error = errores.join(' | ');
        } else {
          this.error = 'Error al actualizar el producto';
        }
      }
    });
  }

  cancelar() {
    this.router.navigate(['/admin/productos']);
  }
}
