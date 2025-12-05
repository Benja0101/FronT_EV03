import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService, Producto } from '../../services/producto.service';
import { IAService, DescripcionProducto } from '../../services/ia.service';

@Component({
  selector: 'app-producto-editar',
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-editar.html',
  styleUrl: './producto-editar.css'
})
export class ProductoEditar implements OnInit {
  producto: Producto = {
    codigo: '',
    nombre: '',
    stock: 0,
    precio: 0
  };
  loading = false;
  error = '';
  success = '';
  cargandoDescripcion = false;
  
  // 📸 Propiedades para manejo de imágenes
  archivoSeleccionado: File | null = null;
  imagenPreview: string | null = null;
  cargandoImagen = false;
  errorImagen = '';
  
  // Configuración de validación
  readonly TAMANIO_MAX_MB = 5;
  readonly FORMATOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

  constructor(
    private productoService: ProductoService,
    private router: Router,
    private route: ActivatedRoute,
    private iaService: IAService
  ) {}

  ngOnInit() {
    const codigo = this.route.snapshot.paramMap.get('codigo');
    if (codigo) {
      this.cargarProducto(codigo);
    }
  }

  cargarProducto(codigo: string) {
    this.loading = true;
    this.productoService.getProducto(codigo).subscribe({
      next: (data) => {
        this.producto = data;
        // Si el producto tiene imagen, mostrarla en el preview
        if (data.foto_url) {
          this.imagenPreview = data.foto_url;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar producto', err);
        this.error = 'Error al cargar el producto';
        this.loading = false;
      }
    });
  }

  actualizar() {
    this.error = '';
    this.success = '';
    this.errorImagen = '';

    // Si hay imagen nueva, validar antes de enviar
    if (this.archivoSeleccionado && !this.validarImagen()) {
      return;
    }

    // 🧹 Limpiar el objeto antes de enviar
    const productoLimpio: any = {
      nombre: this.producto.nombre,
      codigo: this.producto.codigo,
      stock: Number(this.producto.stock),
      precio: Number(this.producto.precio)
    };

    // Agregar descripción solo si existe
    if (this.producto.descripcion && this.producto.descripcion.trim()) {
      productoLimpio.descripcion = this.producto.descripcion;
    }

    // Agregar foto solo si hay una nueva
    if (this.producto.foto) {
      productoLimpio.foto = this.producto.foto;
    }

    console.log('📤 Actualizando producto:', {
      ...productoLimpio,
      foto: productoLimpio.foto ? `Base64 (${(productoLimpio.foto.length / 1024).toFixed(2)}KB)` : 'Sin cambios'
    });

    this.productoService.updateProducto(this.producto.codigo, productoLimpio).subscribe({
      next: (response) => {
        console.log('✅ Producto actualizado', response);
        this.success = 'Producto actualizado exitosamente';
        setTimeout(() => {
          this.router.navigate(['/admin/productos']);
        }, 1500);
      },
      error: (err) => {
        console.error('❌ Error completo:', err);
        console.error('📋 Error del backend:', err.error);
        
        if (err.error) {
          if (typeof err.error === 'object') {
            const errores = Object.keys(err.error).map(k => {
              const valor = Array.isArray(err.error[k]) ? err.error[k].join(', ') : err.error[k];
              return `${k}: ${valor}`;
            });
            this.error = errores.join(' | ');
          } else {
            this.error = err.error;
          }
        } else {
          this.error = 'Error al actualizar el producto';
        }
      }
    });
  }

  cancelar() {
    this.router.navigate(['/admin/productos']);
  }

  generarDescripcionIA() {
    if (!this.producto.id) {
      this.error = 'Producto no válido para generar descripción';
      return;
    }

    this.cargandoDescripcion = true;
    this.error = '';

    this.iaService.generarDescripcion(this.producto.id).subscribe({
      next: (data: DescripcionProducto) => {
        console.log('Descripción generada:', data);
        
        // Actualizar el producto con la descripción generada
        this.producto.descripcion = data.descripcion_larga;
        this.success = '✅ Descripción generada con IA. Guarda los cambios para aplicarla.';
        this.cargandoDescripcion = false;
      },
      error: (err) => {
        console.error('Error al generar descripción:', err);
        this.error = '❌ Error al generar descripción con IA';
        this.cargandoDescripcion = false;
      }
    });
  }

  // 📸 MÉTODOS PARA MANEJO DE IMÁGENES

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.errorImagen = '';

    if (!this.FORMATOS_PERMITIDOS.includes(file.type)) {
      this.errorImagen = `Formato no permitido. Use: JPG, PNG, GIF, WEBP o BMP`;
      this.limpiarImagen();
      return;
    }

    const tamanioMB = file.size / 1024 / 1024;
    if (tamanioMB > this.TAMANIO_MAX_MB) {
      this.errorImagen = `Imagen muy grande. Máximo ${this.TAMANIO_MAX_MB}MB, seleccionado: ${tamanioMB.toFixed(2)}MB`;
      this.limpiarImagen();
      return;
    }

    this.archivoSeleccionado = file;
    this.convertirABase64(file);
  }

  private convertirABase64(file: File): void {
    this.cargandoImagen = true;
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;
      this.imagenPreview = base64;
      this.producto.foto = base64;
      this.cargandoImagen = false;
      console.log('✅ Imagen convertida a base64');
    };

    reader.onerror = () => {
      this.errorImagen = 'Error al leer el archivo';
      this.limpiarImagen();
      this.cargandoImagen = false;
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
    this.producto.foto = undefined;
  }

  private limpiarImagen(): void {
    this.archivoSeleccionado = null;
    this.imagenPreview = null;
    this.cargandoImagen = false;
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
      ? `${(tamanioMB * 1024).toFixed(0)}KB`
      : `${tamanioMB.toFixed(2)}MB`;
  }
}
