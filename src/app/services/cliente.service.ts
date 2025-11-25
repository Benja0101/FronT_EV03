import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Cliente {
  rut: string;
  nombre: string;
  apellido: string;
  email?: string;
  comuna: string;
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
export class ClienteService {
  private apiUrl = 'http://127.0.0.1:8000/clientes/api/clientes/';

  constructor(private http: HttpClient) {}

  getClientes(page: number = 1): Observable<PaginatedResponse<Cliente>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResponse<Cliente>>(this.apiUrl, { params });
  }

  getAllClientes(): Observable<PaginatedResponse<Cliente>> {
    const params = new HttpParams().set('page_size', '1000');
    return this.http.get<PaginatedResponse<Cliente>>(this.apiUrl, { params });
  }

  getCliente(rut: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}${rut}/`);
  }

  createCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  updateCliente(rut: string, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}${rut}/`, cliente);
  }

  patchCliente(rut: string, cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.apiUrl}${rut}/`, cliente);
  }

  deleteCliente(rut: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${rut}/`);
  }
}
