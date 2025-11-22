import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Venta {
  numero: string;
  fecha: string;
  rut_cliente: string;
  total: number;
}

export interface DetalleVenta {
  venta: string;
  producto: string;
  cantidad: number;
  precio_unitario: number;
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
  private apiUrl = `${environment.apiUrl}ventas/`;
  private detalleUrl = `${environment.apiUrl}detalle-ventas/`;

  constructor(private http: HttpClient) {}

  // Ventas
  getVentas(page: number = 1): Observable<PaginatedResponse<Venta>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResponse<Venta>>(this.apiUrl, { params });
  }

  getAllVentas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.apiUrl);
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

  createDetalleVenta(detalle: DetalleVenta): Observable<DetalleVenta> {
    return this.http.post<DetalleVenta>(this.detalleUrl, detalle);
  }
}
