import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css'
})
export class CarritoComponent implements OnInit {
  items: ItemCarrito[] = [];
  total: number = 0;

  constructor(
    private carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCarrito();
    this.carritoService.carrito$.subscribe(() => {
      this.cargarCarrito();
    });
  }

  cargarCarrito() {
    this.items = this.carritoService.obtenerCarrito();
    this.total = this.carritoService.obtenerTotal();
  }

  aumentarCantidad(item: ItemCarrito) {
    if (item.cantidad < item.producto.stock) {
      this.carritoService.actualizarCantidad(item.producto.id, item.cantidad + 1);
    }
  }

  disminuirCantidad(item: ItemCarrito) {
    if (item.cantidad > 1) {
      this.carritoService.actualizarCantidad(item.producto.id, item.cantidad - 1);
    } else {
      this.eliminarItem(item);
    }
  }

  eliminarItem(item: ItemCarrito) {
    this.carritoService.eliminarDelCarrito(item.producto.id);
  }

  vaciarCarrito() {
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
      this.carritoService.vaciarCarrito();
    }
  }

  continuarComprando() {
    this.router.navigate(['/cliente/home']);
  }

  procederAlCheckout() {
    this.router.navigate(['/cliente/checkout']);
  }

  getTotalUnidades(): number {
    return this.items.reduce((acc, item) => acc + item.cantidad, 0);
  }
}
