import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from './api.config';

const API_URL = `${API_BASE_URL}/auth`;
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

export interface RegistrationResponse {
  requestId: number;
  fullName: string;
  email: string;
  mobile?: string;
  status: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  phoneNumber: string;
  alternateContactNumber: string;
  currentAddress: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  residenceType: string;
  occupation: string;
  companyName: string;
  socialMediaProfile: string;
  photo: File;
  drivingLicense: File;
  electricityBill?: File;
  rentAgreement?: File;
  companyBonafideLetter?: File;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest extends ForgotPasswordRequest {
  code: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
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

  register(request: RegisterRequest): Observable<RegistrationResponse> {
    const formData = new FormData();
    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    return this.http.post<RegistrationResponse>(`${API_URL}/register`, formData);
  }

  requestPasswordReset(request: ForgotPasswordRequest): Observable<string> {
    return this.http.post(`${API_URL}/forgot-password`, request, { responseType: 'text' });
  }

  resetPassword(request: ResetPasswordRequest): Observable<string> {
    return this.http.post(`${API_URL}/reset-password`, request, { responseType: 'text' });
  }

  changePassword(request: ChangePasswordRequest): Observable<string> {
    const token = this.getToken();
    const options = token ? { headers: { Authorization: `Bearer ${token}` }, responseType: 'text' as const } : { responseType: 'text' as const };
    return this.http.post(`${API_URL}/change-password`, request, options);
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

  hasRole(role: string): boolean {
    return this.currentUser()?.roles.includes(role) ?? false;
  }

  isStaff(): boolean {
    return ['MANAGER', 'INVENTORY_STAFF', 'CONTENT_EDITOR'].some((role) => this.hasRole(role));
  }

  defaultDashboardUrl(): string {
    const roles = this.currentUser()?.roles ?? [];
    if (roles.includes('ADMIN')) {
      return '/admin';
    }
    if (roles.includes('MANAGER')) {
      return '/manager-dashboard';
    }
    if (roles.includes('INVENTORY_STAFF')) {
      return '/inventory-dashboard';
    }
    if (roles.includes('CONTENT_EDITOR')) {
      return '/content-dashboard';
    }
    return '/dashboard';
  }

  getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      if (error.error && typeof error.error === 'object' && 'message' in error.error) {
        if ('errors' in error.error && error.error.errors && typeof error.error.errors === 'object') {
          const messages = Object.values(error.error.errors);
          const firstMessage = messages.find((message) => typeof message === 'string' && message.trim());
          if (firstMessage) {
            return String(firstMessage);
          }
        }

        return String(error.error.message);
      }

      if (error.status === 0) {
        return 'Unable to reach the backend. Please try again in a moment.';
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
