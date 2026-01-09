import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ClienteLoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface ClienteTokenResponse {
  token: string;
  cliente: {
    rut: string;
    nombre: string;
    apellido: string;
    email: string;
    comuna: string;
    direccion?: string;
    telefono?: string;
  };
}

export type UserType = 'admin' | 'cliente' | null;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  private userTypeSubject = new BehaviorSubject<UserType>(this.getUserType());

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public userType$ = this.userTypeSubject.asObservable();

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token') || !!localStorage.getItem('cliente_token');
  }

  private getUserType(): UserType {
    if (localStorage.getItem('access_token')) return 'admin';
    if (localStorage.getItem('cliente_token')) return 'cliente';
    return null;
  }

  // Login para administradores
  login(credentials: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}token/`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          localStorage.setItem('user_type', 'admin');
          this.isAuthenticatedSubject.next(true);
          this.userTypeSubject.next('admin');
        })
      );
  }

  // Login para clientes
  loginCliente(credentials: ClienteLoginRequest): Observable<ClienteTokenResponse> {
    return this.http.post<ClienteTokenResponse>(
      'https://heroic-transformation-production.up.railway.app/clientes/api/clientes/login/',
      credentials
    ).pipe(
      tap(response => {
        localStorage.setItem('cliente_token', response.token);
        localStorage.setItem('cliente_data', JSON.stringify(response.cliente));
        localStorage.setItem('cliente_rut', response.cliente.rut);
        localStorage.setItem('user_type', 'cliente');
        this.isAuthenticatedSubject.next(true);
        this.userTypeSubject.next('cliente');
      })
    );
  }

  refreshToken(): Observable<{ access: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<{ access: string }>(`${this.apiUrl}token/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('cliente_token');
    localStorage.removeItem('cliente_data');
    localStorage.removeItem('cliente_rut');
    localStorage.removeItem('user_type');
    this.isAuthenticatedSubject.next(false);
    this.userTypeSubject.next(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  getCurrentUserType(): UserType {
    return this.getUserType();
  }

  isAdmin(): boolean {
    return this.getUserType() === 'admin';
  }

  isCliente(): boolean {
    return this.getUserType() === 'cliente';
  }

  getClienteData() {
    const data = localStorage.getItem('cliente_data');
    return data ? JSON.parse(data) : null;
  }

  getClienteToken(): string | null {
    return localStorage.getItem('cliente_token');
  }
}
