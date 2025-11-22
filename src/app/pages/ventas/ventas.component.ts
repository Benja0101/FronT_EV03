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
  clientes: Cliente[] = [];
  productos: Producto[] = [];
  
  loading = false;
  error = '';
  success = '';

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
    
    this.ventaService.getAllVentas().subscribe({
      next: (response) => {
        console.log('✅ Ventas recibidas:', response);
        this.ventas = response.results || [];
        console.log('📦 Ventas procesadas:', this.ventas.length);
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
}
