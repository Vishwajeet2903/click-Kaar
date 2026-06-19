import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Booking } from '../models/product.model';
import { AuthService } from './auth.service';

const API_URL = 'http://localhost:8080/api/bookings';

export interface BookingItemRequest {
  productId: number;
}

export interface BookingRequest {
  customerId: number;
  rentalStartDate: string;
  rentalEndDate: string;
  items: BookingItemRequest[];
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

  getBookings(): Observable<Booking[]> {
    return of([
      { id: 'CK-2048', productName: 'Canon EOS R5 Cinema Kit', dateRange: 'Jun 3 - Jun 7, 2026', status: 'Active', total: 19824 },
      { id: 'CK-1981', productName: 'Aputure LS 600D Pro', dateRange: 'May 10 - May 12, 2026', status: 'Past', total: 7670 },
      { id: 'CK-2077', productName: 'DJI RS 4 Pro Gimbal', dateRange: 'Jun 12 - Jun 15, 2026', status: 'Upcoming', total: 8496 }
    ]);
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
