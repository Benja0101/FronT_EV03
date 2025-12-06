import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaService, Venta, DetalleVenta } from '../../services/venta.service';
import { ClienteService, Cliente } from '../../services/cliente.service';
import { ProductoService, Producto } from '../../services/producto.service';

@Component({
  selector: 'app-ventas',
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent implements OnInit {
  venta: Venta = {
    numero: '',
    fecha: '',
    rut_cliente: '',
    total: 0
  };
  
  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
  clientes: Cliente[] = [];
  productos: Producto[] = [];
  
  loading = false;
  error = '';
  success = '';

  // Filtrado y búsqueda
  terminoBusqueda = '';

  // Paginación
  paginaActual: number = 1;
  totalPaginas: number = 1;
  totalVentas: number = 0;
  ventasPorPagina: number = 12;

  // Modal de detalle
  mostrarModal = false;
  ventaSeleccionada: Venta | null = null;
  detallesVenta: DetalleVenta[] = [];
  loadingDetalle = false;

  constructor(
    private ventaService: VentaService,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('🔵 VentasComponent - ngOnInit ejecutado');
    this.cargarClientes();
    this.cargarProductos();
    this.cargarVentas();
  }

  cargarClientes() {
    this.clienteService.getAllClientes().subscribe({
      next: (response) => {
        this.clientes = response.results || [];
        console.log('✅ Clientes cargados para ventas:', this.clientes.length);
      },
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }

  cargarProductos() {
    this.productoService.getAllProductos().subscribe({
      next: (response) => {
        this.productos = response.results || [];
        console.log('✅ Productos cargados para ventas:', this.productos.length);
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  cargarVentas() {
    console.log('🔵 Iniciando carga de ventas...');
    this.loading = true;
    this.error = '';
    this.ventas = []; // Limpiar ventas anteriores
    
    this.ventaService.getVentas(this.paginaActual).subscribe({
      next: (response) => {
        console.log('✅ Ventas recibidas:', response);
        this.ventas = response.results || [];
        this.totalVentas = response.count || 0;
        this.totalPaginas = Math.ceil(this.totalVentas / this.ventasPorPagina);
        
        // Ordenar por fecha descendente (más recientes primero)
        this.ventas.sort((a, b) => {
          const fechaA = new Date(a.fecha).getTime();
          const fechaB = new Date(b.fecha).getTime();
          return fechaB - fechaA;
        });
        this.ventasFiltradas = [...this.ventas];
        console.log('📦 Ventas procesadas:', this.ventas.length);
        console.log('📦 Total ventas:', this.totalVentas);
        console.log('📦 Total páginas:', this.totalPaginas);
        console.log('📦 Ventas filtradas:', this.ventasFiltradas.length);
        this.loading = false;
        console.log('✅ Loading = false');
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('🔄 Detección de cambios forzada');
      },
      error: (err) => {
        console.error('❌ Error al cargar ventas:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Error completo:', err.error);
        
        if (err.status === 500) {
          this.error = 'Error en el servidor al cargar ventas. Revisa los logs de Django.';
        } else {
          this.error = 'Error al cargar ventas. Intenta nuevamente.';
        }
        
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  crearVenta() {
    this.error = '';
    this.success = '';

    this.ventaService.createVenta(this.venta).subscribe({
      next: (response) => {
        console.log('Venta creada', response);
        this.success = 'Venta registrada exitosamente';
        this.venta = { numero: '', fecha: '', rut_cliente: '', total: 0 };
        this.cargarVentas();
      },
      error: (err) => {
        console.error('Error al crear venta', err);
        if (err.error) {
          const errores = Object.keys(err.error).map(k => `${k}: ${err.error[k]}`);
          this.error = errores.join(' | ');
        } else {
          this.error = 'Error al registrar la venta';
        }
      }
    });
  }

  // Método helper para verificar si rut_cliente es un objeto
  isClienteObject(rut_cliente: any): boolean {
    return typeof rut_cliente === 'object' && rut_cliente !== null;
  }

  // Método para obtener el nombre del cliente
  obtenerNombreCliente(rut_cliente: any): string {
    if (typeof rut_cliente === 'object' && rut_cliente !== null) {
      return `${rut_cliente.nombre} ${rut_cliente.apellido}`;
    }
    return rut_cliente || 'Sin cliente';
  }

  // Abrir modal con detalle de venta
  verDetalle(venta: Venta) {
    console.log('🔵 Abriendo detalle para venta:', venta.numero);
    this.ventaSeleccionada = venta;
    this.mostrarModal = true;
    this.loadingDetalle = true;
    this.detallesVenta = [];

    this.ventaService.getDetallesDeVenta(venta.numero).subscribe({
      next: (response) => {
        console.log('✅ Detalles recibidos:', response);
        console.log('📦 Cantidad de detalles:', response.results?.length || 0);
        this.detallesVenta = response.results || [];
        this.loadingDetalle = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al cargar detalles:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ URL:', err.url);
        console.error('❌ Error completo:', err.error);
        this.loadingDetalle = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Cerrar modal
  cerrarModal() {
    this.mostrarModal = false;
    this.ventaSeleccionada = null;
    this.detallesVenta = [];
  }

  // Filtrar ventas por búsqueda
  filtrarVentas() {
    if (!this.terminoBusqueda || !this.terminoBusqueda.trim()) {
      this.ventasFiltradas = [...this.ventas];
      this.cdr.detectChanges();
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.ventasFiltradas = this.ventas.filter(venta => {
      // Buscar por número de venta
      if (venta.numero.toLowerCase().includes(termino)) {
        return true;
      }

      // Buscar por fecha (formato dd/mm/yyyy)
      const fecha = new Date(venta.fecha);
      const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
      if (fechaFormateada.includes(termino)) {
        return true;
      }

      // Buscar por datos del cliente
      if (typeof venta.rut_cliente === 'object' && venta.rut_cliente !== null) {
        const cliente = venta.rut_cliente;
        const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
        const email = (cliente.email || '').toLowerCase();
        const rut = cliente.rut.toLowerCase();
        
        if (nombreCompleto.includes(termino) || email.includes(termino) || rut.includes(termino)) {
          return true;
        }
      } else if (typeof venta.rut_cliente === 'string') {
        if (venta.rut_cliente.toLowerCase().includes(termino)) {
          return true;
        }
      }

      return false;
    });
  }

  // Obtener nombre del producto
  obtenerNombreProducto(producto: any): string {
    // Si el producto es un objeto, usar su nombre directamente
    if (typeof producto === 'object' && producto !== null) {
      return producto.nombre || 'Producto sin nombre';
    }
    // Si es un string (código), buscar en la lista de productos
    const prod = this.productos.find(p => p.codigo === producto);
    return prod ? prod.nombre : producto;
  }

  // Métodos de paginación
  irAPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas || pagina === this.paginaActual) {
      return;
    }
    this.paginaActual = pagina;
    this.cargarVentas();
    this.scrollToTop();
  }

  paginaSiguiente() {
    if (this.paginaActual < this.totalPaginas) {
      this.irAPagina(this.paginaActual + 1);
    }
  }

  paginaAnterior() {
    if (this.paginaActual > 1) {
      this.irAPagina(this.paginaActual - 1);
    }
  }

  obtenerPaginas(): (number | string)[] {
    const paginas: (number | string)[] = [];
    const maxPaginas = 5;

    if (this.totalPaginas <= maxPaginas + 2) {
      for (let i = 1; i <= this.totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      paginas.push(1);

      if (this.paginaActual > 3) {
        paginas.push('...');
      }

      const inicio = Math.max(2, this.paginaActual - 1);
      const fin = Math.min(this.totalPaginas - 1, this.paginaActual + 1);

      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }

      if (this.paginaActual < this.totalPaginas - 2) {
        paginas.push('...');
      }

      if (this.totalPaginas > 1) {
        paginas.push(this.totalPaginas);
      }
    }

    return paginas;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
