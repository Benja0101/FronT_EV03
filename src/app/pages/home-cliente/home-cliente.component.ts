import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-home-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-cliente.component.html',
  styleUrl: './home-cliente.component.css'
})
export class HomeClienteComponent implements OnInit {
  productos: any[] = [];
  carritoCount: number = 0;
  error: string = '';
  success: string = '';

  constructor(
    private productoService: ProductoService,
    private carritoService: CarritoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarProductos();
    this.carritoService.carrito$.subscribe(() => {
      this.carritoCount = this.carritoService.obtenerCantidadTotal();
    });
    
    // Scroll automático a la sección de productos después de un breve delay
    setTimeout(() => {
      this.scrollToProductos();
    }, 800);
  }

  cargarProductos() {
    this.productos = []; // Limpiar array antes de cargar
    this.productoService.getAllProductos().subscribe({
      next: (data: any) => {
        this.productos = data.results || [];
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
      error: (err: any) => {
        console.error('❌ HomeCliente - Error al cargar productos:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        this.error = 'Error al cargar los productos';
        this.cdr.detectChanges(); // Forzar detección de cambios también en error
      }
    });
  }

  agregarAlCarrito(producto: any) {
    if (producto.stock <= 0) {
      this.mostrarMensaje('Producto sin stock disponible', 'error');
      return;
    }

    this.carritoService.agregarAlCarrito(producto, 1);
    this.mostrarMensaje('Producto añadido al carrito', 'success');
  }

  irAlCarrito() {
    this.router.navigate(['/cliente/carrito']);
  }

  irAlAdmin() {
    // Si ya hay un token de acceso, ir directamente al dashboard
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  scrollToProductos() {
    const element = document.getElementById('productos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  mostrarMensaje(mensaje: string, tipo: 'error' | 'success') {
    if (tipo === 'error') {
      this.error = mensaje;
      setTimeout(() => this.error = '', 3000);
    } else {
      this.success = mensaje;
      setTimeout(() => this.success = '', 3000);
    }
  }
}
