import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { VentaService } from '../../services/venta.service';
import { ClienteService } from '../../services/cliente.service';
import { IAService, StatsIA } from '../../services/ia.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit {
  // Filtros
  filtroVentas: 'dia' | 'semana' | 'mes' = 'semana';
  
  // Datos
  ventas: any[] = [];
  clientes: any[] = [];
  productosVendidos: Map<string, { nombre: string, cantidad: number, total: number }> = new Map();
  
  // Estadísticas (inicializadas para evitar NaN)
  totalVentas: number = 0;
  totalClientes: number = 0;
  ventasHoy: number = 0;
  promedioVenta: number = 0;
  
  // Estadísticas IA
  statsIA: StatsIA | null = null;
  cargandoStatsIA: boolean = false;
  
  // Charts
  ventasChart: any;
  productosChart: any;
  clientesChart: any;
  
  constructor(
    private ventaService: VentaService,
    private clienteService: ClienteService,
    private iaService: IAService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Inicializar estadísticas para evitar NaN
    this.totalVentas = 0;
    this.totalClientes = 0;
    this.ventasHoy = 0;
    this.promedioVenta = 0;
    
    this.cargarDatos();
    this.cargarStatsIA();
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  cargarDatos(): void {
    // Cargar ventas
    this.ventaService.getVentas().subscribe({
      next: (response) => {
        this.ventas = response.results;
        this.calcularEstadisticas();
        this.procesarProductosVendidos();
        this.crearGraficos();
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error al cargar ventas:', error)
    });

    // Cargar clientes
    this.clienteService.getClientes().subscribe({
      next: (response) => {
        this.clientes = response.results;
        this.totalClientes = response.results.length;
        this.actualizarGraficoClientes();
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error al cargar clientes:', error)
    });
  }

  calcularEstadisticas(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Asegurar que total sea número
    this.totalVentas = this.ventas.reduce((sum, v) => {
      const total = parseFloat(v.total) || 0;
      return sum + total;
    }, 0);
    
    this.ventasHoy = this.ventas.filter(v => {
      const fechaVenta = new Date(v.fecha);
      fechaVenta.setHours(0, 0, 0, 0);
      return fechaVenta.getTime() === hoy.getTime();
    }).reduce((sum, v) => {
      const total = parseFloat(v.total) || 0;
      return sum + total;
    }, 0);
    
    this.promedioVenta = this.ventas.length > 0 ? Math.round(this.totalVentas / this.ventas.length) : 0;
  }

  procesarProductosVendidos(): void {
    this.productosVendidos.clear();
    
    this.ventas.forEach(venta => {
      if (venta.detalles && Array.isArray(venta.detalles)) {
        venta.detalles.forEach((detalle: any) => {
          const productoId = detalle.producto_id || detalle.producto?.id;
          const productoNombre = detalle.producto_nombre || detalle.producto?.nombre || 'Producto Desconocido';
          const cantidad = detalle.cantidad || 0;
          const precioUnitario = detalle.precio_unitario || 0;
          
          if (this.productosVendidos.has(productoNombre)) {
            const existing = this.productosVendidos.get(productoNombre)!;
            existing.cantidad += cantidad;
            existing.total += cantidad * precioUnitario;
          } else {
            this.productosVendidos.set(productoNombre, {
              nombre: productoNombre,
              cantidad: cantidad,
              total: cantidad * precioUnitario
            });
          }
        });
      }
    });
  }

  filtrarVentasPorPeriodo(): any[] {
    const ahora = new Date();
    let fechaLimite = new Date();
    
    switch(this.filtroVentas) {
      case 'dia':
        fechaLimite.setHours(0, 0, 0, 0);
        break;
      case 'semana':
        fechaLimite.setDate(ahora.getDate() - 7);
        break;
      case 'mes':
        fechaLimite.setMonth(ahora.getMonth() - 1);
        break;
    }
    
    return this.ventas.filter(v => new Date(v.fecha) >= fechaLimite);
  }

  cambiarFiltroVentas(filtro: 'dia' | 'semana' | 'mes'): void {
    this.filtroVentas = filtro;
    this.actualizarGraficoVentas();
  }

  crearGraficos(): void {
    this.crearGraficoVentas();
    this.crearGraficoProductos();
    this.crearGraficoClientes();
  }

  crearGraficoVentas(): void {
    const canvas = document.getElementById('ventasChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.ventasChart) {
      this.ventasChart.destroy();
    }

    const ventasFiltradas = this.filtrarVentasPorPeriodo();
    const datos = this.agruparVentasPorFecha(ventasFiltradas);

    this.ventasChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: datos.labels,
        datasets: [{
          label: 'Ventas ($)',
          data: datos.values,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grace: '10%',
            ticks: {
              callback: function(value) {
                return '$' + Number(value).toLocaleString('es-CL');
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  agruparVentasPorFecha(ventas: any[]): { labels: string[], values: number[] } {
    const agrupadas = new Map<string, number>();
    
    if (ventas.length === 0) {
      return { labels: ['Sin datos'], values: [0] };
    }
    
    ventas.forEach(venta => {
      const fecha = new Date(venta.fecha);
      let clave = '';
      
      if (this.filtroVentas === 'dia') {
        clave = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      } else {
        clave = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
      }
      
      const total = parseFloat(venta.total) || 0;
      agrupadas.set(clave, (agrupadas.get(clave) || 0) + total);
    });
    
    return {
      labels: Array.from(agrupadas.keys()),
      values: Array.from(agrupadas.values())
    };
  }

  actualizarGraficoVentas(): void {
    if (this.ventasChart) {
      const ventasFiltradas = this.filtrarVentasPorPeriodo();
      const datos = this.agruparVentasPorFecha(ventasFiltradas);
      
      this.ventasChart.data.labels = datos.labels;
      this.ventasChart.data.datasets[0].data = datos.values;
      this.ventasChart.update();
    }
  }

  crearGraficoProductos(): void {
    const canvas = document.getElementById('productosChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.productosChart) {
      this.productosChart.destroy();
    }

    const topProductos = Array.from(this.productosVendidos.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    this.productosChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: topProductos.map(p => p.nombre),
        datasets: [{
          label: 'Cantidad Vendida',
          data: topProductos.map(p => p.cantidad),
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(118, 75, 162, 0.8)',
            'rgba(81, 207, 102, 0.8)',
            'rgba(241, 196, 15, 0.8)',
            'rgba(231, 76, 60, 0.8)'
          ],
          borderColor: [
            '#667eea',
            '#764ba2',
            '#51cf66',
            '#f1c40f',
            '#e74c3c'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  crearGraficoClientes(): void {
    const canvas = document.getElementById('clientesChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    if (this.clientesChart) {
      this.clientesChart.destroy();
    }

    // Agrupar clientes por tipo (registrados vs temporales)
    const clientesPorTipo = this.agruparClientesPorTipo();

    this.clientesChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: clientesPorTipo.labels,
        datasets: [{
          data: clientesPorTipo.values,
          backgroundColor: [
            'rgba(102, 126, 234, 0.9)',
            'rgba(241, 196, 15, 0.9)'
          ],
          borderColor: '#fff',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return label + ': ' + value + ' (' + percentage + '%)';
              }
            }
          }
        }
      }
    });
  }

  agruparClientesPorTipo(): { labels: string[], values: number[] } {
    let clientesRegistrados = 0;
    let clientesTemporales = 0;
    
    this.clientes.forEach(cliente => {
      // Cliente registrado: tiene email y nombre completo
      // Cliente temporal: solo RUT (nombre es "Cliente Web" o similar)
      if (cliente.email && cliente.email.trim() !== '' && cliente.nombre !== 'Cliente Web') {
        clientesRegistrados++;
      } else {
        clientesTemporales++;
      }
    });
    
    return {
      labels: ['Clientes Registrados', 'Clientes Temporales'],
      values: [clientesRegistrados, clientesTemporales]
    };
  }

  actualizarGraficoClientes(): void {
    if (this.clientesChart) {
      const datos = this.agruparClientesPorTipo();
      this.clientesChart.data.labels = datos.labels;
      this.clientesChart.data.datasets[0].data = datos.values;
      this.clientesChart.update();
    }
  }

  getTopProductos(): any[] {
    return Array.from(this.productosVendidos.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }

  cargarStatsIA(): void {
    this.cargandoStatsIA = true;
    this.iaService.getEstadisticasIA().subscribe({
      next: (data) => {
        this.statsIA = data;
        this.cargandoStatsIA = false;
        this.cdr.detectChanges();
        console.log('🤖 Stats IA cargadas:', data);
      },
      error: (err) => {
        console.error('❌ Error cargando stats IA:', err);
        this.cargandoStatsIA = false;
        this.cdr.detectChanges();
      }
    });
  }
}
