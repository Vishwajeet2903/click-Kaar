import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';
import { API_BASE_URL } from './api.config';

const API_URL = API_BASE_URL + '/admin';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export interface EmployeeRequest {
  fullName: string;
  email: string;
  mobile: string;
  role: string;
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
  warrantyDate?: string;
  invoiceUrl?: string;
  imageLink?: string;
  link1?: string;
  link2?: string;
  stock: number;
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
  warrantyDate?: string;
  invoiceUrl?: string;
  imageLink?: string;
  link1?: string;
  link2?: string;
  stock?: number;
  availabilityStatus: string;
  images: string[];
}

export interface ProductImportResponse {
  importedCount: number;
  skippedCount: number;
  errors: string[];
  products: AdminProductResponse[];
}

export interface AdminKitRequest {
  name: string;
  description: string;
  imageUrl: string;
  rent: number;
  productIds: number[];
  active: boolean;
}

export interface AdminKitProductResponse {
  id: number;
  name: string;
  brand: string;
  category: string;
  dailyPrice: number;
}

export interface AdminKitResponse {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  rent: number;
  active: boolean;
  products: AdminKitProductResponse[];
  createdAt: string;
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
  deliveryOtpVerified: boolean;
}

export interface AdminCustomerResponse {
  id: number;
  customerNumber: string;
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

export interface AdminCustomerDetailResponse extends AdminCustomerResponse {
  firstName?: string;
  lastName?: string;
  gender?: string;
  dob?: string;
  alternateContactNumber?: string;
  currentAddress?: string;
  state?: string;
  pincode?: string;
  country?: string;
  residenceType?: string;
  occupation?: string;
  companyName?: string;
  socialMediaProfile?: string;
  documents: RegistrationDocumentResponse[];
}

export interface AdminPaymentResponse {
  id: number;
  paymentNumber: string;
  bookingId: string;
  customer: string;
  gateway: 'Razorpay' | 'PayU';
  mode: string;
  status: string;
  amount: number;
  paidAt: string;
  remark?: string;
  remarkChangeCount: number;
}

export interface PaymentRemarkLogResponse {
  id: number;
  oldRemark?: string;
  newRemark?: string;
  changedBy?: string;
  changedAt: string;
}

export interface AdminContentResponse {
  blogPosts: Array<{
    id: number;
    title: string;
    slug?: string;
    coverImage?: string;
    category?: string;
    author?: string;
    status: string;
    publishDate?: string;
    tags?: string;
    seoTitle?: string;
    metaDescription?: string;
    seoKeywords?: string;
    content?: string;
  }>;
  staticContent: Array<{
    key: string;
    title: string;
    updatedAt: string;
    status: string;
  }>;
}

export interface AdminBlogPostRequest {
  title: string;
  slug: string;
  coverImage: string;
  authorName: string;
  publishDate: string;
  category: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface AdminBlogPostResponse {
  id: number;
  title: string;
  slug: string;
  coverImage?: string;
  authorName?: string;
  publishDate?: string;
  category?: string;
  tags?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  content?: string;
  status: string;
}

export interface ImageUploadResponse {
  imageUrl: string;
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

export interface AdminCouponRequest {
  code: string;
  discountPercent: number;
  active: boolean;
  usageLimit?: number | null;
  validUntil?: string | null;
}

export interface AdminCouponResponse {
  id: number;
  code: string;
  discountPercent: number;
  active: boolean;
  usageLimit?: number | null;
  usedCount: number;
  validUntil?: string | null;
  createdAt: string;
}

export interface AdminReviewResponse {
  id: number;
  name: string;
  role: string;
  rating: number;
  quote: string;
  adminReply?: string | null;
  avatar?: string | null;
  createdAt: string;
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

  getEmployees(): Observable<EmployeeResponse[]> {
    return this.http.get<EmployeeResponse[]>(`${API_URL}/employees`, {
      headers: this.authHeaders()
    });
  }

  deleteEmployee(employeeId: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/employees/${employeeId}`, {
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

  createProductWithImage(request: AdminProductRequest, image: File): Observable<AdminProductResponse> {
    return this.http.post<AdminProductResponse>(`${API_URL}/inventory/save`, this.productFormData(request, image), {
      headers: this.authHeaders()
    });
  }

  importProducts(file: File): Observable<ProductImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ProductImportResponse>(`${API_URL}/inventory/import`, formData, {
      headers: this.authHeaders()
    });
  }

  updateProduct(productId: number, request: AdminProductRequest): Observable<AdminProductResponse> {
    return this.http.put<AdminProductResponse>(`${API_URL}/inventory/${productId}`, request, {
      headers: this.authHeaders()
    });
  }

  updateProductWithImage(productId: number, request: AdminProductRequest, image?: File): Observable<AdminProductResponse> {
    return this.http.put<AdminProductResponse>(`${API_URL}/inventory/${productId}/save`, this.productFormData(request, image), {
      headers: this.authHeaders()
    });
  }

  markProductMaintenance(productId: number): Observable<AdminProductResponse> {
    return this.http.patch<AdminProductResponse>(`${API_URL}/inventory/${productId}/maintenance`, null, {
      headers: this.authHeaders()
    });
  }

  markProductAvailable(productId: number): Observable<AdminProductResponse> {
    return this.http.patch<AdminProductResponse>(`${API_URL}/inventory/${productId}/available`, null, {
      headers: this.authHeaders()
    });
  }

  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/inventory/${productId}`, {
      headers: this.authHeaders()
    });
  }

  getBookings(): Observable<AdminBookingResponse[]> {
    return this.http.get<AdminBookingResponse[]>(`${API_URL}/bookings`, {
      headers: this.authHeaders()
    });
  }


