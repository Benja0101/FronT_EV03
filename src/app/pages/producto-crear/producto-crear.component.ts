import { Component, ChangeDetectorRef, inject } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);
  producto: Producto = {
    nombre: '',
    codigo: '', // Se mantendrá vacío, el backend lo genera automáticamente
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

    // Si el producto ya tiene ID, significa que ya fue creado (por la IA)
    // En ese caso, solo actualizar los campos faltantes y redirigir
    if (this.producto.id) {
      // Preparar datos para actualización
      const productoActualizado: any = {
        nombre: this.producto.nombre,
        codigo: this.producto.codigo,
        stock: Number(this.producto.stock),
        precio: Number(this.producto.precio)
      };

      if (this.producto.descripcion && this.producto.descripcion.trim()) {
        productoActualizado.descripcion = this.producto.descripcion;
      }

      if (this.producto.foto) {
        productoActualizado.foto = this.producto.foto;
      }

      this.productoService.updateProducto(this.producto.codigo, productoActualizado).subscribe({
        next: (response) => {
          this.success = 'Producto guardado exitosamente';
          setTimeout(() => {
            this.router.navigate(['/admin/productos']);
          }, 1500);
        },
        error: (err) => {
          this.manejarErrorBackend(err);
        }
      });
      return;
    }

    // Si no tiene ID, crear nuevo producto
    // Si hay imagen, validar antes de enviar
    if (this.archivoSeleccionado && !this.validarImagen()) {
      return;
    }

    // 🧹 Preparar objeto SIN código (el backend lo genera automáticamente)
    const productoLimpio: any = {
      nombre: this.producto.nombre,
      // codigo NO se envía - se genera automáticamente en el backend
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

    this.productoService.createProducto(productoLimpio).subscribe({
      next: (response) => {
        this.producto = response; // Guardar el producto creado con su ID
        this.success = 'Producto creado exitosamente';
        setTimeout(() => {
          this.router.navigate(['/admin/productos']);
        }, 1500);
      },
      error: (err) => {
        this.manejarErrorBackend(err);
      }
    });
  }

  private manejarErrorBackend(err: any) {
    
    if (err.error) {
      // Mostrar errores específicos del backend
      if (typeof err.error === 'object') {
        const errores = Object.keys(err.error).map(k => {
          const valor = Array.isArray(err.error[k]) ? err.error[k].join(', ') : err.error[k];
          
          // Mensajes más amigables
          if (k === 'codigo' && (valor.toLowerCase().includes('unique') || 
                                  valor.toLowerCase().includes('already exists') || 
                                  valor.toLowerCase().includes('duplicate'))) {
            return `⚠️ El código "${this.producto.codigo}" ya existe. Usa otro código.`;
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
      this.error = 'Error al procesar el producto';
    }
  }

  cancelar() {
    this.router.navigate(['/admin/productos']);
  }

  generarDescripcionIA() {
    // Validar que todos los campos requeridos estén completos (SIN código)
    if (!this.producto.nombre || !this.producto.precio || this.producto.stock === undefined) {
      this.error = '⚠️ Completa todos los campos requeridos (nombre, stock y precio) antes de generar la descripción con IA';
      return;
    }

    this.cargandoDescripcion = true;
    this.error = '';
    this.success = '';

    // Verificar si el producto YA fue creado (tiene ID y código)
    if (!this.producto.id || !this.producto.codigo) {
      console.log('🆕 Producto no existe, creando primero...');
      // Preparar producto completo SIN código (se genera automáticamente)
      const productoCompleto: any = {
        nombre: this.producto.nombre,
        // codigo NO se envía - se genera automáticamente
        stock: Number(this.producto.stock),
        precio: Number(this.producto.precio)
      };

      // Agregar foto si existe
      if (this.producto.foto) {
        productoCompleto.foto = this.producto.foto;
      }

      this.productoService.createProducto(productoCompleto).subscribe({
        next: (response) => {
          console.log('✅ Producto creado:', response);
          this.producto = response; // Guardar el producto completo con ID y código generado
          this.cdr.detectChanges(); // Forzar actualización de la UI
          
          // Ahora sí generar la descripción
          this.generarYGuardarDescripcion();
        },
        error: (err) => {
          console.error('❌ Error al crear producto:', err);
          this.manejarErrorBackend(err);
          this.cargandoDescripcion = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // El producto YA existe, solo generar descripción
      console.log('✅ Producto ya existe (ID: ' + this.producto.id + '), generando descripción...');
      this.generarYGuardarDescripcion();
    }
  }

  generarYGuardarDescripcion() {
    if (!this.producto.id) {
      this.error = '❌ Error: El producto debe tener un ID';
      this.cargandoDescripcion = false;
      this.cdr.detectChanges();
      return;
    }

    this.iaService.generarDescripcion(this.producto.id).subscribe({
      next: (data: DescripcionProducto) => {
        console.log('✅ Respuesta de la IA:', data);
        
        // ✅ El backend YA GUARDÓ la descripción automáticamente
        // Solo necesitamos actualizar el objeto local con los datos recibidos
        this.producto.descripcion = data.descripcion_larga;
        
        // Mostrar en consola para debug
        console.log('📝 Descripción larga asignada:', this.producto.descripcion);
        console.log('📝 Descripción corta:', data.descripcion_corta);
        console.log('🔑 Palabras clave:', data.palabras_clave);
        console.log('✨ Beneficios:', data.beneficios);
        
        this.success = '✅ Descripción generada exitosamente con IA';
        this.cargandoDescripcion = false;
        
        // Forzar detección de cambios para actualizar la UI inmediatamente
        this.cdr.detectChanges();
        
        console.log('🔄 UI actualizada, cargandoDescripcion:', this.cargandoDescripcion);
      },
      error: (err) => {
        console.error('❌ Error al generar descripción:', err);
        if (err.error?.detail) {
          this.error = `❌ ${err.error.detail}`;
        } else if (err.error?.error) {
          this.error = `❌ ${err.error.error}`;
        } else {
          this.error = '❌ Error al generar descripción con IA';
        }
        this.cargandoDescripcion = false;
        this.cdr.detectChanges();
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
      this.cdr.detectChanges(); // Forzar actualización de la UI
    };

    reader.onerror = () => {
      this.errorImagen = 'Error al leer el archivo';
      this.limpiarImagen();
      this.cargandoImagen = false;
      this.cdr.detectChanges();
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
