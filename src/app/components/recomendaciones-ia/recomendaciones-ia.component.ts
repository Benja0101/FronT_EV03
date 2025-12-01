import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IAService, Recomendacion } from '../../services/ia.service';
import { CarritoService } from '../../services/carrito.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recomendaciones-ia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recomendaciones-ia.component.html',
  styleUrls: ['./recomendaciones-ia.component.css']
})
export class RecomendacionesIAComponent implements OnInit {
  @Input() rutCliente: string = '';
  @Input() limite: number = 3;
  
  recomendaciones: Recomendacion[] = [];
  mensaje: string = '';
  cargando: boolean = false;
  error: string = '';

  constructor(
    private iaService: IAService,
    private router: Router,
    private carritoService: CarritoService
  ) {}

  ngOnInit() {
    if (this.rutCliente) {
      this.cargarRecomendaciones();
    }
  }

  cargarRecomendaciones() {
    this.cargando = true;
    this.error = '';
    
    this.iaService.getRecomendaciones(this.rutCliente, this.limite)
      .subscribe({
        next: (data) => {
          this.recomendaciones = data.recomendaciones;
          this.mensaje = data.mensaje;
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error cargando recomendaciones:', err);
          this.error = 'No se pudieron cargar las recomendaciones';
          this.cargando = false;
        }
      });
  }

  verProducto(productoId: number) {
    this.router.navigate(['/productos', productoId]);
  }

  agregarAlCarrito(productoId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    const producto = this.recomendaciones.find(p => p.producto_id === productoId);
    if (producto) {
      this.carritoService.agregarAlCarrito({
        id: producto.producto_id,
        nombre: producto.nombre,
        precio: producto.precio,
        stock: producto.stock
      }, 1);
    }
  }

  getConfianzaClass(confianza: string): string {
    return `confianza-${confianza}`;
  }
}
