import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService, Producto } from '../../services/producto.service';
import { IAService } from '../../services/ia.service';

@Component({
  selector: 'app-productos-lista',
  imports: [CommonModule, FormsModule],
  templateUrl: './productos-lista.component.html',
  styleUrls: ['./productos-lista.component.css']
})
export class ProductosListaComponent implements OnInit {
  productos: Producto[] = [];
  loading = false;
  error = '';
  
  // 📄 Paginación
  totalProductos: number = 0;
  paginaActual: number = 1;
  totalPaginas: number = 0;
  productosPorPagina: number = 12;
  siguienteUrl: string | null = null;
  anteriorUrl: string | null = null;
  
  // Modal de edición
  mostrarModal = false;
  productoEditando: Producto = {
    codigo: '',
    nombre: '',
    stock: 0,
    precio: 0
  };
  guardandoEdicion = false;
  
  // ⭐ IA
  cargandoDescripcion = false;

  // 📸 Propiedades para manejo de imágenes
  @ViewChild('fileInputModal') fileInputModal!: ElementRef<HTMLInputElement>;
  archivoSeleccionado: File | null = null;
  imagenPreview: string | null = null;
  cargandoImagen = false;
  errorImagen = '';
  
  // Configuración de validación
  readonly TAMANIO_MAX_MB = 5;
  readonly FORMATOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

  // Hacer Math disponible en el template
  Math = Math;

  constructor(
    private productoService: ProductoService,
    private iaService: IAService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarProductos(1);
  }

  cargarProductos(pagina: number = 1) {
    this.loading = true;
    this.error = '';
    this.productos = [];

    this.productoService.getProductos(pagina).subscribe({
      next: (response) => {
        this.productos = response.results || [];
        this.totalProductos = response.count;
        this.paginaActual = pagina;
        this.totalPaginas = Math.ceil(response.count / this.productosPorPagina);
        this.siguienteUrl = response.next;
        this.anteriorUrl = response.previous;
        this.loading = false;
        
        // Scroll al inicio INMEDIATAMENTE al cambiar de página
        window.scrollTo(0, 0);
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar productos. Intente nuevamente.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Métodos de paginación
  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas && pagina !== this.paginaActual) {
      this.cargarProductos(pagina);
    }
  }

  paginaAnterior() {
    if (this.anteriorUrl && this.paginaActual > 1) {
      this.cargarProductos(this.paginaActual - 1);
    }
  }

  paginaSiguiente() {
    if (this.siguienteUrl && this.paginaActual < this.totalPaginas) {
      this.cargarProductos(this.paginaActual + 1);
    }
  }

  // Obtener array de números de página para mostrar
  getPaginasVisibles(): number[] {
    const maxPaginasVisibles = 5;
    const paginas: number[] = [];
    
    if (this.totalPaginas <= maxPaginasVisibles) {
      // Mostrar todas las páginas
      for (let i = 1; i <= this.totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Mostrar páginas alrededor de la actual
      let inicio = Math.max(1, this.paginaActual - 2);
      let fin = Math.min(this.totalPaginas, inicio + maxPaginasVisibles - 1);
      
      if (fin - inicio < maxPaginasVisibles - 1) {
        inicio = Math.max(1, fin - maxPaginasVisibles + 1);
      }
      
      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }
    }
    
    return paginas;
  }

  // Obtener rango de productos mostrados
  getRangoProductos(): { inicio: number, fin: number } {
    const inicio = (this.paginaActual - 1) * this.productosPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.productosPorPagina, this.totalProductos);
    return { inicio, fin };
  }

  irACrear() {
    this.router.navigate(['/admin/productos/crear']);
  }

  editar(producto: Producto) {
    this.abrirModal(producto);
  }

  abrirModal(producto: Producto) {
    this.productoEditando = { ...producto };
    this.mostrarModal = true;
    
    // Si tiene foto_url, mostrarla en el preview
    if (producto.foto_url) {
      this.imagenPreview = producto.foto_url;
    } else {
      this.imagenPreview = null;
    }
    
    this.archivoSeleccionado = null;
    this.errorImagen = '';
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.error = '';
    this.limpiarImagen();
  }

  guardarEdicion() {
    if (!this.productoEditando.nombre || this.productoEditando.stock < 0 || this.productoEditando.precio <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    // Validar imagen si hay una nueva seleccionada
    if (this.archivoSeleccionado && !this.validarImagen()) {
      return;
    }

    this.guardandoEdicion = true;
    this.error = '';
    this.errorImagen = '';

    // Si hay nueva imagen, agregarla al producto
    if (this.archivoSeleccionado && this.productoEditando.foto) {
      // La foto ya está en base64 en productoEditando.foto
      console.log('📸 Actualizando con nueva imagen');
    }

    this.productoService.updateProducto(this.productoEditando.codigo, this.productoEditando).subscribe({
      next: () => {
        this.guardandoEdicion = false;
        this.mostrarModal = false;
        this.cargarProductos();
        this.limpiarImagen();
        alert('✅ Producto actualizado exitosamente');
      },
      error: (err) => {
        console.error('Error al actualizar producto', err);
        this.guardandoEdicion = false;
        
        if (err.error?.foto) {
          this.errorImagen = Array.isArray(err.error.foto) ? err.error.foto[0] : err.error.foto;
        }
        
        this.error = 'Error al actualizar el producto';
        alert('❌ Error al actualizar el producto');
      }
    });
  }

  generarDescripcionIA() {
    if (!this.productoEditando.id) {
      alert('⚠️ Debe guardar el producto primero antes de generar descripción con IA');
      return;
    }

    this.cargandoDescripcion = true;
    this.error = '';

    this.iaService.generarDescripcion(this.productoEditando.id).subscribe({
      next: (data) => {
        // ⭐ Backend ya guardó automáticamente
        
        // Actualizar producto local con los nuevos datos
        this.productoEditando.descripcion_corta = data.descripcion_corta;
        this.productoEditando.descripcion_larga = data.descripcion_larga;
        this.productoEditando.palabras_clave = data.palabras_clave.join(', ');
        this.productoEditando.beneficios = JSON.stringify(data.beneficios);
        this.productoEditando.descripcion_generada_fecha = data.fecha_generacion;
        
        this.cargandoDescripcion = false;
        this.cdr.detectChanges();
        
        alert(`✅ Descripción generada y guardada automáticamente en la base de datos\n\nGuardado: ${data.guardado ? 'Sí' : 'No'}\nFecha: ${new Date(data.fecha_generacion).toLocaleString('es-CL')}`);
        
        console.log('📊 Descripción IA generada:', {
          guardado: data.guardado,
          fecha: data.fecha_generacion,
          descripcion_corta: data.descripcion_corta.substring(0, 50) + '...'
        });
      },
      error: (err) => {
        console.error('❌ Error al generar descripción:', err);
        this.cargandoDescripcion = false;
        this.error = 'Error al generar descripción con IA';
        alert('❌ Error al generar descripción con IA. Intente nuevamente.');
      }
    });
  }

  eliminar(codigo: string) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      this.productoService.deleteProducto(codigo).subscribe({
        next: () => {
          this.cargarProductos();
          alert('Producto eliminado exitosamente');
        },
        error: (err) => {
          console.error('Error al eliminar', err);
          if (err.status === 500) {
            this.error = 'No se puede eliminar este producto porque está asociado a una o más ventas.';
            alert('❌ No se puede eliminar este producto porque está asociado a una o más ventas.');
          } else if (err.status === 404) {
            this.error = 'Producto no encontrado.';
          } else {
            this.error = 'Error al eliminar el producto.';
          }
        }
      });
    }
  }

