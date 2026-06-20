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
  firstName?: string;
  lastName?: string;
  email: string;
  mobile?: string;
  gender?: string;
  dob?: string;
  alternateContactNumber?: string;
  currentAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  residenceType?: string;
  occupation?: string;
  companyName?: string;
  socialMediaProfile?: string;
  status: string;
  documents: RegistrationDocumentResponse[];
}

export interface RegistrationDocumentResponse {
  type: string;
  label: string;
  fileName: string;
}

export interface AdminProductRequest {
  name: string;
  brand: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  specs: string;
  dailyPrice: number;
  weeklyPrice: number;
  availabilityStatus: string;
  images: string[];
}

export interface AdminProductResponse {
  id: number;
  name: string;
  brand: string;
  category: string;
  shortDescription?: string;
  fullDescription?: string;
  specs?: string;
  dailyPrice: number;
  weeklyPrice: number;
  availabilityStatus: string;
  images: string[];
}

export interface AdminBookingResponse {
  id: number;
  bookingNumber: string;
  customer: string;
  phone?: string;
  products: string[];
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus: string;
  returnStatus: string;
  total: number;
  notes: string[];
}

export interface AdminCustomerResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  verified: boolean;
  blocked: boolean;
  city?: string;
  wishlist: number;
  activeBookings: number;
  pastBookings: number;
}

export interface AdminPaymentResponse {
  id: number;
  bookingId: string;
  customer: string;
  gateway: 'Razorpay' | 'PayU';
  mode: string;
  status: string;
  amount: number;
  paidAt: string;
}

export interface AdminContentResponse {
  blogPosts: Array<{
    id: number;
    title: string;
    category?: string;
    author?: string;
    status: string;
    publishDate?: string;
    seoTitle?: string;
    metaDescription?: string;
  }>;
  staticContent: Array<{
    key: string;
    title: string;
    updatedAt: string;
    status: string;
  }>;
}

export interface AdminSettingsResponse {
  gateway: string;
  paymentPolicy: string;
  depositPercent: number;
  gstPercent: number;
  notificationEmail: string;
  whatsappNumber: string;
  recaptchaKey: string;
  analyticsId: string;
}

export interface CategoryReportResponse {
  name: string;
  value: number;
}

export interface RolePermissionResponse {
  module: string;
  superAdmin: string;
  manager: string;
  inventory: string;
  content: string;
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

  getInventory(): Observable<AdminProductResponse[]> {
    return this.http.get<AdminProductResponse[]>(`${API_URL}/inventory`, {
      headers: this.authHeaders()
    });
  }

  createProduct(request: AdminProductRequest): Observable<AdminProductResponse> {
    return this.http.post<AdminProductResponse>(`${API_URL}/inventory`, request, {
      headers: this.authHeaders()
    });
  }

  updateProduct(productId: number, request: AdminProductRequest): Observable<AdminProductResponse> {
    return this.http.put<AdminProductResponse>(`${API_URL}/inventory/${productId}`, request, {
      headers: this.authHeaders()
    });
  }

  markProductMaintenance(productId: number): Observable<AdminProductResponse> {
    return this.http.patch<AdminProductResponse>(`${API_URL}/inventory/${productId}/maintenance`, null, {
      headers: this.authHeaders()
    });
  }

  getBookings(): Observable<AdminBookingResponse[]> {
    return this.http.get<AdminBookingResponse[]>(`${API_URL}/bookings`, {
      headers: this.authHeaders()
    });
  }

  updateBookingStatus(bookingId: number, status: string): Observable<AdminBookingResponse> {
    return this.http.patch<AdminBookingResponse>(`${API_URL}/bookings/${bookingId}/status`, { status }, {
      headers: this.authHeaders()
    });
  }

  addBookingNote(bookingId: number, note: string): Observable<AdminBookingResponse> {
    return this.http.post<AdminBookingResponse>(`${API_URL}/bookings/${bookingId}/notes`, { note }, {
      headers: this.authHeaders()
    });
  }

  getCustomers(): Observable<AdminCustomerResponse[]> {
    return this.http.get<AdminCustomerResponse[]>(`${API_URL}/customers`, {
      headers: this.authHeaders()
    });
  }

  setCustomerBlocked(customerId: number, blocked: boolean): Observable<AdminCustomerResponse> {
    return this.http.patch<AdminCustomerResponse>(`${API_URL}/customers/${customerId}/blocked`, { blocked }, {
      headers: this.authHeaders()
    });
  }

  getPayments(): Observable<AdminPaymentResponse[]> {
    return this.http.get<AdminPaymentResponse[]>(`${API_URL}/payments`, {
      headers: this.authHeaders()
    });
  }

  refundPayment(paymentId: number, amount: number, reason: string): Observable<AdminPaymentResponse> {
    return this.http.post<AdminPaymentResponse>(`${API_URL}/payments/${paymentId}/refunds`, { amount, reason }, {
      headers: this.authHeaders()
    });
  }

  getContent(): Observable<AdminContentResponse> {
    return this.http.get<AdminContentResponse>(`${API_URL}/content`, {
      headers: this.authHeaders()
    });
  }

  getCategoryReports(): Observable<CategoryReportResponse[]> {
    return this.http.get<CategoryReportResponse[]>(`${API_URL}/reports/categories`, {
      headers: this.authHeaders()
    });
  }

  getRolePermissions(): Observable<RolePermissionResponse[]> {
    return this.http.get<RolePermissionResponse[]>(`${API_URL}/roles/permissions`, {
      headers: this.authHeaders()
    });
  }

  getSettings(): Observable<AdminSettingsResponse> {
    return this.http.get<AdminSettingsResponse>(`${API_URL}/settings`, {
      headers: this.authHeaders()
    });
  }

  saveSettings(request: AdminSettingsResponse): Observable<AdminSettingsResponse> {
    return this.http.put<AdminSettingsResponse>(`${API_URL}/settings`, request, {
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

  getPendingCustomerDocument(requestId: number, documentType: string): Observable<Blob> {
    return this.http.get(`${API_URL}/customers/${requestId}/documents/${documentType}`, {
      headers: this.authHeaders(),
      responseType: 'blob'
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
