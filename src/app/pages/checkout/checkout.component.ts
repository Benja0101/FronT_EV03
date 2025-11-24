import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import { VentaService } from '../../services/venta.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  items: ItemCarrito[] = [];
  total: number = 0;
  
  clienteData = {
    correo: '',
    rut: ''
  };

  error: string = '';
  success: string = '';
  procesando: boolean = false;

  constructor(
    private carritoService: CarritoService,
    private ventaService: VentaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCarrito();
    if (this.items.length === 0) {
      this.router.navigate(['/cliente/carrito']);
    }
  }

  cargarCarrito() {
    this.items = this.carritoService.obtenerCarrito();
    this.total = this.carritoService.obtenerTotal();
  }

  validarRut(rut: string): boolean {
    // Validación básica de formato RUT chileno
    const rutLimpio = rut.replace(/[.-]/g, '');
    if (rutLimpio.length < 8 || rutLimpio.length > 9) {
      return false;
    }
    return true;
  }

  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  finalizarCompra() {
    // Validaciones
    if (!this.clienteData.correo || !this.clienteData.rut) {
      this.mostrarError('Por favor, completa todos los campos');
      return;
    }

    if (!this.validarEmail(this.clienteData.correo)) {
      this.mostrarError('Por favor, ingresa un correo electrónico válido');
      return;
    }

    if (!this.validarRut(this.clienteData.rut)) {
      this.mostrarError('Por favor, ingresa un RUT válido');
      return;
    }

    this.procesando = true;

    // Crear la venta
    const venta = {
      cliente_rut: this.clienteData.rut,
      correo_cliente: this.clienteData.correo,
      productos: this.items.map(item => ({
        codigo: item.producto.codigo,
        cantidad: item.cantidad
      })),
      total: this.total
    };

    this.ventaService.createVenta(venta as any).subscribe({
      next: (response: any) => {
        this.success = '¡Compra realizada con éxito!';
        this.carritoService.vaciarCarrito();
        
        setTimeout(() => {
          this.router.navigate(['/cliente/home']);
        }, 2000);
      },
      error: (err: any) => {
        this.procesando = false;
        console.error('Error al procesar la compra:', err);
        this.mostrarError('Error al procesar la compra. Por favor, intenta nuevamente.');
      }
    });
  }

  volver() {
    this.router.navigate(['/cliente/carrito']);
  }

  mostrarError(mensaje: string) {
    this.error = mensaje;
    setTimeout(() => this.error = '', 4000);
  }

  getTotalUnidades(): number {
    return this.items.reduce((acc, item) => acc + item.cantidad, 0);
  }
}
