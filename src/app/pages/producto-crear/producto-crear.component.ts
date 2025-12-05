import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductoService, Producto } from '../../services/producto.service';
import { IAService, DescripcionProducto } from '../../services/ia.service';

@Component({
  selector: 'app-producto-crear',
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-crear.component.html',
  styleUrls: ['./producto-crear.component.css']
})
export class ProductoCrearComponent {
  producto: Producto = {
    nombre: '',
    codigo: '',
    stock: 0,
    precio: 0,
    descripcion: ''
  };
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
    private iaService: IAService
  ) {}

  crear() {
    this.error = '';
    this.success = '';
    this.errorImagen = '';

    // Si hay imagen, validar antes de enviar
    if (this.archivoSeleccionado && !this.validarImagen()) {
      return;
    }

    // 🧹 Limpiar el objeto: eliminar campos vacíos y undefined
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

    // Agregar foto solo si existe
    if (this.producto.foto) {
      productoLimpio.foto = this.producto.foto;
    }

    // 🔍 DEBUG: Ver qué se está enviando
    console.log('📤 Enviando producto:', {
      ...productoLimpio,
      foto: productoLimpio.foto ? `Base64 (${(productoLimpio.foto.length / 1024).toFixed(2)}KB)` : 'Sin imagen'
    });

    this.productoService.createProducto(productoLimpio).subscribe({
      next: (response) => {
        console.log('✅ Producto creado', response);
        this.success = 'Producto creado exitosamente';
        setTimeout(() => {
          this.router.navigate(['/admin/productos']);
        }, 1500);
      },
      error: (err) => {
        console.error('❌ Error completo:', err);
        console.error('📋 Error del backend:', err.error);
        console.error('🔍 Detalle del error de codigo:', err.error?.codigo);
        
        if (err.error) {
          // Mostrar errores específicos del backend
          if (typeof err.error === 'object') {
            const errores = Object.keys(err.error).map(k => {
              const valor = Array.isArray(err.error[k]) ? err.error[k].join(', ') : err.error[k];
              
              // Mensajes más amigables
              if (k === 'codigo' && valor.toLowerCase().includes('unique')) {
                return `⚠️ El código "${this.producto.codigo}" ya existe. Usa otro código.`;
              }
              if (k === 'codigo' && valor.toLowerCase().includes('already exists')) {
                return `⚠️ El código "${this.producto.codigo}" ya existe. Usa otro código.`;
              }
              if (k === 'codigo' && valor.toLowerCase().includes('duplicate')) {
                return `⚠️ El código "${this.producto.codigo}" está duplicado. Usa otro código.`;
              }
              if (k === 'foto' && valor.includes('corrupta')) {
                return `⚠️ Imagen corrupta o inválida`;
              }
              if (k === 'foto' && valor.includes('grande')) {
                return `⚠️ Imagen muy grande (máximo 5MB)`;
              }
              
              return `${k}: ${valor}`;
            });
            this.error = errores.join(' | ');
          } else {
            this.error = err.error;
          }
        } else {
          this.error = 'Error al crear el producto';
        }
      }
    });
  }

  cancelar() {
    this.router.navigate(['/admin/productos']);
  }

  generarDescripcionIA() {
    if (!this.producto.nombre || !this.producto.codigo) {
      this.error = 'Completa al menos el nombre y código del producto';
      return;
    }

    this.cargandoDescripcion = true;
    this.error = '';

    // Primero crear el producto si no existe
    if (!this.producto.id) {
      this.productoService.createProducto(this.producto).subscribe({
        next: (response) => {
          this.producto = response;
          this.generarYGuardarDescripcion();
        },
        error: (err) => {
          console.error('Error al crear producto:', err);
          this.error = '❌ Error al crear el producto';
          this.cargandoDescripcion = false;
        }
      });
    } else {
      this.generarYGuardarDescripcion();
    }
  }

  generarYGuardarDescripcion() {
    if (!this.producto.id) return;

    this.iaService.generarDescripcion(this.producto.id).subscribe({
      next: (data: DescripcionProducto) => {
        console.log('Descripción generada:', data);
        
        // Actualizar el producto con la descripción generada
        this.producto.descripcion = data.descripcion_larga;
        
        // Guardar en la BD
        this.productoService.updateProducto(this.producto.codigo, this.producto).subscribe({
          next: () => {
            this.success = '✅ Descripción generada y guardada con IA exitosamente';
            this.cargandoDescripcion = false;
          },
          error: (err) => {
            console.error('Error al guardar descripción:', err);
            this.error = '❌ Error al guardar la descripción';
            this.cargandoDescripcion = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al generar descripción:', err);
        this.error = '❌ Error al generar descripción con IA';
        this.cargandoDescripcion = false;
      }
    });
  }

  // 📸 MÉTODOS PARA MANEJO DE IMÁGENES

  /**
   * Maneja la selección de archivo desde el input
   */
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

  /**
   * Convierte el archivo a Base64 y genera preview
   */
  private convertirABase64(file: File): void {
    this.cargandoImagen = true;
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;
      
      // Guardar para preview
      this.imagenPreview = base64;
      
      // Guardar en el producto para enviar al backend
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

  /**
   * Valida la imagen antes de enviar al backend
   */
  private validarImagen(): boolean {
    if (!this.archivoSeleccionado) {
      return true; // No hay imagen, OK
    }

    // Validar tipo
    if (!this.FORMATOS_PERMITIDOS.includes(this.archivoSeleccionado.type)) {
      this.errorImagen = 'Formato de imagen no válido';
      return false;
    }

    // Validar tamaño
    const tamanioMB = this.archivoSeleccionado.size / 1024 / 1024;
    if (tamanioMB > this.TAMANIO_MAX_MB) {
      this.errorImagen = `Imagen muy grande (${tamanioMB.toFixed(2)}MB). Máximo ${this.TAMANIO_MAX_MB}MB`;
      return false;
    }

    return true;
  }

  /**
   * Elimina la imagen seleccionada
   */
  eliminarImagen(): void {
    this.limpiarImagen();
    this.producto.foto = undefined;
  }

  /**
   * Limpia las variables de imagen
   */
  private limpiarImagen(): void {
    this.archivoSeleccionado = null;
    this.imagenPreview = null;
    this.cargandoImagen = false;
  }

  /**
   * Obtiene el nombre corto del archivo
   */
  getNombreArchivo(): string {
    if (!this.archivoSeleccionado) return '';
    const nombre = this.archivoSeleccionado.name;
    return nombre.length > 30 ? nombre.substring(0, 27) + '...' : nombre;
  }

  /**
   * Formatea el tamaño del archivo
   */
  getTamanioArchivo(): string {
    if (!this.archivoSeleccionado) return '';
    const tamanioMB = this.archivoSeleccionado.size / 1024 / 1024;
    return tamanioMB < 1 
      ? `${(tamanioMB * 1024).toFixed(0)}KB`
      : `${tamanioMB.toFixed(2)}MB`;
  }
}
