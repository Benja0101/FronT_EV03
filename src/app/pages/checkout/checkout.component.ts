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
    
    this.clienteService.getCliente(this.clienteData.rut).subscribe({
      next: (cliente) => {
        this.clienteEncontrado = cliente;
        this.esClienteRegistrado = cliente.nombre !== 'Cliente' || cliente.apellido !== 'Web';
        
        // Autocompletar datos
        if (cliente.email && cliente.email.trim() !== '') {
          this.clienteData.correo = cliente.email;
        }
        
        // Si es un cliente registrado, cargar todos los datos
        if (this.esClienteRegistrado) {
          this.registroData.nombre = cliente.nombre;
          this.registroData.apellido = cliente.apellido;
          this.registroData.comuna = cliente.comuna;
          this.mostrarExito('¡Bienvenido de vuelta! Tus datos han sido cargados.');
        } else {
          // Es un cliente temporal (ya compró pero no se registró)
          this.yaCompro = true;
        }
      },
      error: (err) => {
        this.clienteEncontrado = null;
        this.esClienteRegistrado = false;
        this.yaCompro = false;
      }
    });
  }

  buscarClientePorEmail(): void {
    if (!this.clienteData.correo || this.clienteData.correo.trim() === '') return;
    if (!this.validarEmail(this.clienteData.correo)) return;
    
    // Django no tiene endpoint directo por email, buscar en la lista
    this.clienteService.getAllClientes().subscribe({
      next: (response) => {
        const cliente = response.results.find(c => c.email === this.clienteData.correo);
        
        if (cliente) {
          this.clienteEncontrado = cliente;
          this.esClienteRegistrado = cliente.nombre !== 'Cliente' || cliente.apellido !== 'Web';
          
          // Autocompletar RUT
          this.clienteData.rut = cliente.rut;
          
          // Si es un cliente registrado, cargar todos los datos
          if (this.esClienteRegistrado) {
            this.registroData.nombre = cliente.nombre;
            this.registroData.apellido = cliente.apellido;
            this.registroData.comuna = cliente.comuna;
            this.mostrarExito('¡Bienvenido de vuelta! Tus datos han sido cargados.');
          } else {
            // Es un cliente temporal (ya compró pero no se registró)
            this.yaCompro = true;
          }
        } else {
          this.clienteEncontrado = null;
          this.esClienteRegistrado = false;
          this.yaCompro = false;
        }
      },
      error: (err) => {
        // Error al buscar cliente
      }
    });
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

    // Si es cliente registrado, procesar directamente
    if (this.esClienteRegistrado) {
      this.procesarCompra();
      return;
    }

    // Si ya compró antes pero no está registrado, preguntar
    if (this.yaCompro) {
      this.abrirModalRegistro();
      return;
    }

    // Cliente nuevo, proceder directamente sin registro
    this.quiereRegistrarse = false;
    this.procesarCompra();
  }

  abrirModalParaRegistro() {
    // Botón manual para abrir el modal
    this.abrirModalRegistro();
  }

  private procesarCompra() {
    this.procesando = true;

    // Siempre verificar/crear el cliente antes de la venta
    if (this.quiereRegistrarse) {
      // Si quiere registrarse, crear/actualizar con datos completos
      const clienteCompleto = {
        rut: this.clienteData.rut,
        nombre: this.registroData.nombre,
        apellido: this.registroData.apellido,
        email: this.clienteData.correo,
        comuna: this.registroData.comuna
      };

      // Si el cliente ya existe (yaCompro = true), actualizar en lugar de crear
      if (this.yaCompro || this.clienteEncontrado) {
        this.clienteService.updateCliente(this.clienteData.rut, clienteCompleto).subscribe({
          next: (clienteActualizado) => {
            this.crearVenta();
          },
          error: (err) => {
            this.procesando = false;
            this.mostrarError('Error al actualizar el cliente. Por favor, intenta nuevamente.');
          }
        });
      } else {
        // Cliente nuevo, crear
        this.clienteService.createCliente(clienteCompleto).subscribe({
          next: (clienteCreado) => {
            this.crearVenta();
          },
          error: (err) => {
            // Si ya existe, intentar actualizar
            if (err.status === 400 || err.status === 409) {
              this.clienteService.updateCliente(this.clienteData.rut, clienteCompleto).subscribe({
                next: () => {
                  this.crearVenta();
                },
                error: (updateErr) => {
                  this.procesando = false;
                  this.mostrarError('Error al procesar el cliente. Por favor, intenta nuevamente.');
                }
              });
            } else {
              this.procesando = false;
              this.mostrarError('Error al registrar el cliente. Por favor, intenta nuevamente.');
            }
          }
        });
      }
    } else {
      // Si no quiere registrarse, crear cliente básico/temporal
      const clienteTemporal = {
        rut: this.clienteData.rut,
        nombre: 'Cliente',
        apellido: 'Web',
        email: this.clienteData.correo,
        comuna: 'No especificada'
      };

      this.clienteService.createCliente(clienteTemporal).subscribe({
        next: (clienteCreado) => {
          this.crearVenta();
        },
        error: (err) => {
          // Si ya existe, continuar con la venta
          if (err.status === 400 || err.status === 409) {
            this.crearVenta();
          } else {
            this.procesando = false;
            this.mostrarError('Error al procesar el cliente. Por favor, intenta nuevamente.');
          }
        }
      });
    }
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
        // Guardar datos de la venta en localStorage para la página de pago
        localStorage.setItem('ventaPendiente', JSON.stringify({
          numero: response.numero,
          total: response.total,
          productos: this.items,
          cliente: this.clienteData
        }));
        // Redirigir al pago
        this.router.navigate(['/cliente/pago']);
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
