import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Recomendacion {
  producto_id: number;
  nombre: string;
  codigo: string;
  precio: number;
  stock: number;
  razon: string;
  confianza: 'alta' | 'media' | 'baja';
}

export interface RecomendacionesResponse {
  cliente: {
    rut: string;
    nombre: string;
  };
  recomendaciones: Recomendacion[];
  mensaje: string;
}

export interface DescripcionProducto {
  producto: {
    id: number;
    nombre: string;
    codigo: string;
    precio: number;
  };
  descripcion_corta: string;
  descripcion_larga: string;
  palabras_clave: string[];
  beneficios: string[];
  
  // ⭐ Nuevos campos del backend
  guardado: boolean;
  fecha_generacion: string;
}

export interface ChatResponse {
  respuesta: string;
  tipo: 'informacion' | 'consulta_venta' | 'consulta_producto' | 'politicas' | 'otro';
  requiere_humano: boolean;
  sugerencias: string[];
}

export interface StatsIA {
  productos: {
    total: number;
    con_stock: number;
    sin_stock: number;
  };
  clientes: number;
  ventas: number;
  muestra_productos: Array<{
    id: number;
    nombre: string;
    precio: number;
    stock: number;
  }>;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class IAService {
  private apiUrl = `${environment.apiUrl}ia`;

  constructor(private http: HttpClient) {}

  // 1. Obtener recomendaciones de productos
  getRecomendaciones(rutCliente: string, limite: number = 3): Observable<RecomendacionesResponse> {
    return this.http.post<RecomendacionesResponse>(
      `${this.apiUrl}/productos/recomendar/`,
      { rut_cliente: rutCliente, limite }
    );
  }

  // 2. Generar descripción de producto (requiere auth)
  generarDescripcion(productoId: number): Observable<DescripcionProducto> {
    return this.http.post<DescripcionProducto>(
      `${this.apiUrl}/productos/${productoId}/generar-descripcion/`,
      {}
    );
  }

  // 3. Enviar mensaje al chatbot
  enviarMensajeChatbot(mensaje: string, contexto?: any): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.apiUrl}/chat/`,
      { mensaje, contexto }
    );
  }

  // 4. Obtener estadísticas de IA (NUEVO)
  getEstadisticasIA(): Observable<StatsIA> {
    return this.http.get<StatsIA>(`${this.apiUrl}/stats/`);
  }
}
