import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pago.html',
  styleUrl: './pago.css',
})
export class Pago implements OnInit {
  ventaData: any = null;
  cardFlipped = false;
  
  tarjetaData = {
    numero: '',
    titular: '',
    vencimiento: '',
    cvv: ''
  };

  error: string = '';
  procesando: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Cargar datos de la venta desde localStorage
    const ventaPendiente = localStorage.getItem('ventaPendiente');
    if (!ventaPendiente) {
      // Si no hay venta pendiente, redirigir al home
      this.router.navigate(['/cliente/home']);
      return;
    }
    this.ventaData = JSON.parse(ventaPendiente);
  }

  formatCardNumber(numero: string): string {
    if (!numero) return '#### #### #### ####';
    // Agregar espacio cada 4 dígitos
    const cleaned = numero.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.padEnd(19, '#');
  }

  formatExpiry(expiry: string): string {
    if (!expiry) return 'MM/AA';
    return expiry;
  }

  onCardNumberInput(event: any) {
    let value = event.target.value.replace(/\s/g, '');
    // Solo números
    value = value.replace(/\D/g, '');
    // Agregar espacios cada 4 dígitos
    if (value.length > 0) {
      value = value.match(/.{1,4}/g)?.join(' ') || value;
    }
    this.tarjetaData.numero = value;
  }

  onExpiryInput(event: any) {
    let value = event.target.value.replace(/\//g, '');
    // Solo números
    value = value.replace(/\D/g, '');
    // Agregar / después de 2 dígitos
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    this.tarjetaData.vencimiento = value;
  }

  onlyNumbers(event: any) {
    let value = event.target.value;
    value = value.replace(/\D/g, '');
    this.tarjetaData.cvv = value;
  }

  toUpperCase(event: any) {
    event.target.value = event.target.value.toUpperCase();
    this.tarjetaData.titular = event.target.value;
  }

  procesarPago() {
    // Validaciones
    if (!this.tarjetaData.numero || !this.tarjetaData.titular || 
        !this.tarjetaData.vencimiento || !this.tarjetaData.cvv) {
      this.error = 'Por favor, completa todos los campos de la tarjeta';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    const numeroLimpio = this.tarjetaData.numero.replace(/\s/g, '');
    if (numeroLimpio.length < 16) {
      this.error = 'Número de tarjeta inválido';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    if (this.tarjetaData.cvv.length < 3) {
      this.error = 'CVV inválido';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    // Simular procesamiento de pago
    this.procesando = true;
    
    setTimeout(() => {
      // Guardar datos para la confirmación
      localStorage.setItem('pagoCompletado', JSON.stringify({
        ...this.ventaData,
        fechaPago: new Date().toISOString(),
        metodoPago: 'Tarjeta de Crédito',
        ultimos4Digitos: numeroLimpio.slice(-4)
      }));
      
      // Limpiar carrito y venta pendiente
      localStorage.removeItem('carrito');
      localStorage.removeItem('ventaPendiente');
      
      // Redirigir a confirmación
      this.router.navigate(['/cliente/confirmacion']);
    }, 2500);
  }
}
