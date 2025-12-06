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
    if (!this.pagoData) return;

    // Crear contenido HTML para el comprobante
    const comprobanteHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comprobante de Compra - ${this.pagoData.numero}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .comprobante {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #667eea;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #666;
            margin: 10px 0 0 0;
          }
          .section {
            margin-bottom: 25px;
          }
          .section h2 {
            color: #333;
            font-size: 18px;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .info-label {
            color: #666;
            font-weight: 600;
          }
          .info-value {
            color: #333;
          }
          .productos {
            margin: 20px 0;
          }
          .producto-item {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            background: #f9f9f9;
            margin-bottom: 8px;
            border-radius: 5px;
          }
          .producto-info {
            display: flex;
            gap: 15px;
            align-items: center;
          }
          .producto-nombre {
            font-weight: 600;
            color: #333;
          }
          .producto-cantidad {
            color: #666;
            background: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 14px;
          }
          .producto-precio {
            font-weight: 600;
            color: #667eea;
            font-size: 16px;
          }
          .total {
            background: #667eea;
            color: white;
            padding: 20px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 24px;
            font-weight: bold;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            color: #999;
            font-size: 14px;
          }
          @media print {
            body {
              margin: 0;
              background: white;
            }
            .comprobante {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="comprobante">
          <div class="header">
            <h1>🛍️ Comprobante de Compra</h1>
            <p>Gracias por tu compra</p>
          </div>

          <div class="section">
            <h2>📋 Información de la Orden</h2>
            <div class="info-row">
              <span class="info-label">Número de Orden:</span>
              <span class="info-value">${this.pagoData.numero}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha:</span>
              <span class="info-value">${this.formatearFecha(this.pagoData.fechaPago)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Método de Pago:</span>
              <span class="info-value">${this.pagoData.metodoPago}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tarjeta:</span>
              <span class="info-value">•••• ${this.pagoData.ultimos4Digitos}</span>
            </div>
          </div>

          <div class="section">
            <h2>👤 Información del Cliente</h2>
            <div class="info-row">
              <span class="info-label">RUT:</span>
              <span class="info-value">${this.pagoData.cliente?.rut || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Correo:</span>
              <span class="info-value">${this.pagoData.cliente?.correo || 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <h2>📦 Productos</h2>
            <div class="productos">
              ${this.pagoData.productos?.map((p: any) => `
                <div class="producto-item">
                  <div class="producto-info">
                    <span class="producto-nombre">${p.nombre}</span>
                    <span class="producto-cantidad">x${p.cantidad}</span>
                  </div>
                  <span class="producto-precio">$${(p.precio * p.cantidad).toLocaleString('es-CL')}</span>
                </div>
              `).join('') || '<p>No hay productos</p>'}
            </div>
          </div>

          <div class="total">
            <span>Total Pagado:</span>
            <span>$${this.pagoData.total?.toLocaleString('es-CL') || '0'}</span>
          </div>

          <div class="footer">
            <p>Este es un comprobante válido de compra</p>
            <p>Generado el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Crear un Blob con el HTML
    const blob = new Blob([comprobanteHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    
    // Crear un enlace temporal y hacer clic en él
    const a = document.createElement('a');
    a.href = url;
    a.download = `Comprobante_${this.pagoData.numero}.html`;
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
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
