import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ClienteEnVenta {
  rut: string;
  nombre: string;
  apellido: string;
  email?: string;
  comuna: string;
}

export interface Venta {
  numero: string;
  fecha: string;
  rut_cliente: ClienteEnVenta | string; // Puede ser objeto anidado o solo el RUT
  total: number;
}

export interface ProductoEnDetalle {
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
}

export interface DetalleVenta {
  venta: string;
  producto: ProductoEnDetalle | string; // Puede ser objeto anidado o solo el código
  cantidad: number;
  precio_unitario: number;
  subtotal?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private apiUrl = `${environment.apiUrl}venta/`;
  private detalleUrl = `${environment.apiUrl}detalleVenta/`;

  constructor(private http: HttpClient) {}

  // Ventas
  getVentas(page: number = 1): Observable<PaginatedResponse<Venta>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResponse<Venta>>(this.apiUrl, { params });
  }

  getAllVentas(): Observable<PaginatedResponse<Venta>> {
    const params = new HttpParams().set('page_size', '1000');
    return this.http.get<PaginatedResponse<Venta>>(this.apiUrl, { params });
  }

  getVenta(numero: string): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}${numero}/`);
  }

  createVenta(venta: Venta): Observable<Venta> {
    return this.http.post<Venta>(this.apiUrl, venta);
  }

  updateVenta(numero: string, venta: Venta): Observable<Venta> {
    return this.http.put<Venta>(`${this.apiUrl}${numero}/`, venta);
  }

  deleteVenta(numero: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${numero}/`);
  }

  // Detalles de Venta
  getDetallesVenta(page: number = 1): Observable<PaginatedResponse<DetalleVenta>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResponse<DetalleVenta>>(this.detalleUrl, { params });
  }

  getDetallesDeVenta(numeroVenta: string): Observable<PaginatedResponse<DetalleVenta>> {
    // Filtrar por número de venta específico
    const params = new HttpParams()
      .set('venta', numeroVenta)
      .set('page_size', '1000');
    console.log('🔍 Consultando detalles con URL:', this.detalleUrl);
    console.log('🔍 Parámetros:', params.toString());
    return this.http.get<PaginatedResponse<DetalleVenta>>(this.detalleUrl, { params });
  }

  createDetalleVenta(detalle: DetalleVenta): Observable<DetalleVenta> {
    return this.http.post<DetalleVenta>(this.detalleUrl, detalle);
  }
}
