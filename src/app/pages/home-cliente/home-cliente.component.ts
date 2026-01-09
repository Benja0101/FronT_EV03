import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductoService, Producto, getBeneficiosArray, getPalabrasClave } from '../../services/producto.service';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { RecomendacionesIAComponent } from '../../components/recomendaciones-ia/recomendaciones-ia.component';

@Component({
  selector: 'app-home-cliente',
  standalone: true,
  imports: [CommonModule, RecomendacionesIAComponent],
  templateUrl: './home-cliente.component.html',
  styleUrl: './home-cliente.component.css'
})
export class HomeClienteComponent implements OnInit {
  productos: any[] = [];
  carritoCount: number = 0;
  error: string = '';
  success: string = '';
  clienteRut: string = '';
  
  // ⭐ Modal de detalles
  mostrarModalDetalle = false;
  productoSeleccionado: Producto | null = null;
  beneficiosProducto: string[] = [];
  palabrasClaveProducto: string[] = [];
  
  // 📄 Paginación
  paginaActual: number = 1;
  totalPaginas: number = 1;
  totalProductos: number = 0;
  productosPorPagina: number = 9;
  cargando: boolean = false;

  constructor(
    private productoService: ProductoService,
    private carritoService: CarritoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarProductos();
    this.carritoService.carrito$.subscribe(() => {
      this.carritoCount = this.carritoService.obtenerCantidadTotal();
    });
    
    // Obtener RUT del cliente logueado desde localStorage si está disponible
    const rutCliente = localStorage.getItem('cliente_rut');
    if (rutCliente) {
      this.clienteRut = rutCliente;
    }
    
    // Scroll automático a la sección de productos después de un breve delay
    setTimeout(() => {
      this.scrollToProductos();
    }, 800);
  }

  cargarProductos() {
    this.cargando = true;
    this.productos = []; // Limpiar array antes de cargar
    this.productoService.getProductos(this.paginaActual).subscribe({
      next: (data: any) => {
        this.productos = data.results || [];
        this.totalProductos = data.count || 0;
        this.totalPaginas = Math.ceil(this.totalProductos / this.productosPorPagina);
        this.cargando = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
      error: (err: any) => {
        this.error = 'Error al cargar los productos';
        this.cargando = false;
        this.cdr.detectChanges();
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

  irAlLoginCliente() {
    this.router.navigate(['/login-cliente']);
  }

  irAlRegistroCliente() {
    this.router.navigate(['/registro-cliente']);
  }

  irAlPerfil() {
    this.router.navigate(['/cliente/perfil']);
  }

  isClienteLogueado(): boolean {
    return this.authService.isCliente();
  }

  getNombreCliente(): string {
    const clienteData = this.authService.getClienteData();
    if (clienteData) {
      return clienteData.nombre || 'Mi Perfil';
    }
    return 'Mi Perfil';
  }

  cerrarSesion() {
    this.authService.logout();
    this.mostrarMensaje('Sesión cerrada exitosamente', 'success');
    // Recargar datos si es necesario
    this.ngOnInit();
  }

  scrollToProductos() {
    const element = document.getElementById('productos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  verDetalles(producto: Producto) {
    this.productoSeleccionado = producto;
    
    // Parsear beneficios y palabras clave
    this.beneficiosProducto = getBeneficiosArray(producto);
    this.palabrasClaveProducto = getPalabrasClave(producto);
    
    this.mostrarModalDetalle = true;
    
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.productoSeleccionado = null;
    this.beneficiosProducto = [];
    this.palabrasClaveProducto = [];
    
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
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
  
  // 📄 Métodos de paginación
  irAPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas || pagina === this.paginaActual) {
      return;
    }
    this.paginaActual = pagina;
    this.cargarProductos();
    this.scrollToProductos();
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
}