  verifyDeliveryOtp(bookingId: number, otp: string): Observable<AdminBookingResponse> {
    return this.http.post<AdminBookingResponse>(`${API_URL}/bookings/${bookingId}/delivery-otp/verify`, { otp }, {
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

  getCustomerDetails(customerId: number): Observable<AdminCustomerDetailResponse> {
    return this.http.get<AdminCustomerDetailResponse>(`${API_URL}/customers/${customerId}/details`, {
      headers: this.authHeaders()
    });
  }

  setCustomerBlocked(customerId: number, blocked: boolean): Observable<AdminCustomerResponse> {
    return this.http.patch<AdminCustomerResponse>(`${API_URL}/customers/${customerId}/blocked`, { blocked }, {
      headers: this.authHeaders()
    });
  }

  deleteCustomer(customerId: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/customers/${customerId}`, {
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

  updatePaymentRemark(paymentId: number, remark: string): Observable<AdminPaymentResponse> {
    return this.http.patch<AdminPaymentResponse>(`${API_URL}/payments/${paymentId}/remark`, { remark }, {
      headers: this.authHeaders()
    });
  }

  getPaymentRemarkLogs(paymentId: number): Observable<PaymentRemarkLogResponse[]> {
    return this.http.get<PaymentRemarkLogResponse[]>(`${API_URL}/payments/${paymentId}/remark/logs`, {
      headers: this.authHeaders()
    });
  }

  getContent(): Observable<AdminContentResponse> {
    return this.http.get<AdminContentResponse>(`${API_URL}/content`, {
      headers: this.authHeaders()
    });
  }

  getKits(): Observable<AdminKitResponse[]> {
    return this.http.get<AdminKitResponse[]>(`${API_URL}/kits`, {
      headers: this.authHeaders()
    });
  }

  createKit(request: AdminKitRequest): Observable<AdminKitResponse> {
    return this.http.post<AdminKitResponse>(`${API_URL}/kits`, request, {
      headers: this.authHeaders()
    });
  }

  createKitWithImage(request: AdminKitRequest, image: File): Observable<AdminKitResponse> {
    return this.http.post<AdminKitResponse>(`${API_URL}/kits/save`, this.kitFormData(request, image), {
      headers: this.authHeaders()
    });
  }

  deleteKit(kitId: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/kits/${kitId}`, {
      headers: this.authHeaders()
    });
  }
  uploadImage(file: File): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<ImageUploadResponse>(`${API_URL}/images/upload`, formData, {
      headers: this.authHeaders()
    });
  }

  createBlogPost(request: AdminBlogPostRequest): Observable<AdminBlogPostResponse> {
    return this.http.post<AdminBlogPostResponse>(`${API_BASE_URL}/blog`, request, {
      headers: this.authHeaders()
    });
  }

  updateBlogPost(postId: number, request: AdminBlogPostRequest): Observable<AdminBlogPostResponse> {
    return this.http.put<AdminBlogPostResponse>(`${API_BASE_URL}/blog/${postId}`, request, {
      headers: this.authHeaders()
    });
  }

  deleteBlogPost(postId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/blog/${postId}`, {
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

  getCoupons(): Observable<AdminCouponResponse[]> {
    return this.http.get<AdminCouponResponse[]>(`${API_URL}/coupons`, {
      headers: this.authHeaders()
    });
  }

  createCoupon(request: AdminCouponRequest): Observable<AdminCouponResponse> {
    return this.http.post<AdminCouponResponse>(`${API_URL}/coupons`, request, {
      headers: this.authHeaders()
    });
  }

  deleteCoupon(couponId: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/coupons/${couponId}`, {
      headers: this.authHeaders()
    });
  }

  setCouponActive(couponId: number, active: boolean): Observable<AdminCouponResponse> {
    return this.http.patch<AdminCouponResponse>(`${API_URL}/coupons/${couponId}/active`, { active }, {
      headers: this.authHeaders()
    });
  }

  getReviews(): Observable<AdminReviewResponse[]> {
    return this.http.get<AdminReviewResponse[]>(`${API_BASE_URL}/content/reviews`);
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/content/reviews/${reviewId}`, {
      headers: this.authHeaders()
    });
  }

  replyToReview(reviewId: number, reply: string): Observable<AdminReviewResponse> {
    return this.http.patch<AdminReviewResponse>(`${API_URL}/reviews/${reviewId}/reply`, { reply }, {
      headers: this.authHeaders()
    });
  }

  getPendingCustomers(): Observable<CustomerVerificationResponse[]> {
    return this.http.get<CustomerVerificationResponse[]>(`${API_URL}/customers/pending`, {
      headers: this.authHeaders()
    });
  }

  deletePendingCustomer(requestId: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/customers/pending/${requestId}`, {
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

  getVerifiedCustomerDocument(customerId: number, documentType: string): Observable<Blob> {
    return this.http.get(`${API_URL}/customers/verified/${customerId}/documents/${documentType}`, {
      headers: this.authHeaders(),
      responseType: 'blob'
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private productFormData(request: AdminProductRequest, image?: File): FormData {
    const formData = new FormData();
    formData.append('product', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (image) {
      formData.append('image', image);
    }
    return formData;
  }
  private resolveKitImageUrl(kit: AdminKitResponse): AdminKitResponse {
    if (kit.imageUrl.startsWith('/uploads/')) {
      return { ...kit, imageUrl: `${API_ORIGIN}${kit.imageUrl}` };
    }
    return kit;
  }
  private kitFormData(request: AdminKitRequest, image: File): FormData {
    const formData = new FormData();
    formData.append('kit', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    formData.append('image', image);
    return formData;
  }
}

