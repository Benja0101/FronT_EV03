import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaService, Venta, DetalleVenta } from '../services/venta.service';
import { ClienteService, Cliente } from '../services/cliente.service';
import { ProductoService, Producto } from '../services/producto.service';

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
    private productoService: ProductoService
  ) {}

  ngOnInit() {
    this.cargarClientes();
    this.cargarProductos();
    this.cargarVentas();
  }

  cargarClientes() {
    this.clienteService.getAllClientes().subscribe({
      next: (data) => {
        this.clientes = Array.isArray(data) ? data : (data as any).results || [];
      },
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }

  cargarProductos() {
    this.productoService.getAllProductos().subscribe({
      next: (data) => {
        this.productos = Array.isArray(data) ? data : (data as any).results || [];
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  cargarVentas() {
    this.loading = true;
    this.ventaService.getAllVentas().subscribe({
      next: (data) => {
        this.ventas = Array.isArray(data) ? data : (data as any).results || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar ventas', err);
        this.loading = false;
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
}
