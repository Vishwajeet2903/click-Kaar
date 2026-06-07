import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

const API_URL = 'http://localhost:8080/api/auth';
const SESSION_KEY = 'clickkaar_auth';

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  fullName: string;
  email: string;
  mobile?: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  fullName: string;
  mobile: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentUser = signal<AuthResponse | null>(this.readSession());

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/login`, request).pipe(
      tap((response) => this.saveSession(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/register`, request).pipe(
      tap((response) => this.saveSession(response))
    );
  }

  logout(): void {
    this.currentUser.set(null);
    if (this.canUseStorage()) {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  isAdmin(): boolean {
    return this.currentUser()?.roles.includes('ADMIN') ?? false;
  }

  getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      if (error.error && typeof error.error === 'object' && 'message' in error.error) {
        return String(error.error.message);
      }

      if (error.status === 0) {
        return 'Unable to reach the backend. Please make sure it is running on port 8080.';
      }
    }

    return 'Something went wrong. Please try again.';
  }

  private saveSession(response: AuthResponse): void {
    this.currentUser.set(response);
    if (this.canUseStorage()) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(response));
    }
  }

  private readSession(): AuthResponse | null {
    if (!this.canUseStorage()) {
      return null;
    }

    const value = localStorage.getItem(SESSION_KEY);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthResponse;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  private canUseStorage(): boolean {
    return isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined';
  }
}
