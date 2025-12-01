import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductoService, Producto } from '../../services/producto.service';
import { IAService, DescripcionProducto } from '../../services/ia.service';

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
    precio: 0,
    descripcion: ''
  };
  error = '';
  success = '';
  cargandoDescripcion = false;

  constructor(
    private productoService: ProductoService,
    private router: Router,
    private iaService: IAService
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

  generarDescripcionIA() {
    if (!this.producto.nombre || !this.producto.codigo) {
      this.error = 'Completa al menos el nombre y código del producto';
      return;
    }

    this.cargandoDescripcion = true;
    this.error = '';

    // Primero crear el producto si no existe
    if (!this.producto.id) {
      this.productoService.createProducto(this.producto).subscribe({
        next: (response) => {
          this.producto = response;
          this.generarYGuardarDescripcion();
        },
        error: (err) => {
          console.error('Error al crear producto:', err);
          this.error = '❌ Error al crear el producto';
          this.cargandoDescripcion = false;
        }
      });
    } else {
      this.generarYGuardarDescripcion();
    }
  }

  generarYGuardarDescripcion() {
    if (!this.producto.id) return;

    this.iaService.generarDescripcion(this.producto.id).subscribe({
      next: (data: DescripcionProducto) => {
        console.log('Descripción generada:', data);
        
        // Actualizar el producto con la descripción generada
        this.producto.descripcion = data.descripcion_larga;
        
        // Guardar en la BD
        this.productoService.updateProducto(this.producto.codigo, this.producto).subscribe({
          next: () => {
            this.success = '✅ Descripción generada y guardada con IA exitosamente';
            this.cargandoDescripcion = false;
          },
          error: (err) => {
            console.error('Error al guardar descripción:', err);
            this.error = '❌ Error al guardar la descripción';
            this.cargandoDescripcion = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al generar descripción:', err);
        this.error = '❌ Error al generar descripción con IA';
        this.cargandoDescripcion = false;
      }
    });
  }
}
