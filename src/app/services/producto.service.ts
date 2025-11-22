import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Producto {
  nombre: string;
  codigo: string;
  stock: number;
  precio: number;
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
export class ProductoService {
  private apiUrl = `${environment.apiUrl}productos/`;

  constructor(private http: HttpClient) {}

  getProductos(page: number = 1): Observable<PaginatedResponse<Producto>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResponse<Producto>>(this.apiUrl, { params });
  }

  getAllProductos(): Observable<PaginatedResponse<Producto>> {
    const params = new HttpParams().set('page_size', '1000');
    return this.http.get<PaginatedResponse<Producto>>(this.apiUrl, { params });
  }

  getProducto(codigo: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}${codigo}/`);
  }

  createProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto);
  }

  updateProducto(codigo: string, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}${codigo}/`, producto);
  }

  patchProducto(codigo: string, producto: Partial<Producto>): Observable<Producto> {
    return this.http.patch<Producto>(`${this.apiUrl}${codigo}/`, producto);
  }

  deleteProducto(codigo: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${codigo}/`);
  }
}
