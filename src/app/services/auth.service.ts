import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🔧 AuthService inicializado');
    console.log('🌐 HttpClient disponible:', !!this.http);
    console.log('🔗 API URL configurada:', this.apiUrl);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    console.log('🔵 Intentando login a:', `${this.apiUrl}token/`);
    console.log('📝 Credenciales:', credentials);
    
    return this.http.post<TokenResponse>(`${this.apiUrl}token/`, credentials)
      .pipe(
        tap(response => {
          console.log('✅ Respuesta del servidor:', response);
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          this.isAuthenticatedSubject.next(true);
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
    this.isAuthenticatedSubject.next(false);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }
}
