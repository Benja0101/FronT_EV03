import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirmacion-compra',
  imports: [CommonModule],
  templateUrl: './confirmacion-compra.html',
  styleUrl: './confirmacion-compra.css',
})
export class ConfirmacionCompra implements OnInit {
  pagoData: any = null;
  mostrarConfetti = true;
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    const pagoCompletado = localStorage.getItem('pagoCompletado');
    
    if (!pagoCompletado) {
      // Si no hay datos de pago, redirigir al home
      this.router.navigate(['/cliente/home']);
      return;
    }

    this.pagoData = JSON.parse(pagoCompletado);
    
    // Limpiar el carrito inmediatamente al llegar a confirmación
    localStorage.removeItem('carrito');
    
    // Ocultar confetti después de 5 segundos
    setTimeout(() => {
      this.mostrarConfetti = false;
    }, 5000);
  }

  volverAlHome(): void {
    // Limpiar los datos de pago (el carrito ya se limpió al llegar)
    localStorage.removeItem('pagoCompletado');
    this.router.navigate(['/cliente/home']);
  }

  descargarComprobante(): void {
    // Simulación de descarga de comprobante
    alert('📄 Comprobante descargado exitosamente');
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
