import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Cliente {
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  comuna: string;
  direccion?: string;
  telefono?: string;
  password?: string;
  is_active?: boolean;
  fecha_registro?: string;
}

export interface ClienteLoginRequest {
  email: string;
  password: string;
}

export interface ClienteRegisterRequest {
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  comuna: string;
  direccion?: string;
  telefono?: string;
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
  private apiUrl = 'https://heroic-transformation-production.up.railway.app/clientes/api/clientes/';

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

  // Métodos de autenticación de clientes
  loginCliente(credentials: ClienteLoginRequest): Observable<{ token: string; cliente: Cliente }> {
    return this.http.post<{ token: string; cliente: Cliente }>(`${this.apiUrl}login/`, credentials);
  }

  registerCliente(data: ClienteRegisterRequest): Observable<{ cliente: Cliente; token: string }> {
    return this.http.post<{ cliente: Cliente; token: string }>(`${this.apiUrl}register/`, data);
  }

  getClienteByEmail(email: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}by-email/${email}/`);
  }

  getPerfilActual(): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}perfil/`);
  }

  updatePerfil(data: Partial<Cliente>): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.apiUrl}perfil/`, data);
  }

  cambiarPassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}cambiar-password/`, {
      current_password: currentPassword,
      new_password: newPassword
    });
  }
}
