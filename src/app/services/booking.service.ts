import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Booking } from '../models/product.model';
import { AuthService } from './auth.service';
import { API_BASE_URL } from './api.config';

const API_URL = `${API_BASE_URL}/bookings`;
const DASHBOARD_API_URL = `${API_BASE_URL}/dashboard`;

export interface BookingItemRequest {
  productId: number;
}

export interface BookingRequest {
  customerId: number;
  rentalStartDate: string;
  rentalEndDate: string;
  items: BookingItemRequest[];
  paymentMethod?: 'cash' | 'razorpay';
  couponCode?: string;
}

export interface BookingResponse {
  id: number;
  bookingNumber: string;
  customerId: number;
  rentalStartDate: string;
  rentalEndDate: string;
  rentalDays: number;
  totalAmount: number;
  status: string;
  products: string[];
}

export interface AvailabilityResponse {
  available: boolean;
  message: string;
}

export interface BlockedDateRangeResponse {
  startDate: string;
  endDate: string;
}

export interface CouponPreviewResponse {
  code: string;
  discountPercent: number;
}

export interface CustomerDashboardResponse {
  profile: CustomerDashboardProfile;
  summary: CustomerDashboardSummary;
  bookings: CustomerDashboardBooking[];
  payments: CustomerDashboardPayment[];
}

export interface CustomerDashboardProfile {
  id: number;
  customerNumber: string;
  fullName: string;
  email: string;
  mobile?: string;
  mobileVerified: boolean;
  city?: string;
  roles: string[];
}

export interface CustomerDashboardSummary {
  activeBookings: number;
  pastBookings: number;
  upcomingReturns: number;
  wishlistCount: number;
  totalSpent: number;
  pendingPayments: number;
}

export interface CustomerDashboardBooking {
  id: number;
  bookingNumber: string;
  products: string[];
  productName: string;
  startDate: string;
  endDate: string;
  dateRange: string;
  rentalDays: number;
  status: string;
  group: 'Active' | 'Past' | 'Upcoming';
  returnStatus: string;
  total: number;
}

export interface CustomerDashboardPayment {
  id: number;
  paymentNumber: string;
  bookingNumber: string;
  type: string;
  status: string;
  amount: number;
  paidAt: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  createBooking(request: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(API_URL, request, {
      headers: this.authHeaders()
    });
  }

  checkAvailability(productId: number, startDate: string, endDate: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(`${API_URL}/availability`, {
      params: { productId, startDate, endDate }
    });
  }

  getBlockedRanges(productId: number): Observable<BlockedDateRangeResponse[]> {
    return this.http.get<BlockedDateRangeResponse[]>(`${API_URL}/products/${productId}/blocked-ranges`);
  }

  previewCoupon(couponCode: string): Observable<CouponPreviewResponse> {
    return this.http.get<CouponPreviewResponse>(`${API_URL}/coupons/${encodeURIComponent(couponCode)}`, {
      headers: this.authHeaders()
    });
  }

  cancelPendingBooking(bookingId: number): Observable<BookingResponse> {
    return this.http.patch<BookingResponse>(`${API_URL}/${bookingId}/cancel-pending`, {}, {
      headers: this.authHeaders()
    });
  }

  getBookings(): Observable<Booking[]> {
    return this.getCustomerDashboard().pipe(
      map((dashboard) => dashboard.bookings.map((booking) => ({
        id: booking.bookingNumber,
        productName: booking.productName,
        dateRange: booking.dateRange,
        status: booking.group,
        total: booking.total
      })))
    );
  }

  getCustomerDashboard(): Observable<CustomerDashboardResponse> {
    return this.http.get<CustomerDashboardResponse>(`${DASHBOARD_API_URL}/customer`, {
      headers: this.authHeaders()
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
