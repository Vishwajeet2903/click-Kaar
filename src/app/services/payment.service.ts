import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { API_BASE_URL } from './api.config';

const API_URL = `${API_BASE_URL}/payments`;

export interface CreatePaymentOrderRequest {
  bookingId: number;
  amount: number;
  type: 'FULL_PAYMENT' | 'SECURITY_DEPOSIT';
}

export interface PaymentOrderResponse {
  paymentId: number;
  paymentNumber: string;
  razorpayKeyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  createOrder(request: CreatePaymentOrderRequest): Observable<PaymentOrderResponse> {
    return this.http.post<PaymentOrderResponse>(`${API_URL}/orders`, request, {
      headers: this.authHeaders()
    });
  }

  verifyPayment(request: VerifyPaymentRequest): Observable<PaymentOrderResponse> {
    return this.http.post<PaymentOrderResponse>(`${API_URL}/verify`, request, {
      headers: this.authHeaders()
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
