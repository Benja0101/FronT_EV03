import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductoService, Producto } from '../../services/producto.service';

@Component({
  selector: 'app-producto-crear',
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-crear.component.html',
  styleUrls: ['./producto-crear.component.css']
})
export class ProductoCrearComponent {
  producto: Producto = {
    nombre: '',
    codigo: '',
    stock: 0,
    precio: 0
  };
  error = '';
  success = '';

  constructor(
    private productoService: ProductoService,
    private router: Router
  ) {}

  crear() {
    this.error = '';
    this.success = '';

    this.productoService.createProducto(this.producto).subscribe({
      next: (response) => {
        console.log('Producto creado', response);
        this.success = 'Producto creado exitosamente';
        setTimeout(() => {
          this.router.navigate(['/admin/productos']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error al crear producto', err);
        if (err.error) {
          const errores = Object.keys(err.error).map(k => `${k}: ${err.error[k]}`);
          this.error = errores.join(' | ');
        } else {
          this.error = 'Error al crear el producto';
        }
      }
    });
  }

  cancelar() {
    this.router.navigate(['/admin/productos']);
  }
}
