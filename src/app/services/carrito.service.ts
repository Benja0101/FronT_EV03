import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ItemCarrito {
  producto: any;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private itemsCarrito: ItemCarrito[] = [];
  private carritoSubject = new BehaviorSubject<ItemCarrito[]>([]);
  public carrito$ = this.carritoSubject.asObservable();

  constructor() {
    // Cargar carrito desde localStorage si existe
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      this.itemsCarrito = JSON.parse(carritoGuardado);
      this.carritoSubject.next(this.itemsCarrito);
    }
  }

  agregarAlCarrito(producto: any, cantidad: number = 1) {
    const itemExistente = this.itemsCarrito.find(
      item => item.producto.id === producto.id
    );

    if (itemExistente) {
      itemExistente.cantidad += cantidad;
    } else {
      this.itemsCarrito.push({ producto, cantidad });
    }

    this.guardarCarrito();
  }

  eliminarDelCarrito(productoId: number) {
    this.itemsCarrito = this.itemsCarrito.filter(
      item => item.producto.id !== productoId
    );
    this.guardarCarrito();
  }

  actualizarCantidad(productoId: number, cantidad: number) {
    const item = this.itemsCarrito.find(
      item => item.producto.id === productoId
    );
    
    if (item) {
      if (cantidad <= 0) {
        this.eliminarDelCarrito(productoId);
      } else {
        item.cantidad = cantidad;
        this.guardarCarrito();
      }
    }
  }

  obtenerCarrito(): ItemCarrito[] {
    return this.itemsCarrito;
  }

  obtenerTotal(): number {
    return this.itemsCarrito.reduce(
      (total, item) => total + (item.producto.precio * item.cantidad),
      0
    );
  }

  obtenerCantidadTotal(): number {
    return this.itemsCarrito.reduce(
      (total, item) => total + item.cantidad,
      0
    );
  }

  vaciarCarrito() {
    this.itemsCarrito = [];
    this.guardarCarrito();
  }

  private guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(this.itemsCarrito));
    this.carritoSubject.next(this.itemsCarrito);
  }
}
