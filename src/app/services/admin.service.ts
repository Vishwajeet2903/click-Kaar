import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API_URL = 'http://localhost:8080/api/admin';

export interface EmployeeRequest {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
}

export interface EmployeeResponse {
  userId: number;
  fullName: string;
  email: string;
  mobile: string;
  roles: string[];
}

export interface CustomerVerificationResponse {
  requestId: number;
  fullName: string;
  email: string;
  mobile?: string;
  city?: string;
  state?: string;
  occupation?: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  createEmployee(request: EmployeeRequest): Observable<EmployeeResponse> {
    return this.http.post<EmployeeResponse>(`${API_URL}/employees`, request, {
      headers: this.authHeaders()
    });
  }

  getPendingCustomers(): Observable<CustomerVerificationResponse[]> {
    return this.http.get<CustomerVerificationResponse[]>(`${API_URL}/customers/pending`, {
      headers: this.authHeaders()
    });
  }

  verifyCustomer(requestId: number): Observable<CustomerVerificationResponse> {
    return this.http.patch<CustomerVerificationResponse>(`${API_URL}/customers/${requestId}/verify`, null, {
      headers: this.authHeaders()
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