  // 📸 MÉTODOS PARA MANEJO DE IMÁGENES

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.errorImagen = '';

    // Validar tipo de archivo
    if (!this.FORMATOS_PERMITIDOS.includes(file.type)) {
      this.errorImagen = `Formato no permitido. Use: JPG, PNG, GIF, WEBP o BMP`;
      this.limpiarImagen();
      return;
    }

    // Validar tamaño (5MB máximo)
    const tamanioMB = file.size / 1024 / 1024;
    if (tamanioMB > this.TAMANIO_MAX_MB) {
      this.errorImagen = `Imagen muy grande. Máximo ${this.TAMANIO_MAX_MB}MB, seleccionado: ${tamanioMB.toFixed(2)}MB`;
      this.limpiarImagen();
      return;
    }

    // Archivo válido, procesar
    this.archivoSeleccionado = file;
    this.convertirABase64(file);
  }

  private convertirABase64(file: File): void {
    this.cargandoImagen = true;
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;
      
      // Guardar para preview
      this.imagenPreview = base64;
      
      // Guardar en el producto para enviar al backend
      this.productoEditando.foto = base64;
      
      this.cargandoImagen = false;
      this.cdr.detectChanges();
    };

    reader.onerror = () => {
      this.errorImagen = 'Error al leer el archivo';
      this.limpiarImagen();
      this.cargandoImagen = false;
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  private validarImagen(): boolean {
    if (!this.archivoSeleccionado) {
      return true;
    }

    if (!this.FORMATOS_PERMITIDOS.includes(this.archivoSeleccionado.type)) {
      this.errorImagen = 'Formato de imagen no válido';
      return false;
    }

    const tamanioMB = this.archivoSeleccionado.size / 1024 / 1024;
    if (tamanioMB > this.TAMANIO_MAX_MB) {
      this.errorImagen = `Imagen muy grande (${tamanioMB.toFixed(2)}MB). Máximo ${this.TAMANIO_MAX_MB}MB`;
      return false;
    }

    return true;
  }

  eliminarImagen(): void {
    this.limpiarImagen();
    this.productoEditando.foto = undefined;
    this.productoEditando.foto_url = undefined;
  }

  private limpiarImagen(): void {
    this.archivoSeleccionado = null;
    this.imagenPreview = null;
    this.cargandoImagen = false;
    this.errorImagen = '';
  }

  getNombreArchivo(): string {
    if (!this.archivoSeleccionado) return '';
    const nombre = this.archivoSeleccionado.name;
    return nombre.length > 30 ? nombre.substring(0, 27) + '...' : nombre;
  }

  getTamanioArchivo(): string {
    if (!this.archivoSeleccionado) return '';
    const tamanioMB = this.archivoSeleccionado.size / 1024 / 1024;
    return tamanioMB < 1 
      ? `${(tamanioMB * 1024).toFixed(0)} KB`
      : `${tamanioMB.toFixed(2)} MB`;
  }
}
