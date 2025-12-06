import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import { VentaService } from '../../services/venta.service';
import { ClienteService, Cliente } from '../../services/cliente.service';

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

  // Datos completos para registro opcional
  registroData = {
    nombre: '',
    apellido: '',
    comuna: ''
  };

  mostrarModalRegistro: boolean = false;
  quiereRegistrarse: boolean = false;
  clienteEncontrado: Cliente | null = null;
  esClienteRegistrado: boolean = false;
  yaCompro: boolean = false;

  error: string = '';
  success: string = '';
  procesando: boolean = false;

  constructor(
    private carritoService: CarritoService,
    private ventaService: VentaService,
    private clienteService: ClienteService,
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

  buscarClientePorRut(): void {
    if (!this.clienteData.rut || this.clienteData.rut.trim() === '') return;
    
    // Solo buscar si el usuario está autenticado o es una búsqueda pública
    // Para checkout público, simplemente continuar sin buscar cliente previo
    this.clienteEncontrado = null;
    this.esClienteRegistrado = false;
    this.yaCompro = false;
  }

  buscarClientePorEmail(): void {
    if (!this.clienteData.correo || this.clienteData.correo.trim() === '') return;
    if (!this.validarEmail(this.clienteData.correo)) return;
    
    // Para checkout público, simplemente validar formato sin buscar en base de datos
    this.clienteEncontrado = null;
    this.esClienteRegistrado = false;
    this.yaCompro = false;
  }

  abrirModalRegistro() {
    this.mostrarModalRegistro = true;
  }

  cerrarModalRegistro() {
    this.mostrarModalRegistro = false;
    this.quiereRegistrarse = false;
    this.registroData = { nombre: '', apellido: '', comuna: '' };
  }

  confirmarRegistro() {
    // Validar datos del registro
    if (!this.registroData.nombre || !this.registroData.apellido || !this.registroData.comuna) {
      this.mostrarError('Por favor, completa todos los campos del registro');
      return;
    }

    this.quiereRegistrarse = true;
    this.cerrarModalRegistro();
    this.procesarCompra();
  }

  omitirRegistro() {
    this.quiereRegistrarse = false;
    this.cerrarModalRegistro();
    this.procesarCompra();
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

    // Para compras públicas, siempre procesar como cliente nuevo sin registro
    this.quiereRegistrarse = false;
    this.procesarCompra();
  }

  abrirModalParaRegistro() {
    // Botón manual para abrir el modal
    this.abrirModalRegistro();
  }

  private procesarCompra() {
    this.procesando = true;

    // Crear cliente básico/temporal para la compra
    const clienteTemporal = {
      rut: this.clienteData.rut,
      nombre: 'Cliente',
      apellido: 'Web',
      email: this.clienteData.correo,
      comuna: 'No especificada'
    };

    this.clienteService.createCliente(clienteTemporal).subscribe({
      next: (clienteCreado) => {
        console.log('✅ Cliente creado:', clienteCreado);
        this.crearVenta();
      },
      error: (err) => {
        console.log('⚠️ Error al crear cliente (puede que ya exista):', err);
        // Si el cliente ya existe (error 400 o 409), continuar con la venta de todos modos
        if (err.status === 400 || err.status === 409) {
          console.log('✅ Cliente ya existe, continuando con la venta');
          this.crearVenta();
        } else {
          this.procesando = false;
          this.mostrarError('Error al procesar el cliente. Por favor, intenta nuevamente.');
          console.error('❌ Error al crear cliente:', err);
        }
      }
    });
  }

  private crearVenta() {
    // Generar número de venta único con formato: YYYYMMDD-NNNN
    const fecha = new Date();
    const fechaStr = fecha.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const numeroVenta = `${fechaStr}-${random}`;
    
    // Crear la venta con detalles de productos
    // Django requiere el campo 'total', pero lo recalculará automáticamente
    const venta = {
      numero: numeroVenta,
      rut_cliente: this.clienteData.rut,
      total: 0,  // Django lo recalculará desde los detalles
      detalles: this.items.map(item => ({
        producto_id: item.producto.id || item.producto.codigo,  // Usar id o codigo como fallback
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio
      }))
    };

    this.ventaService.createVenta(venta as any).subscribe({
      next: (response: any) => {
        try {
          // Limpiar localStorage antes de guardar datos nuevos
          const keysToRemove = ['ventaPendiente'];
          keysToRemove.forEach(key => {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.warn('Error al limpiar localStorage:', e);
            }
          });

          // Guardar solo datos esenciales (sin imágenes de productos)
          const ventaMinima = {
            numero: response.numero,
            total: response.total,
            productos: this.items.map(item => ({
              nombre: item.producto.nombre,
              codigo: item.producto.codigo,
              cantidad: item.cantidad,
              precio: item.producto.precio,
              subtotal: item.producto.precio * item.cantidad
            })),
            cliente: {
              rut: this.clienteData.rut,
              correo: this.clienteData.correo
            }
          };

          localStorage.setItem('ventaPendiente', JSON.stringify(ventaMinima));
          
          // Redirigir al pago
          this.router.navigate(['/cliente/pago']);
        } catch (storageError) {
          console.error('Error en localStorage:', storageError);
          // Aún así redirigir al pago con datos en la sesión
          this.router.navigate(['/cliente/pago'], {
            state: {
              numero: response.numero,
              total: response.total
            }
          });
        }
      },
      error: (err: any) => {
        this.procesando = false;
        
        // Mostrar el error específico si viene del servidor
        let mensajeError = 'Error al procesar la compra. Por favor, intenta nuevamente.';
        if (err.error && typeof err.error === 'object') {
          const errores = Object.entries(err.error).map(([key, value]) => `${key}: ${value}`).join(', ');
          mensajeError = `Error: ${errores}`;
        }
        
        this.mostrarError(mensajeError);
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

  mostrarExito(mensaje: string) {
    this.success = mensaje;
    setTimeout(() => this.success = '', 4000);
  }

  getTotalUnidades(): number {
    return this.items.reduce((acc, item) => acc + item.cantidad, 0);
  }
}
