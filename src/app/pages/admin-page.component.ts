import { CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Product } from '../models/product.model';
import {
  AdminBookingResponse,
  AdminContentResponse,
  AdminPaymentResponse,
  AdminProductRequest,
  AdminProductResponse,
  AdminService,
  CustomerVerificationResponse,
  EmployeeResponse,
  PaymentRemarkLogResponse,
  RegistrationDocumentResponse
} from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

type AdminTab = 'dashboard' | 'registrations' | 'inventory' | 'bookings' | 'customers' | 'payments' | 'content' | 'reports' | 'roles' | 'settings';
type BookingStatus = 'Upcoming' | 'Active' | 'Completed' | 'Cancelled' | 'Overdue';
type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';
type ProductStatus = 'Available' | 'Unavailable' | 'Maintenance';

interface AdminMetric {
  label: string;
  value: string;
  note: string;
  tone: 'dark' | 'orange' | 'green' | 'red';
}

interface AdminProduct extends Product {
  status: ProductStatus;
  maintenanceNote: string;
}

interface AdminBooking {
  backendId: number;
  id: string;
  customer: string;
  phone: string;
  products: string[];
  startDate: string;
  endDate: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  returnStatus: 'Not due' | 'Due today' | 'Returned' | 'Late';
  total: number;
  notes: string;
}

interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  verified: boolean;
  blocked: boolean;
  city: string;
  wishlist: number;
  activeBookings: number;
  pastBookings: number;
}

interface AdminPayment {
  backendId: number;
  id: string;
  bookingId: string;
  customer: string;
  gateway: 'Razorpay' | 'PayU';
  mode: 'Full payment' | 'Security deposit';
  status: PaymentStatus;
  amount: number;
  paidAt: string;
  remark: string;
  remarkChangeCount: number;
}

interface BlogPostAdmin {
  id: number;
  title: string;
  category: string;
  author: string;
  status: 'Draft' | 'Published';
  publishDate: string;
  seoTitle: string;
  metaDescription: string;
}

interface StaticContentItem {
  key: string;
  title: string;
  owner: string;
  status: 'Current' | 'Needs review';
  updatedAt: string;
}

interface RolePermission {
  module: string;
  superAdmin: string;
  manager: string;
  inventory: string;
  content: string;
}

interface DocumentPreview {
  label: string;
  fileName: string;
  url: string;
  isImage: boolean;
}

interface PaymentRemarkLogView {
  id: number;
  oldRemark: string;
  newRemark: string;
  changedBy: string;
  changedAt: string;
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, PercentPipe, FormsModule, ReactiveFormsModule, RouterLink, MatSnackBarModule, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Admin" />
    <section class="container admin-page">
      @if (authService.isAdmin()) {
        <div class="admin-layout">
          <aside class="admin-sidebar surface">
            <div>
              <p class="eyebrow">Admin panel</p>
              <h1>Clickkaar Ops</h1>
            </div>
            <nav aria-label="Admin sections">
              @for (tab of tabs; track tab.id) {
                <button type="button" [class.active]="activeTab() === tab.id" (click)="activeTab.set(tab.id)">
                  <span>{{ tab.label }}</span>
                  <small>{{ tab.count }}</small>
                </button>
              }
            </nav>
          </aside>

          <div class="admin-workspace">
            <header class="admin-topbar">
              <div>
                <p class="eyebrow">{{ activeTabLabel() }}</p>
                <h2>{{ activeTitle() }}</h2>
              </div>
              <div class="topbar-actions">
                <!-- <button type="button" class="ghost-btn" (click)="exportActive()">Export</button> -->
                <button type="button" class="primary-btn" (click)="openCreate()">Create</button>
                <button type="button" class="danger-btn topbar-logout" (click)="logout()">Logout</button>
              </div>
            </header>

            @switch (activeTab()) {
              @case ('dashboard') {
                <div class="metric-grid">
                  @for (metric of metrics(); track metric.label) {
                    <article class="surface metric-card" [class]="metric.tone">
                      <span>{{ metric.label }}</span>
                      <strong>{{ metric.value }}</strong>
                      <small>{{ metric.note }}</small>
                    </article>
                  }
                </div>

                <div class="split-grid">
                  <section class="surface panel">
                    <div class="panel-head">
                      <h3>Recent bookings</h3>
                      <button type="button" class="link-btn" (click)="activeTab.set('bookings')">View all</button>
                    </div>
                    <div class="dense-list">
                      @for (booking of bookings().slice(0, 5); track booking.id) {
                        <article>
                          <div>
                            <strong>{{ booking.id }}</strong>
                            <span>{{ booking.customer }} - {{ booking.products.join(', ') }}</span>
                          </div>
                          <b class="status" [class]="statusClass(booking.status)">{{ booking.status }}</b>
                        </article>
                      }
                    </div>
                  </section>

                  <section class="surface panel">
                    <div class="panel-head">
                      <h3>Pending registrations</h3>
                      <button type="button" class="link-btn" (click)="activeTab.set('registrations')">View requests</button>
                    </div>
                    @if (isLoadingPending) {
                      <p class="muted">Loading pending registrations...</p>
                    } @else if (pendingLoadError) {
                      <p class="error-text">{{ pendingLoadError }}</p>
                    } @else if (pendingCustomers.length) {
                      <div class="dense-list">
                        @for (customer of pendingCustomers; track customer.requestId) {
                          <article>
                            <div>
                              <strong>{{ customer.fullName }}</strong>
                              <span>{{ customer.email }}{{ customer.mobile ? ' - ' + customer.mobile : '' }}</span>
                            </div>
                            <button type="button" class="mini-btn" (click)="openPendingDetails(customer)">Open</button>
                          </article>
                        }
                      </div>
                    } @else {
                      <p class="muted">No customer registrations are waiting for approval.</p>
                    }
                  </section>
                </div>
              }

              @case ('registrations') {
                <div class="split-grid registration-grid">
                  <section class="surface panel">
                    <div class="panel-head">
                      <h3>Pending registration requests</h3>
                      <button type="button" class="link-btn" (click)="loadPendingCustomers()">Refresh</button>
                    </div>
                    @if (isLoadingPending) {
                      <p class="muted">Loading pending registrations...</p>
                    } @else if (pendingLoadError) {
                      <p class="error-text">{{ pendingLoadError }}</p> 
                    } @else if (pendingCustomers.length) {
                      <div class="dense-list request-list">
                        @for (customer of pendingPageItems(); track customer.requestId) {
                          <article [class.active]="selectedPendingCustomer?.requestId === customer.requestId">
                            <button type="button" class="request-summary" (click)="openPendingDetails(customer)">
                              <strong>{{ customer.fullName }}</strong>
                              <span>{{ customer.email }}{{ customer.mobile ? ' - ' + customer.mobile : '' }}</span>
                              <small>{{ customer.city || 'City not added' }}{{ customer.state ? ', ' + customer.state : '' }}</small>
                            </button>
                            <button type="button" class="mini-btn" (click)="openPendingDetails(customer)">View</button>
                          </article>
                        }
                      </div>
                      <div class="pagination-row">
                        <span>{{ pendingPageSummary() }}</span>
                        <div>
                          <button type="button" class="ghost-mini" [disabled]="pendingPage === 1" (click)="changePendingPage(-1)">Previous</button>
                          <button type="button" class="mini-btn" [disabled]="pendingPage === pendingPageCount()" (click)="changePendingPage(1)">Next</button>
                        </div>
                      </div>
                    } @else {
                      <p class="muted">No customer registrations are waiting for approval.</p>
                    }
                  </section>

                  <section class="surface panel registration-detail">
                    @if (selectedPendingCustomer) {
                      <div class="panel-head">
                        <div>
                          <h3>{{ selectedPendingCustomer.fullName }}</h3>
                          <span>{{ selectedPendingCustomer.status }}</span>
                        </div>
                        <span class="detail-page-count">Page {{ registrationDetailPage }} of 3</span>
                      </div>

                      <div class="detail-stepper" aria-label="Registration review pages">
                        <button type="button" [class.active]="registrationDetailPage === 1" (click)="setRegistrationDetailPage(1)">Personal</button>
                        <button type="button" [class.active]="registrationDetailPage === 2" (click)="setRegistrationDetailPage(2)">Address</button>
                        <button type="button" [class.active]="registrationDetailPage === 3" (click)="setRegistrationDetailPage(3)">Documents</button>
                      </div>

                      @if (registrationDetailPage === 1) {
                        <div class="detail-section">
                          <h4>Personal details</h4>
                          <dl class="detail-grid">
                            <div><dt>First name</dt><dd>{{ selectedPendingCustomer.firstName || '-' }}</dd></div>
                            <div><dt>Last name</dt><dd>{{ selectedPendingCustomer.lastName || '-' }}</dd></div>
                            <div><dt>Email</dt><dd>{{ selectedPendingCustomer.email }}</dd></div>
                            <div><dt>Mobile</dt><dd>{{ selectedPendingCustomer.mobile || '-' }}</dd></div>
                            <div><dt>Gender</dt><dd>{{ selectedPendingCustomer.gender || '-' }}</dd></div>
                            <div><dt>Date of birth</dt><dd>{{ selectedPendingCustomer.dob || '-' }}</dd></div>
                            <div><dt>Alternate contact</dt><dd>{{ selectedPendingCustomer.alternateContactNumber || '-' }}</dd></div>
                            <div><dt>Occupation</dt><dd>{{ selectedPendingCustomer.occupation || '-' }}</dd></div>
                          </dl>
                        </div>
                      }

                      @if (registrationDetailPage === 2) {
                        <div class="detail-section">
                          <h4>Address & work</h4>
                          <dl class="detail-grid">
                            <div><dt>Address</dt><dd>{{ selectedPendingCustomer.currentAddress || '-' }}</dd></div>
                            <div><dt>City</dt><dd>{{ selectedPendingCustomer.city || '-' }}</dd></div>
                            <div><dt>State</dt><dd>{{ selectedPendingCustomer.state || '-' }}</dd></div>
                            <div><dt>Pincode</dt><dd>{{ selectedPendingCustomer.pincode || '-' }}</dd></div>
                            <div><dt>Country</dt><dd>{{ selectedPendingCustomer.country || '-' }}</dd></div>
                            <div><dt>Residence type</dt><dd>{{ selectedPendingCustomer.residenceType || '-' }}</dd></div>
                            <div><dt>Company</dt><dd>{{ selectedPendingCustomer.companyName || '-' }}</dd></div>
                            <div><dt>Social profile</dt><dd>{{ selectedPendingCustomer.socialMediaProfile || '-' }}</dd></div>
                          </dl>
                        </div>
                      }

                      @if (registrationDetailPage === 3) {
                        <div class="detail-section">
                          <h4>Uploaded images</h4>
                          @if (documentPreviewError) {
                            <p class="error-text">{{ documentPreviewError }}</p>
                          }
                          @if (selectedPendingCustomer.documents.length) {
                            <div class="document-grid">
                              @for (document of selectedPendingCustomer.documents; track document.type) {
                                <article>
                                  <div class="document-frame">
                                    @if (documentPreviews[document.type]) {
                                      @if (documentPreviews[document.type].isImage) {
                                        <button type="button" class="document-preview-btn" (click)="openDocumentPreview(documentPreviews[document.type])">
                                          <img [src]="documentPreviews[document.type].url" [alt]="document.label">
                                        </button>
                                      } @else {
                                        <a [href]="documentPreviews[document.type].url" target="_blank" rel="noreferrer">Open file</a>
                                      }
                                    } @else {
                                      <span>{{ isLoadingDocuments ? 'Loading...' : 'Preview unavailable' }}</span>
                                    }
                                  </div>
                                  <strong>{{ document.label }}</strong>
                                  <span>{{ document.fileName }}</span>
                                </article>
                              }
                            </div>
                          } @else {
                            <p class="muted">No documents were uploaded with this request.</p>
                          }
                        </div>
                      }

                      <div class="detail-actions">
                        <button type="button" class="ghost-mini" [disabled]="registrationDetailPage === 1" (click)="changeRegistrationDetailPage(-1)">Previous</button>
                        @if (registrationDetailPage < 3) {
                          <button type="button" class="mini-btn" (click)="changeRegistrationDetailPage(1)">Next</button>
                        } @else {
                          <button type="button" class="primary-btn" [disabled]="verifyingRequestId === selectedPendingCustomer.requestId" (click)="verifyCustomer(selectedPendingCustomer)">
                            {{ verifyingRequestId === selectedPendingCustomer.requestId ? 'Granting...' : 'Grant login access' }}
                          </button>
                        }
                      </div>
                    } @else {
                      <div class="empty-detail">
                        <h3>Select a registration request</h3>
                        <p class="muted">Open a pending request to review the full details and uploaded images.</p>
                      </div>
                    }
                  </section>
                </div>
              }

              @case ('inventory') {
                <div class="tool-row inventory-filter-row">
                  <input class="search-input" placeholder="Search product, brand, category" [ngModel]="inventoryQuery()" (ngModelChange)="inventoryQuery.set($event); inventoryPage = 1">
                  <select [ngModel]="inventoryStatus()" (ngModelChange)="inventoryStatus.set($event); inventoryPage = 1">
                    <option value="">All statuses</option>
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div class="surface table-panel">
                  <table>
                    <thead>
                      <tr><th>Product</th><th>Category</th><th>Price</th><th>Warranty</th><th>Invoice</th><th>Stock</th><th>Status</th><th>Calendar</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      @for (product of pagedProducts(); track product.id) {
                        <tr>
                          <td>
                            <div class="product-cell">
                              <img [src]="product.image" [alt]="product.name">
                              <div><strong>{{ product.name }}</strong><span>{{ product.brand }}</span></div>
                            </div>
                          </td>
                          <td>{{ product.category }}</td>
                          <td>{{ product.dailyPrice | currency:'INR':'symbol':'1.0-0' }} / day</td>
                          <td>{{ product.warrantyDate ? (product.warrantyDate | date:'mediumDate') : '-' }}</td>
                          <td>
                            @if (product.invoiceUrl) {
                              <a class="table-link" [href]="product.invoiceUrl" target="_blank" rel="noreferrer">View invoice</a>
                            } @else {
                              <span class="muted">-</span>
                            }
                          </td>
                          <td>{{ product.stock }}</td>
                          <td><b class="status" [class]="statusClass(product.status)">{{ product.status }}</b></td>
                          <td><span class="calendar-strip">{{ bookedDays(product.name) }} booked days</span></td>
                          <td class="action-cell">
                            <button type="button" class="mini-btn" (click)="editProduct(product)">Edit</button>
                            <button type="button" class="danger-btn" (click)="markMaintenance(product)">Maintenance</button>
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="9" class="empty-cell">No inventory matches those filters.</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
                <div class="pagination-row">
                  <span>{{ pageSummary(filteredProducts().length, inventoryPage) }}</span>
                  <div>
                    <button type="button" class="ghost-mini" [disabled]="inventoryPage === 1" (click)="changePage('inventory', -1)">Previous</button>
                    <button type="button" class="mini-btn" [disabled]="inventoryPage === pageCount(filteredProducts().length)" (click)="changePage('inventory', 1)">Next</button>
                  </div>
                </div>
              }

              @case ('bookings') {
                <div class="tool-row booking-filter-row">
                  <input class="search-input" placeholder="Search booking, customer, product" [ngModel]="bookingQuery()" (ngModelChange)="bookingQuery.set($event); bookingsPage = 1">
                  <select [ngModel]="bookingStatusFilter()" (ngModelChange)="bookingStatusFilter.set($event); bookingsPage = 1">
                    <option value="">All booking statuses</option>
                    <option>Upcoming</option><option>Active</option><option>Completed</option><option>Cancelled</option><option>Overdue</option>
                  </select>
                  <select [ngModel]="paymentStatusFilter()" (ngModelChange)="paymentStatusFilter.set($event); bookingsPage = 1">
                    <option value="">All payment statuses</option>
                    <option>Paid</option><option>Pending</option><option>Failed</option><option>Refunded</option>
                  </select>
                  <input class="month-input" type="month" aria-label="Filter bookings by month" [ngModel]="bookingMonthFilter()" (ngModelChange)="bookingMonthFilter.set($event); bookingsPage = 1">
                  @if (bookingMonthFilter()) {
                    <button type="button" class="ghost-mini" (click)="bookingMonthFilter.set(''); bookingsPage = 1">Clear month</button>
                  }
                </div>
                <div class="surface table-panel">
                  <table>
                    <thead><tr><th>Booking</th><th>Rental window</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Return</th><th>Actions</th></tr></thead>
                    <tbody>
                      @for (booking of pagedBookings(); track booking.id) {
                        <tr>
                          <td><strong>{{ booking.id }}</strong><span>{{ booking.customer }} - {{ booking.phone }}</span></td>
                          <td>{{ booking.startDate | date:'mediumDate' }} - {{ booking.endDate | date:'mediumDate' }}</td>
                          <td>{{ booking.products.join(', ') }}</td>
                          <td>{{ booking.total | currency:'INR':'symbol':'1.0-0' }}</td>
                          <td><b class="status" [class]="statusClass(booking.status)">{{ booking.status }}</b></td>
                          <td><b class="status" [class]="statusClass(booking.paymentStatus)">{{ booking.paymentStatus }}</b></td>
                          <td>{{ booking.returnStatus }}</td>
                          <td class="action-cell">
                            <button type="button" class="mini-btn" (click)="advanceBooking(booking)">Advance</button>
                            <button type="button" class="ghost-mini" (click)="addNote(booking)">Note</button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                <div class="pagination-row">
                  <span>{{ pageSummary(filteredBookings().length, bookingsPage) }}</span>
                  <div>
                    <button type="button" class="ghost-mini" [disabled]="bookingsPage === 1" (click)="changePage('bookings', -1)">Previous</button>
                    <button type="button" class="mini-btn" [disabled]="bookingsPage === pageCount(filteredBookings().length)" (click)="changePage('bookings', 1)">Next</button>
                  </div>
                </div>
              }

              @case ('customers') {
                <div class="tool-row"><input class="search-input" placeholder="Search customer, email, city" [ngModel]="customerQuery()" (ngModelChange)="customerQuery.set($event); customersPage = 1"></div>
                <div class="card-grid">
                  @for (customer of pagedCustomers(); track customer.id) {
                    <article class="surface customer-card" [class.blocked]="customer.blocked">
                      <div class="avatar">{{ customer.name.charAt(0) }}</div>
                      <div>
                        <h3>{{ customer.name }}</h3>
                        <p>{{ customer.email }} - {{ customer.phone }}</p>
                        <span>{{ customer.city }} / {{ customer.verified ? 'OTP verified' : 'OTP pending' }}</span>
                      </div>
                      <dl>
                        <div><dt>Active</dt><dd>{{ customer.activeBookings }}</dd></div>
                        <div><dt>Past</dt><dd>{{ customer.pastBookings }}</dd></div>
                        <div><dt>Wishlist</dt><dd>{{ customer.wishlist }}</dd></div>
                      </dl>
                      <button type="button" [class.danger-btn]="!customer.blocked" [class.mini-btn]="customer.blocked" (click)="toggleCustomerBlock(customer)">
                        {{ customer.blocked ? 'Unblock customer' : 'Block customer' }}
                      </button>
                    </article>
                  }
                </div>
                <div class="pagination-row">
                  <span>{{ pageSummary(filteredCustomers().length, customersPage) }}</span>
                  <div>
                    <button type="button" class="ghost-mini" [disabled]="customersPage === 1" (click)="changePage('customers', -1)">Previous</button>
                    <button type="button" class="mini-btn" [disabled]="customersPage === pageCount(filteredCustomers().length)" (click)="changePage('customers', 1)">Next</button>
                  </div>
                </div>
              }

              @case ('payments') {
                <div class="surface table-panel">
                  <table>
                    <thead><tr><th>Transaction</th><th>Booking</th><th>Customer</th><th>Gateway</th><th>Policy</th><th>Amount</th><th>Status</th><th>Remark</th></tr></thead>
                    <tbody>
                      @for (payment of pagedPayments(); track payment.id) {
                        <tr>
                          <td><strong>{{ payment.id }}</strong><span>{{ payment.paidAt | date:'mediumDate' }}</span></td>
                          <td>{{ payment.bookingId }}</td>
                          <td>{{ payment.customer }}</td>
                          <td>{{ payment.gateway }}</td>
                          <td>{{ payment.mode }}</td>
                          <td>{{ payment.amount | currency:'INR':'symbol':'1.0-0' }}</td>
                          <td><b class="status" [class]="statusClass(payment.status)">{{ payment.status }}</b></td>
                          <td class="remark-cell">
                            <div class="remark-control">
                              <input
                                class="remark-input"
                                aria-label="Payment remark"
                                placeholder="Remark"
                                [ngModel]="payment.remark"
                                [disabled]="isSavingPaymentRemark(payment.backendId)"
                                (ngModelChange)="updatePaymentRemarkDraft(payment, $event)"
                                (keydown.enter)="$event.preventDefault(); savePaymentRemark(payment.backendId)">
                              <button type="button" class="mini-btn" [disabled]="isSavingPaymentRemark(payment.backendId)" (click)="savePaymentRemark(payment.backendId)">
                                {{ isSavingPaymentRemark(payment.backendId) ? 'Saving...' : 'Save' }}
                              </button>
                            </div>
                            <button type="button" class="remark-log-btn" [disabled]="payment.remarkChangeCount === 0" (click)="togglePaymentRemarkLog(payment)">
                              View exact log ({{ payment.remarkChangeCount }})
                            </button>
                          </td>
                        </tr>
                        @if (activeRemarkLogPayment?.backendId === payment.backendId) {
                          <tr class="remark-log-table-row">
                            <td colspan="8">
                              <div class="remark-log-inline">
                                <div class="remark-log-head">
                                  <p class="eyebrow">Payment remark log</p>
                                  <h3>{{ payment.bookingId }}</h3>
                                  <span>{{ payment.customer }} - {{ payment.remarkChangeCount }} changes</span>
                                </div>
                                @if (isLoadingPaymentRemarkLog) {
                                  <p class="muted">Loading exact remark log...</p>
                                } @else if (paymentRemarkLogError) {
                                  <p class="error-text">{{ paymentRemarkLogError }}</p>
                                } @else if (activePaymentRemarkLogs.length) {
                                  <div class="remark-log-list">
                                    @for (log of activePaymentRemarkLogs; track log.id) {
                                      <article>
                                        <div>
                                          <strong>{{ log.changedAt | date:'medium' }}</strong>
                                          <span>{{ log.changedBy || 'Admin' }}</span>
                                        </div>
                                        <dl>
                                          <div><dt>From</dt><dd>{{ log.oldRemark || '-' }}</dd></div>
                                          <div><dt>To</dt><dd>{{ log.newRemark || '-' }}</dd></div>
                                        </dl>
                                      </article>
                                    }
                                  </div>
                                } @else {
                                  <p class="muted">No saved remark changes were found.</p>
                                }
                              </div>
                            </td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
                <div class="pagination-row">
                  <span>{{ pageSummary(payments().length, paymentsPage) }}</span>
                  <div>
                    <button type="button" class="ghost-mini" [disabled]="paymentsPage === 1" (click)="changePage('payments', -1)">Previous</button>
                    <button type="button" class="mini-btn" [disabled]="paymentsPage === pageCount(payments().length)" (click)="changePage('payments', 1)">Next</button>
                  </div>
                </div>
              }

              @case ('content') {
                <div class="split-grid">
                  <section class="surface panel">
                    <div class="panel-head"><h3>Blog & SEO</h3><button type="button" class="mini-btn" (click)="publishDraft()">Publish draft</button></div>
                    <div class="dense-list">
                      @for (post of pagedBlogPosts(); track post.id) {
                        <article>
                          <div><strong>{{ post.title }}</strong><span>{{ post.category }} - {{ post.author }} - {{ post.publishDate | date:'mediumDate' }}</span></div>
                          <b class="status" [class]="statusClass(post.status)">{{ post.status }}</b>
                        </article>
                      }
                    </div>
                    <div class="pagination-row">
                      <span>{{ pageSummary(blogPosts().length, blogPage) }}</span>
                      <div>
                        <button type="button" class="ghost-mini" [disabled]="blogPage === 1" (click)="changePage('blog', -1)">Previous</button>
                        <button type="button" class="mini-btn" [disabled]="blogPage === pageCount(blogPosts().length)" (click)="changePage('blog', 1)">Next</button>
                      </div>
                    </div>
                  </section>
                  <section class="surface panel">
                    <div class="panel-head"><h3>Static content</h3><button type="button" class="mini-btn" (click)="markContentReviewed()">Mark reviewed</button></div>
                    <div class="dense-list">
                      @for (item of pagedStaticContent(); track item.key) {
                        <article>
                          <div><strong>{{ item.title }}</strong><span>{{ item.owner }} - {{ item.updatedAt | date:'mediumDate' }}</span></div>
                          <b class="status" [class]="statusClass(item.status)">{{ item.status }}</b>
                        </article>
                      }
                    </div>
                    <div class="pagination-row">
                      <span>{{ pageSummary(staticContent().length, staticContentPage) }}</span>
                      <div>
                        <button type="button" class="ghost-mini" [disabled]="staticContentPage === 1" (click)="changePage('staticContent', -1)">Previous</button>
                        <button type="button" class="mini-btn" [disabled]="staticContentPage === pageCount(staticContent().length)" (click)="changePage('staticContent', 1)">Next</button>
                      </div>
                    </div>
                  </section>
                </div>
              }

              @case ('reports') {
                <div class="metric-grid reports">
                  <article class="surface metric-card"><span>Revenue growth</span><strong>{{ .18 | percent }}</strong><small>Compared with last month</small></article>
                  <article class="surface metric-card"><span>Cancellation rate</span><strong>{{ .06 | percent }}</strong><small>4 cancelled bookings</small></article>
                  <article class="surface metric-card"><span>Most rented</span><strong>Canon R5</strong><small>12 rental days this month</small></article>
                  <article class="surface metric-card"><span>Customer growth</span><strong>{{ .24 | percent }}</strong><small>New verified accounts</small></article>
                </div>
                <section class="surface panel">
                  <h3>Category performance</h3>
                  <div class="bar-list">
                    @for (item of categoryReports(); track item.name) {
                      <div><span>{{ item.name }}</span><b [style.width.%]="item.value"></b><strong>{{ item.value }}%</strong></div>
                    }
                  </div>
                </section>
              }

              @case ('roles') {
                <section class="surface table-panel">
                  <table>
                    <thead><tr><th>Module</th><th>Super Admin</th><th>Manager</th><th>Inventory Staff</th><th>Content Editor</th></tr></thead>
                    <tbody>
                      @for (permission of rolePermissions(); track permission.module) {
                        <tr><td><strong>{{ permission.module }}</strong></td><td>{{ permission.superAdmin }}</td><td>{{ permission.manager }}</td><td>{{ permission.inventory }}</td><td>{{ permission.content }}</td></tr>
                      }
                    </tbody>
                  </table>
                </section>

                <form class="surface employee-form" [formGroup]="employeeForm" (ngSubmit)="submitEmployee()">
                  <div class="panel-head"><h3>Create employee</h3><span>Manager or staff access</span></div>
                  @if (employeeFormError) {
                    <p class="form-alert" role="alert">{{ employeeFormError }}</p>
                  }
                  <div class="form-grid">
                    <label>Full name<input formControlName="fullName"></label>
                    <label>Email<input formControlName="email"></label>
                    <label>Mobile<input formControlName="mobile"></label>
                    <label>Temporary password<input type="password" formControlName="password"></label>
                  </div>
                  <button type="submit" class="primary-btn wide" [disabled]="isSubmitting">{{ isSubmitting ? 'Creating...' : 'Create employee' }}</button>
                  @if (createdEmployee) {
                    <p class="success-text">{{ createdEmployee.fullName }} created with {{ createdEmployee.roles.join(', ') }} access.</p>
                  }
                </form>
              }

              @case ('settings') {
                <form class="surface editor-panel" [formGroup]="settingsForm" (ngSubmit)="saveSettings()">
                  <div class="panel-head"><h3>Platform settings</h3><span>Super admin only</span></div>
                  <div class="form-grid">
                    <label>Payment gateway<select formControlName="gateway"><option>Razorpay</option><option>PayU</option></select></label>
                    <label>Payment policy<select formControlName="paymentPolicy"><option>Full payment</option><option>Security deposit</option><option>Customer choice</option></select></label>
                    <label>Deposit percent<input type="number" formControlName="depositPercent"></label>
                    <label>GST percent<input type="number" formControlName="gstPercent"></label>
                    <label>Notification email<input formControlName="notificationEmail"></label>
                    <label>WhatsApp number<input formControlName="whatsappNumber"></label>
                    <label>reCAPTCHA site key<input formControlName="recaptchaKey"></label>
                    <label>Analytics ID<input formControlName="analyticsId"></label>
                  </div>
                  <button type="submit" class="primary-btn wide">Save settings</button>
                </form>
              }
            }
          </div>
        </div>
        @if (activeDocumentPreview) {
          <div class="document-lightbox" role="dialog" aria-modal="true" [attr.aria-label]="activeDocumentPreview.label" (click)="closeDocumentPreview()">
            <div class="document-lightbox-content" (click)="$event.stopPropagation()">
              <button type="button" class="lightbox-close" aria-label="Close image preview" (click)="closeDocumentPreview()">×</button>
              <div class="lightbox-image-row">
                <button type="button" class="lightbox-nav previous" aria-label="Previous image" [disabled]="imagePreviews().length < 2" (click)="showPreviousDocumentPreview()">‹</button>
                <img [src]="activeDocumentPreview.url" [alt]="activeDocumentPreview.label">
                <button type="button" class="lightbox-nav next" aria-label="Next image" [disabled]="imagePreviews().length < 2" (click)="showNextDocumentPreview()">›</button>
              </div>
              <div class="lightbox-foot">
                <strong>{{ activeDocumentPreview.label }}</strong>
                <span>{{ activeDocumentIndex() + 1 }} / {{ imagePreviews().length }}</span>
              </div>
            </div>
          </div>
        }
      } @else {
        <div class="surface access-card">
          <p class="eyebrow">Admin access</p>
          <h1>Please log in as admin to manage Clickkaar operations.</h1>
          <a routerLink="/login" class="primary-btn">Go to login</a>
        </div>
      }
    </section>
  `,
  styles: [`
    :host {
      --admin-bg: #f6f6f3;
      --admin-panel: #ffffff;
      --admin-soft: #faf9f6;
      --admin-line: rgba(17, 17, 17, .09);
      --admin-muted: #6f6f68;
      --admin-ink: #141414;
      --admin-accent: #ff9700;
    }
    .admin-page { max-width: 95vw !important; padding-bottom: 2rem; }
    .admin-layout { align-items: start; display: grid; gap: 1.25rem; grid-template-columns: 240px minmax(0, 1fr); }
    .admin-page :where(.surface) { background: var(--admin-panel); border: 1px solid var(--admin-line); border-radius: 8px; box-shadow: 0 18px 45px rgba(17,17,17,.06); }
    .admin-sidebar { background: #161616 !important; color: #fff; padding: .9rem; position: sticky; top: 92px; }
    .admin-sidebar .eyebrow { color: #ff9700; margin: 0 0 .35rem; }
    .admin-sidebar h1 { color: #fff; font-size: 1.35rem; line-height: 1.05; margin: 0 0 1rem; }
    nav { display: grid; gap: .25rem; }
    nav button { align-items: center; background: transparent; border: 1px solid transparent; border-radius: 6px; color: rgba(255,255,255,.78); display: flex; font-weight: 850; justify-content: space-between; min-height: 40px; padding: .62rem .7rem; text-align: left; }
    nav button small { background: rgba(255,255,255,.1); border-radius: 999px; color: rgba(255,255,255,.72); font-size: .68rem; min-width: 26px; padding: .16rem .42rem; text-align: center; }
    nav button.active, nav button:hover { background: #fff; border-color: #fff; color: #111; }
    nav button.active small, nav button:hover small { background: var(--admin-accent); color: #111; }
    .admin-workspace { display: grid; gap: 1.25rem; min-width: 0; }
    .admin-topbar { align-items: end; background: linear-gradient(180deg, #fff, var(--admin-soft)); border: 1px solid var(--admin-line); border-radius: 8px; display: flex; gap: 1.25rem; justify-content: space-between; padding: 1.15rem 1.2rem; }
    .admin-topbar .eyebrow { color: #ff9700; margin: 0 0 .25rem; }
    .admin-topbar h2 { font-size: clamp(1.75rem, 3.2vw, 3rem); line-height: 1; margin: 0; }
    .topbar-actions, .tool-row, .action-cell { align-items: center; display: flex; flex-wrap: wrap; gap: .55rem; }
    .tool-row { background: var(--admin-panel); border: 1px solid var(--admin-line); border-radius: 8px; justify-content: space-between; padding: .8rem; }
    .search-input { flex: 1 1 260px; }
    .inventory-filter-row { justify-content: flex-start; }
    .inventory-filter-row .search-input { flex: 0 1 320px; max-width: 320px; }
    .inventory-filter-row select { flex: 0 0 180px; width: 180px; }
    .booking-filter-row { justify-content: flex-start; }
    .booking-filter-row .search-input { flex: 0 1 320px; max-width: 320px; }
    .booking-filter-row select { flex: 0 0 190px; width: 190px; }
    .booking-filter-row .month-input { flex: 0 0 170px; width: 170px; }
    input, select, textarea { background: #fff; border: 1px solid var(--admin-line); border-radius: 6px; color: var(--admin-ink); font: inherit; min-height: 42px; outline: 0; padding: .68rem .8rem; width: 100%; }
    textarea { min-height: 92px; resize: vertical; }
    input:focus, select:focus, textarea:focus { border-color: var(--admin-accent); box-shadow: 0 0 0 3px rgba(255,151,0,.14); }
    .table-link { color: var(--admin-accent); font-size: .78rem; font-weight: 900; text-decoration: none; white-space: nowrap; }
    .table-link:hover { color: #111; text-decoration: underline; }
    .remark-input { min-width: 220px; }
    .remark-cell { min-width: 340px; }
    .remark-control { align-items: center; display: grid; gap: .45rem; grid-template-columns: minmax(220px, 1fr) auto; }
    .remark-log-btn { background: transparent; border: 0; box-shadow: none; color: var(--admin-muted); display: inline-flex; font-size: .72rem; font-weight: 900; justify-content: flex-start; margin-top: .32rem; min-height: auto; padding: 0; text-transform: uppercase; }
    .remark-log-btn:hover { color: var(--admin-accent); transform: none; }
    .remark-log-btn:disabled, .remark-log-btn:disabled:hover { color: var(--admin-muted); cursor: default; opacity: .65; }
    button, .primary-btn, .ghost-btn, .mini-btn, .danger-btn, .ghost-mini, .link-btn { align-items: center; border: 0; border-radius: 999px; cursor: pointer; display: inline-flex; font-weight: 900; justify-content: center; transition: transform .25s ease, background .25s ease, color .25s ease, border-color .25s ease, box-shadow .25s ease; white-space: nowrap; }
    .primary-btn { background: #111; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; min-height: 50px; padding: .85rem 1.25rem; }
    .primary-btn:hover { background: var(--admin-accent); box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .ghost-btn { background: #fff; border: 1px solid rgba(17,17,17,.12); box-shadow: 0 8px 22px rgba(0,0,0,.06); color: #111; min-height: 50px; padding: .85rem 1.25rem; }
    .ghost-btn:hover, .ghost-mini:hover, .link-btn:hover { background: #111; border-color: #111; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; transform: translateY(-2px); }
    .mini-btn, .danger-btn, .ghost-mini, .link-btn { font-size: .78rem; min-height: 34px; padding: .48rem .78rem; }
    .mini-btn { background: #111; box-shadow: 0 10px 22px rgba(0,0,0,.14); color: #fff; }
    .mini-btn:hover { background: var(--admin-accent); box-shadow: 0 14px 28px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .danger-btn { background: #fff1f1; border: 1px solid rgba(180,35,24,.16); box-shadow: 0 8px 22px rgba(180,35,24,.08); color: #b42318; }
    .danger-btn:hover { background: #b42318; border-color: #b42318; box-shadow: 0 14px 28px rgba(180,35,24,.18); color: #fff; transform: translateY(-2px); }
    .topbar-logout { min-height: 50px; padding: .85rem 1.25rem; }
    .ghost-mini, .link-btn { background: #fff; border: 1px solid rgba(17,17,17,.12); box-shadow: 0 8px 22px rgba(0,0,0,.05); color: #111; }
    button:disabled, button:disabled:hover { cursor: not-allowed; opacity: .55; transform: none !important; }
    .metric-grid { display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .metric-card { align-content: space-between; display: grid; gap: .55rem; min-height: 136px; min-width: 0; padding: 1rem; position: relative; }
    .metric-card::before { background: #111; border-radius: 999px; content: ""; height: 4px; left: .9rem; position: absolute; right: .9rem; top: .75rem; }
    .metric-card span { color: var(--admin-muted); font-size: .7rem; font-weight: 900; padding-top: .55rem; text-transform: uppercase; }
    .metric-card strong { color: #111; font-size: clamp(1.45rem, 2.6vw, 2.15rem); line-height: 1; }
    .metric-card small { color: var(--admin-muted); font-weight: 650; line-height: 1.35; }
    .metric-card.orange::before { background: #ff9700; }
    .metric-card.green::before { background: #12b76a; }
    .metric-card.red::before { background: #e5484d; }
    .metric-card.orange { background: #fffaf2; border-color: rgba(255,151,0,.24); }
    .metric-card.green { background: #f4fbf7; border-color: rgba(34,197,94,.18); }
    .metric-card.red { background: #fff7f6; border-color: rgba(244,63,94,.16); }
    .split-grid { align-items: stretch; display: grid; gap: 1.25rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .panel, .table-panel, .editor-panel, .employee-form, .access-card { padding: 1.05rem; }
    .panel, .editor-panel, .employee-form { display: grid; gap: 1rem; min-width: 0; }
    .panel-head { align-items: center; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 0; min-width: 0; }
    .panel-head h3, .customer-card h3 { font-size: 1.05rem; line-height: 1.1; margin: 0; }
    .panel-head span { color: #777; font-size: .82rem; font-weight: 800; }
    .dense-list { display: grid; gap: .65rem; }
    .dense-list article { align-items: center; background: var(--admin-soft); border: 1px solid var(--admin-line); border-radius: 6px; display: flex; gap: .8rem; justify-content: space-between; min-width: 0; padding: .78rem; }
    .dense-list article > div { min-width: 0; }
    .dense-list article.active { background: #fffaf2; border-color: var(--admin-accent); box-shadow: 0 10px 24px rgba(255,151,0,.11); }
    .dense-list strong, td strong { display: block; }
    .dense-list span, td span { color: #777; display: block; font-size: .8rem; margin-top: .18rem; }
    .request-list article { align-items: center; flex-direction: row; }
    .request-summary { align-items: start; background: transparent; border: 0; color: #111; display: grid; flex: 1; font: inherit; justify-content: stretch; min-width: 0; padding: 0; text-align: left; white-space: normal; }
    .request-summary small { color: #9a6a00; font-size: .72rem; font-weight: 900; margin-top: .25rem; }
    .request-list .mini-btn { flex: 0 0 auto; min-width: 74px; }
    .pagination-row { align-items: center; border-top: 1px solid var(--admin-line); display: flex; gap: .85rem; justify-content: space-between; padding-top: .85rem; }
    .pagination-row span { color: #777; font-size: .78rem; font-weight: 900; }
    .pagination-row div { align-items: center; display: flex; flex-wrap: wrap; gap: .55rem; }
    .registration-grid { align-items: start; grid-template-columns: minmax(320px, .72fr) minmax(0, 1.28fr); }
    .registration-detail { align-content: start; display: grid; gap: 1rem; }
    .registration-detail .panel-head { background: var(--admin-soft); border: 1px solid var(--admin-line); border-radius: 6px; margin-bottom: 0; padding: .85rem; }
    .detail-page-count { color: #777; flex: 0 0 auto; font-size: .78rem; font-weight: 900; }
    .detail-stepper { background: var(--admin-soft); border: 1px solid var(--admin-line); border-radius: 999px; display: grid; gap: .35rem; grid-template-columns: repeat(3, minmax(0, 1fr)); padding: .35rem; }
    .detail-stepper button { background: transparent; box-shadow: none; color: #777; min-height: 36px; padding: .5rem .65rem; }
    .detail-stepper button.active, .detail-stepper button:hover { background: #111; box-shadow: 0 10px 22px rgba(0,0,0,.14); color: #fff; transform: none; }
    .detail-section { background: var(--admin-soft); border: 1px solid var(--admin-line); border-radius: 6px; padding: 1rem; }
    .detail-section + .detail-section { margin-top: 0; }
    .detail-section h4 { color: #9a6a00; font-size: .78rem; letter-spacing: .08em; margin: 0 0 .8rem; text-transform: uppercase; }
    .detail-grid { display: grid; gap: .65rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; }
    .detail-grid div { background: #fff; border: 1px solid rgba(17,17,17,.06); border-radius: 6px; min-width: 0; padding: .72rem; }
    .detail-grid dt { color: #777; font-size: .72rem; font-weight: 900; text-transform: uppercase; }
    .detail-grid dd { color: #111; font-weight: 800; margin: .25rem 0 0; overflow-wrap: anywhere; }
    .detail-actions { align-items: center; border-top: 1px solid var(--admin-line); display: flex; gap: .55rem; justify-content: flex-end; padding-top: 1rem; }
    .document-grid { display: grid; gap: .85rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .document-grid article { background: #fff; border: 1px solid var(--admin-line); border-radius: 6px; min-width: 0; padding: .75rem; }
    .document-frame { align-items: center; aspect-ratio: 4 / 3; background: #f2f1ed; border-radius: 6px; display: flex; justify-content: center; margin-bottom: .65rem; overflow: hidden; }
    .document-frame img { height: 100%; object-fit: contain; width: 100%; }
    .document-preview-btn { background: transparent; border: 0; border-radius: 6px; cursor: zoom-in; height: 100%; padding: 0; width: 100%; }
    .document-preview-btn:hover { transform: none; }
    .document-frame span, .document-frame a { color: #777; font-size: .82rem; font-weight: 900; }
    .document-grid strong, .document-grid span { display: block; overflow-wrap: anywhere; }
    .document-grid span { color: #777; font-size: .76rem; margin-top: .2rem; }
    .empty-detail { align-content: center; display: grid; min-height: 260px; text-align: center; }
    .document-lightbox { align-items: center; backdrop-filter: blur(14px); background: rgba(17,17,17,.62); display: flex; inset: 0; justify-content: center; padding: 1.25rem; position: fixed; z-index: 5000; }
    .document-lightbox-content { display: grid; gap: .65rem; max-height: 92vh; max-width: min(920px, 94vw); position: relative; width: 100%; }
    .lightbox-close, .lightbox-nav { align-items: center; background: rgba(255,255,255,.92); border: 1px solid rgba(255,255,255,.32); border-radius: 999px; box-shadow: 0 12px 28px rgba(0,0,0,.2); color: #111; display: inline-flex; font-size: 1.4rem; font-weight: 950; justify-content: center; min-height: 38px; padding: 0; width: 38px; }
    .lightbox-close { position: absolute; right: .65rem; top: .65rem; z-index: 2; }
    .lightbox-close:hover, .lightbox-nav:hover { background: #ff9700; color: #111; transform: translateY(-1px); }
    .lightbox-image-row { align-items: center; display: grid; gap: .75rem; grid-template-columns: 40px minmax(0, 1fr) 40px; min-height: 360px; }
    .lightbox-image-row img { background: #fff; border-radius: 8px; box-shadow: 0 24px 80px rgba(0,0,0,.34); display: block; margin: 0 auto; max-height: 76vh; object-fit: contain; padding: .5rem; width: 100%; }
    .lightbox-nav { align-self: center; justify-self: center; }
    .lightbox-nav:disabled, .lightbox-nav:disabled:hover { background: rgba(255,255,255,.52); box-shadow: none; color: rgba(17,17,17,.35); }
    .lightbox-foot { align-items: center; color: #fff; display: flex; gap: .7rem; justify-content: center; text-align: center; }
    .lightbox-foot strong, .lightbox-foot span { text-shadow: 0 2px 14px rgba(0,0,0,.32); }
    .lightbox-foot strong { font-size: .88rem; }
    .lightbox-foot span { color: rgba(255,255,255,.75); font-size: .8rem; font-weight: 900; }
    .remark-log-table-row td { background: #fff7ec; padding: 0; }
    .remark-log-inline { display: grid; gap: 1rem; padding: 1rem; }
    .remark-log-head { border-bottom: 1px solid var(--admin-line); padding-right: 2.7rem; padding-bottom: .85rem; }
    .remark-log-head h3 { margin: .15rem 0; }
    .remark-log-head span { color: var(--admin-muted); font-size: .82rem; font-weight: 800; }
    .remark-log-list { display: grid; gap: .75rem; }
    .remark-log-list article { border: 1px solid var(--admin-line); border-radius: 6px; display: grid; gap: .7rem; padding: .8rem; }
    .remark-log-list article > div { align-items: center; display: flex; flex-wrap: wrap; gap: .45rem; justify-content: space-between; }
    .remark-log-list article span { color: var(--admin-muted); font-size: .78rem; font-weight: 900; }
    .remark-log-list dl { display: grid; gap: .55rem; margin: 0; }
    .remark-log-list dt { color: var(--admin-muted); font-size: .7rem; font-weight: 900; text-transform: uppercase; }
    .remark-log-list dd { margin: .16rem 0 0; overflow-wrap: anywhere; }
    .table-panel { overflow-x: auto; padding: .85rem; }
    table { border-collapse: collapse; min-width: 920px; width: 100%; }
    th { background: #f3f3ef; border-bottom: 1px solid var(--admin-line); color: var(--admin-muted); font-size: .7rem; letter-spacing: .08em; padding: .7rem .75rem; text-align: left; text-transform: uppercase; }
    td { background: #fff; border-bottom: 1px solid rgba(17,17,17,.07); padding: .72rem .75rem; vertical-align: middle; }
    tr:hover td { background: #fffaf2; }
    .product-cell { align-items: center; display: flex; gap: .7rem; min-width: 230px; }
    .product-cell img { aspect-ratio: 1; border-radius: 6px; object-fit: cover; width: 52px; }
    .status { border-radius: 999px; display: inline-flex; font-size: .7rem; font-weight: 900; padding: .3rem .52rem; }
    .status-ok { background: #ecfdf3; color: #027a48; }
    .status-warn { background: #fff7e6; color: #b35a00; }
    .status-bad { background: #fff1f1; color: #b42318; }
    .status-info { background: #eef4ff; color: #2447a8; }
    .calendar-strip { background: #f3f3ef; border-radius: 999px; color: #555; padding: .32rem .52rem; }
    .empty-cell { color: #777; text-align: center; }
    .form-alert { background: #fff4f2; border: 1px solid rgba(180,35,24,.24); border-radius: 6px; color: #b42318; font-size: .9rem; font-weight: 800; line-height: 1.45; margin: 0 0 1rem; padding: .85rem 1rem; }
    .form-grid { display: grid; gap: .9rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    label { color: #111; display: grid; font-size: .78rem; font-weight: 900; gap: .4rem; }
    .editor-panel > label { margin-top: 0; }
    .wide { margin-top: .85rem; width: 100%; }
    .card-grid { display: grid; gap: 1rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .customer-card { align-content: start; display: grid; gap: .85rem; min-width: 0; padding: 1.05rem; }
    .customer-card.blocked { opacity: .68; }
    .customer-card p, .customer-card span { color: #777; font-size: .84rem; margin: 0; }
    .avatar { align-items: center; background: #111; border-radius: 50%; color: #ff9700; display: inline-flex; font-weight: 950; height: 42px; justify-content: center; width: 42px; }
    dl { display: grid; gap: .5rem; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 0; }
    dt { color: #777; font-size: .7rem; font-weight: 900; text-transform: uppercase; }
    dd { color: #111; font-size: 1.15rem; font-weight: 950; margin: 0; }
    .bar-list { display: grid; gap: .75rem; }
    .bar-list div { align-items: center; display: grid; gap: .75rem; grid-template-columns: 140px 1fr 44px; }
    .bar-list b { background: #ff9700; border-radius: 999px; display: block; height: 12px; }
    .error-text { color: #b42318; font-weight: 800; }
    .success-text { color: #027a48; font-weight: 900; margin: .8rem 0 0; }
    .access-card { margin: 0 auto; max-width: 680px; text-align: center; }
    .access-card h1 { font-size: clamp(2rem, 5vw, 4rem); line-height: .96; }
    @media (max-width: 1100px) {
      .admin-layout { grid-template-columns: 1fr; }
      .admin-sidebar { position: static; }
      nav { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .metric-grid, .card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .registration-grid { grid-template-columns: minmax(0, 1fr); }
    }
    @media (max-width: 760px) {
      .admin-topbar, .split-grid, .tool-row { align-items: stretch; grid-template-columns: 1fr; flex-direction: column; }
      .split-grid, .metric-grid, .card-grid, .form-grid, .detail-grid, .document-grid, nav { grid-template-columns: 1fr; }
      .inventory-filter-row .search-input, .inventory-filter-row select, .booking-filter-row .search-input, .booking-filter-row select, .booking-filter-row .month-input { max-width: none; width: 100%; }
      .request-list article { align-items: stretch; }
      .request-list .mini-btn { width: 100%; }
      .pagination-row { align-items: stretch; flex-direction: column; }
      .pagination-row div, .pagination-row button { width: 100%; }
      .detail-stepper { border-radius: 18px; grid-template-columns: 1fr; }
      .detail-actions { align-items: stretch; flex-direction: column; width: 100%; }
      .detail-actions button, .detail-actions .primary-btn { width: 100%; }
      .topbar-actions { align-items: stretch; flex-direction: column; }
      .topbar-actions button { width: 100%; }
      .document-lightbox { padding: .7rem; }
      .document-lightbox-content { max-height: 94vh; max-width: 96vw; }
      .lightbox-image-row { gap: .45rem; grid-template-columns: 34px minmax(0, 1fr) 34px; min-height: 260px; }
      .lightbox-close, .lightbox-nav { font-size: 1.2rem; min-height: 34px; width: 34px; }
      .lightbox-foot { flex-direction: column; gap: .2rem; }
    }
  `]
})
export class AdminPageComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);

  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly activeTab = signal<AdminTab>('dashboard');
  readonly products = signal<AdminProduct[]>([]);
  readonly bookings = signal<AdminBooking[]>([]);
  readonly customers = signal<AdminCustomer[]>([]);
  readonly payments = signal<AdminPayment[]>([]);
  readonly blogPosts = signal<BlogPostAdmin[]>([]);
  readonly staticContent = signal<StaticContentItem[]>([]);

  readonly inventoryQuery = signal('');
  readonly inventoryStatus = signal('');
  readonly bookingQuery = signal('');
  readonly bookingStatusFilter = signal('');
  readonly bookingMonthFilter = signal('');
  readonly paymentStatusFilter = signal('');
  readonly customerQuery = signal('');
  editingProductId?: number;
  createdEmployee?: EmployeeResponse;
  productFormError = '';
  employeeFormError = '';
  pendingCustomers: CustomerVerificationResponse[] = [];
  pendingPage = 1;
  readonly pendingPageSize = 3;
  readonly adminPageSize = 5;
  inventoryPage = 1;
  bookingsPage = 1;
  customersPage = 1;
  paymentsPage = 1;
  blogPage = 1;
  staticContentPage = 1;
  pendingLoadError = '';
  isSubmitting = false;
  isLoadingPending = false;
  verifyingRequestId?: number;
  selectedPendingCustomer?: CustomerVerificationResponse;
  registrationDetailPage = 1;
  documentPreviews: Record<string, DocumentPreview> = {};
  documentPreviewError = '';
  isLoadingDocuments = false;
  activeDocumentPreview?: DocumentPreview;
  private readonly savingPaymentRemarkIds = new Set<number>();
  activeRemarkLogPayment?: AdminPayment;
  activePaymentRemarkLogs: PaymentRemarkLogView[] = [];
  isLoadingPaymentRemarkLog = false;
  paymentRemarkLogError = '';

  readonly tabs: { id: AdminTab; label: string; count: string }[] = [
    { id: 'dashboard', label: 'Dashboard', count: 'Live' },
    { id: 'registrations', label: 'Registrations', count: '0' },
    { id: 'inventory', label: 'Inventory', count: '8' },
    { id: 'bookings', label: 'Bookings', count: '4' },
    { id: 'customers', label: 'Customers', count: '3' },
    { id: 'payments', label: 'Payments', count: '3' },
    { id: 'content', label: 'Content', count: '5' },
    { id: 'reports', label: 'Reports', count: 'CSV' },
    { id: 'roles', label: 'Roles', count: 'RBAC' },
    { id: 'settings', label: 'Settings', count: 'Ops' }
  ];

  readonly categoryReports = signal<Array<{ name: string; value: number }>>([]);
  readonly rolePermissions = signal<RolePermission[]>([]);

  readonly productForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    brand: ['', Validators.required],
    category: ['', Validators.required],
    status: ['Available' as ProductStatus, Validators.required],
    dailyPrice: [0, [Validators.required, Validators.min(1)]],
    weeklyPrice: [0, [Validators.required, Validators.min(1)]],
    stock: [1, [Validators.required, Validators.min(0)]],
    image: ['', Validators.required],
    warrantyDate: [''],
    invoiceUrl: [''],
    description: ['', Validators.required],
    specifications: ['']
  });

  readonly employeeForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.minLength(10)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly settingsForm = this.fb.nonNullable.group({
    gateway: ['Razorpay'],
    paymentPolicy: ['Security deposit'],
    depositPercent: [30],
    gstPercent: [18],
    notificationEmail: ['ops@clickkaar.in'],
    whatsappNumber: ['+919876543210'],
    recaptchaKey: [''],
    analyticsId: ['G-CLICKKAAR']
  });

  readonly activeTabLabel = computed(() => this.tabs.find((tab) => tab.id === this.activeTab())?.label ?? 'Admin');
  readonly activeTitle = computed(() => {
    const titles: Record<AdminTab, string> = {
      dashboard: 'Operations dashboard',
      registrations: 'Pending registration requests',
      inventory: 'Inventory management',
      bookings: 'Booking management',
      customers: 'Customer management',
      payments: 'Payments & refunds',
      content: 'Blog & content',
      reports: 'Reports & analytics',
      roles: 'Roles & permissions',
      settings: 'Platform settings'
    };
    return titles[this.activeTab()];
  });
  readonly metrics = computed<AdminMetric[]>(() => [
    { label: 'Bookings this month', value: String(this.bookings().length), note: 'Includes walk-in and online bookings', tone: 'dark' },
    { label: 'Revenue this month', value: this.formatCurrency(this.payments().filter((item) => item.status === 'Paid').reduce((sum, item) => sum + item.amount, 0)), note: 'Paid transactions only', tone: 'green' },
    { label: 'Items out on rent', value: String(this.bookings().filter((item) => item.status === 'Active' || item.status === 'Overdue').length), note: 'Active rentals requiring tracking', tone: 'orange' },
    { label: 'Overdue returns', value: String(this.bookings().filter((item) => item.status === 'Overdue').length), note: 'Needs immediate follow-up', tone: 'red' },
    { label: 'Pending payments', value: String(this.payments().filter((item) => item.status === 'Pending').length), note: 'Collect before release', tone: 'orange' },
    { label: 'Unavailable inventory', value: String(this.products().filter((item) => item.status !== 'Available').length), note: 'Maintenance or blocked gear', tone: 'red' },
    { label: 'Verified customers', value: String(this.customers().filter((item) => item.verified).length), note: 'OTP approved accounts', tone: 'green' },
    { label: 'Pending approvals', value: String(this.pendingCustomers.length), note: 'Registration review queue', tone: 'orange' }
  ]);

  readonly filteredProducts = computed(() => {
    const query = this.inventoryQuery().trim().toLowerCase();
    return this.products()
      .filter((item) => !this.inventoryStatus() || item.status === this.inventoryStatus())
      .filter((item) => !query || [item.name, item.brand, item.category].some((value) => value.toLowerCase().includes(query)));
  });

  readonly filteredBookings = computed(() => {
    const query = this.bookingQuery().trim().toLowerCase();
    return this.bookings()
      .filter((item) => !this.bookingStatusFilter() || item.status === this.bookingStatusFilter())
      .filter((item) => !this.paymentStatusFilter() || item.paymentStatus === this.paymentStatusFilter())
      .filter((item) => this.bookingOverlapsSelectedMonth(item))
      .filter((item) => !query || [item.id, item.customer, ...item.products].some((value) => value.toLowerCase().includes(query)));
  });

  readonly filteredCustomers = computed(() => {
    const query = this.customerQuery().trim().toLowerCase();
    return this.customers().filter((item) => !query || [item.name, item.email, item.city, item.phone].some((value) => value.toLowerCase().includes(query)));
  });

  pagedProducts(): AdminProduct[] {
    return this.paginate(this.filteredProducts(), this.inventoryPage);
  }

  pagedBookings(): AdminBooking[] {
    return this.paginate(this.filteredBookings(), this.bookingsPage);
  }

  pagedCustomers(): AdminCustomer[] {
    return this.paginate(this.filteredCustomers(), this.customersPage);
  }

  pagedPayments(): AdminPayment[] {
    return this.paginate(this.payments(), this.paymentsPage);
  }

  pagedBlogPosts(): BlogPostAdmin[] {
    return this.paginate(this.blogPosts(), this.blogPage);
  }

  pagedStaticContent(): StaticContentItem[] {
    return this.paginate(this.staticContent(), this.staticContentPage);
  }

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadAdminData();
      this.loadPendingCustomers();
    }
  }

  ngOnDestroy(): void {
    this.clearDocumentPreviews();
  }

  private loadAdminData(): void {
    this.loadInventory();
    this.loadBookings();
    this.loadCustomers();
    this.loadPayments();
    this.loadContent();
    this.loadCategoryReports();
    this.loadRolePermissions();
    this.loadSettings();
  }

  private loadInventory(): void {
    this.adminService.getInventory().subscribe({
      next: (products) => {
        this.products.set(products.map((product) => this.mapProduct(product)));
        this.clampAdminPages();
        this.updateTabCount('inventory', String(products.length));
      },
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  private loadBookings(): void {
    this.adminService.getBookings().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings.map((booking) => this.mapBooking(booking)));
        this.clampAdminPages();
        this.updateTabCount('bookings', String(bookings.length));
      },
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  private loadCustomers(): void {
    this.adminService.getCustomers().subscribe({
      next: (customers) => {
        this.customers.set(customers.map((customer) => this.mapCustomer(customer)));
        this.clampAdminPages();
        this.updateTabCount('customers', String(customers.length));
      },
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  private loadPayments(): void {
    this.adminService.getPayments().subscribe({
      next: (payments) => {
        this.payments.set(payments.map((payment) => this.mapPayment(payment)));
        this.clampAdminPages();
        this.updateTabCount('payments', String(payments.length));
      },
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  private loadContent(): void {
    this.adminService.getContent().subscribe({
      next: (content) => this.applyContent(content),
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  private loadCategoryReports(): void {
    this.adminService.getCategoryReports().subscribe({
      next: (reports) => this.categoryReports.set(reports),
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  private loadRolePermissions(): void {
    this.adminService.getRolePermissions().subscribe({
      next: (permissions) => this.rolePermissions.set(permissions),
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  private loadSettings(): void {
    this.adminService.getSettings().subscribe({
      next: (settings) => this.settingsForm.patchValue(settings),
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  verifyCustomer(customer: CustomerVerificationResponse): void {
    if (this.verifyingRequestId) {
      return;
    }

    this.verifyingRequestId = customer.requestId;
    this.adminService.verifyCustomer(customer.requestId)
      .pipe(finalize(() => {
        this.verifyingRequestId = undefined;
      }))
      .subscribe({
        next: () => {
          this.pendingCustomers = this.pendingCustomers.filter((item) => item.requestId !== customer.requestId);
          this.clampPendingPage();
          if (this.selectedPendingCustomer?.requestId === customer.requestId) {
            this.clearDocumentPreviews();
            this.selectedPendingCustomer = this.pendingPageItems()[0] ?? this.pendingCustomers[0];
            this.registrationDetailPage = 1;
            if (this.selectedPendingCustomer) {
              this.loadDocumentPreviews(this.selectedPendingCustomer);
            }
          }
          this.updateTabCount('registrations', String(this.pendingCustomers.length));
          this.showTopMessage('Login access granted. The customer can now log in.', 2800);
        },
        error: (error) => {
          this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 });
        }
      });
  }

  loadPendingCustomers(): void {
    this.isLoadingPending = true;
    this.pendingLoadError = '';
    this.adminService.getPendingCustomers()
      .pipe(finalize(() => {
        this.isLoadingPending = false;
      }))
      .subscribe({
        next: (customers) => {
          this.pendingCustomers = customers;
          this.clampPendingPage();
          this.updateTabCount('registrations', String(customers.length));
          if (this.selectedPendingCustomer && !customers.some((customer) => customer.requestId === this.selectedPendingCustomer?.requestId)) {
            this.clearDocumentPreviews();
            this.selectedPendingCustomer = undefined;
          }
        },
        error: (error) => {
          this.pendingLoadError = this.authService.getErrorMessage(error);
          this.snackBar.open(this.pendingLoadError, 'Close', { duration: 3600 });
        }
      });
  }

  openPendingDetails(customer: CustomerVerificationResponse): void {
    this.selectedPendingCustomer = customer;
    this.registrationDetailPage = 1;
    this.activeTab.set('registrations');
    this.loadDocumentPreviews(customer);
  }

  setRegistrationDetailPage(page: number): void {
    this.registrationDetailPage = Math.min(3, Math.max(1, page));
  }

  changeRegistrationDetailPage(direction: number): void {
    this.setRegistrationDetailPage(this.registrationDetailPage + direction);
  }

  pageCount(total: number): number {
    return Math.max(1, Math.ceil(total / this.adminPageSize));
  }

  pageSummary(total: number, page: number): string {
    if (!total) {
      return 'No records';
    }
    const safePage = Math.min(this.pageCount(total), Math.max(1, page));
    const start = (safePage - 1) * this.adminPageSize + 1;
    const end = Math.min(safePage * this.adminPageSize, total);
    return `Showing ${start}-${end} of ${total}`;
  }

  changePage(section: 'inventory' | 'bookings' | 'customers' | 'payments' | 'blog' | 'staticContent', direction: number): void {
    if (section === 'inventory') {
      this.inventoryPage = this.nextPage(this.inventoryPage, this.filteredProducts().length, direction);
      return;
    }
    if (section === 'bookings') {
      this.bookingsPage = this.nextPage(this.bookingsPage, this.filteredBookings().length, direction);
      return;
    }
    if (section === 'customers') {
      this.customersPage = this.nextPage(this.customersPage, this.filteredCustomers().length, direction);
      return;
    }
    if (section === 'payments') {
      this.paymentsPage = this.nextPage(this.paymentsPage, this.payments().length, direction);
      return;
    }
    if (section === 'blog') {
      this.blogPage = this.nextPage(this.blogPage, this.blogPosts().length, direction);
      return;
    }
    this.staticContentPage = this.nextPage(this.staticContentPage, this.staticContent().length, direction);
  }

  pendingPageCount(): number {
    return Math.max(1, Math.ceil(this.pendingCustomers.length / this.pendingPageSize));
  }

  pendingPageItems(): CustomerVerificationResponse[] {
    const start = (this.pendingPage - 1) * this.pendingPageSize;
    return this.pendingCustomers.slice(start, start + this.pendingPageSize);
  }

  pendingPageSummary(): string {
    if (!this.pendingCustomers.length) {
      return 'No requests';
    }
    const start = (this.pendingPage - 1) * this.pendingPageSize + 1;
    const end = Math.min(this.pendingPage * this.pendingPageSize, this.pendingCustomers.length);
    return `Showing ${start}-${end} of ${this.pendingCustomers.length}`;
  }

  changePendingPage(direction: number): void {
    this.pendingPage = Math.min(this.pendingPageCount(), Math.max(1, this.pendingPage + direction));
  }

  private clampPendingPage(): void {
    this.pendingPage = Math.min(this.pendingPageCount(), Math.max(1, this.pendingPage));
  }

  logout(): void {
    this.clearDocumentPreviews();
    this.authService.logout();
    this.showTopMessage('Logged out from admin.', 2200);
    this.router.navigateByUrl('/login');
  }

  openDocumentPreview(preview: DocumentPreview): void {
    this.activeDocumentPreview = preview;
  }

  closeDocumentPreview(): void {
    this.activeDocumentPreview = undefined;
  }

  togglePaymentRemarkLog(payment: AdminPayment): void {
    if (this.activeRemarkLogPayment?.backendId === payment.backendId) {
      this.closePaymentRemarkLog();
      return;
    }

    this.activeRemarkLogPayment = payment;
    this.activePaymentRemarkLogs = [];
    this.paymentRemarkLogError = '';
    this.isLoadingPaymentRemarkLog = true;
    this.adminService.getPaymentRemarkLogs(payment.backendId)
      .pipe(finalize(() => {
        this.isLoadingPaymentRemarkLog = false;
      }))
      .subscribe({
      next: (logs) => {
        this.activePaymentRemarkLogs = logs.map((log) => this.mapPaymentRemarkLog(log));
      },
      error: (error) => {
        const message = this.authService.getErrorMessage(error);
        this.paymentRemarkLogError = message.includes('No static resource')
          ? 'Remark log API is not available in the running backend. Restart the backend with the latest code.'
          : message;
      }
    });
  }

  closePaymentRemarkLog(): void {
    this.activeRemarkLogPayment = undefined;
    this.activePaymentRemarkLogs = [];
    this.paymentRemarkLogError = '';
    this.isLoadingPaymentRemarkLog = false;
  }

  showPreviousDocumentPreview(): void {
    this.showDocumentPreviewAt(this.activeDocumentIndex() - 1);
  }

  showNextDocumentPreview(): void {
    this.showDocumentPreviewAt(this.activeDocumentIndex() + 1);
  }

  saveProduct(): void {
    this.productFormError = '';
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.productFormError = 'Complete all required product fields.';
      return;
    }

    const request = this.productRequestFromForm();
    if (this.editingProductId) {
      this.adminService.updateProduct(this.editingProductId, request).subscribe({
        next: (product) => {
          this.products.update((items) => items.map((item) => item.id === product.id ? this.mapProduct(product) : item));
          this.resetProductForm();
          this.showTopMessage('Product updated.', 2600);
        },
        error: (error) => {
          this.productFormError = this.authService.getErrorMessage(error);
        }
      });
    } else {
      this.adminService.createProduct(request).subscribe({
        next: (product) => {
          this.products.update((items) => [...items, this.mapProduct(product)]);
          this.resetProductForm();
          this.updateTabCount('inventory', String(this.products().length));
          this.showTopMessage('Product added.', 2600);
        },
        error: (error) => {
          this.productFormError = this.authService.getErrorMessage(error);
        }
      });
    }
  }

  editProduct(product: AdminProduct): void {
    this.showTopMessage(`Edit page for ${product.name} is not available yet.`, 2600);
  }

  resetProductForm(): void {
    this.productFormError = '';
    this.editingProductId = undefined;
    this.productForm.reset({
      name: '',
      brand: '',
      category: '',
      status: 'Available',
      dailyPrice: 0,
      weeklyPrice: 0,
      stock: 1,
      image: '',
      warrantyDate: '',
      invoiceUrl: '',
      description: '',
      specifications: ''
    });
  }

  markMaintenance(product: AdminProduct): void {
    if (!confirm(`Mark ${product.name} as under maintenance?`)) {
      return;
    }
    this.adminService.markProductMaintenance(product.id).subscribe({
      next: (updatedProduct) => {
        this.products.update((items) => items.map((item) => item.id === updatedProduct.id ? this.mapProduct(updatedProduct) : item));
      },
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  advanceBooking(booking: AdminBooking): void {
    const next: Record<BookingStatus, BookingStatus> = {
      Upcoming: 'Active',
      Active: 'Completed',
      Completed: 'Completed',
      Cancelled: 'Cancelled',
      Overdue: 'Completed'
    };
    this.adminService.updateBookingStatus(booking.backendId, this.bookingStatusToApi(next[booking.status])).subscribe({
      next: (updatedBooking) => {
        this.bookings.update((items) => items.map((item) => item.backendId === updatedBooking.id ? this.mapBooking(updatedBooking) : item));
      },
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  addNote(booking: AdminBooking): void {
    const note = prompt('Internal note', booking.notes);
    if (note === null) {
      return;
    }
    this.adminService.addBookingNote(booking.backendId, note).subscribe({
      next: (updatedBooking) => {
        this.bookings.update((items) => items.map((item) => item.backendId === updatedBooking.id ? this.mapBooking(updatedBooking) : item));
      },
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  toggleCustomerBlock(customer: AdminCustomer): void {
    const action = customer.blocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} ${customer.name}?`)) {
      return;
    }
    this.adminService.setCustomerBlocked(customer.id, !customer.blocked).subscribe({
      next: (updatedCustomer) => {
        this.customers.update((items) => items.map((item) => item.id === updatedCustomer.id ? this.mapCustomer(updatedCustomer) : item));
      },
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  updatePaymentRemarkDraft(payment: AdminPayment, remark: string): void {
    this.payments.update((items) => items.map((item) => item.backendId === payment.backendId ? { ...item, remark } : item));
  }

  savePaymentRemark(paymentId: number): void {
    const payment = this.payments().find((item) => item.backendId === paymentId);
    if (!payment || this.isSavingPaymentRemark(paymentId)) {
      return;
    }

    this.savingPaymentRemarkIds.add(paymentId);
    this.adminService.updatePaymentRemark(paymentId, payment.remark)
      .pipe(finalize(() => {
        this.savingPaymentRemarkIds.delete(paymentId);
      }))
      .subscribe({
      next: (updatedPayment) => {
        this.payments.update((items) => items.map((item) => item.backendId === updatedPayment.id ? this.mapPayment(updatedPayment) : item));
        this.showTopMessage('Payment remark saved.', 1800);
      },
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  isSavingPaymentRemark(paymentId: number): boolean {
    return this.savingPaymentRemarkIds.has(paymentId);
  }

  publishDraft(): void {
    this.blogPosts.update((items) => items.map((item) => item.status === 'Draft' ? { ...item, status: 'Published' } : item));
  }

  markContentReviewed(): void {
    this.staticContent.update((items) => items.map((item) => ({ ...item, status: 'Current' })));
  }

  submitEmployee(): void {
    this.employeeFormError = '';
    if (this.employeeForm.invalid || this.isSubmitting) {
      this.employeeForm.markAllAsTouched();
      this.employeeFormError = 'Please complete valid employee details.';
      return;
    }

    this.isSubmitting = true;
    this.adminService.createEmployee(this.employeeForm.getRawValue())
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe({
        next: (employee) => {
          this.createdEmployee = employee;
          this.employeeForm.reset();
          this.showTopMessage('Employee account created.', 2600);
        },
        error: (error) => {
          this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 });
        }
      });
  }

  saveSettings(): void {
    this.adminService.saveSettings(this.settingsForm.getRawValue()).subscribe({
      next: () => this.showTopMessage('Settings saved.', 2600),
      error: (error) => this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 })
    });
  }

  openCreate(): void {
    if (this.activeTab() === 'inventory') {
      this.router.navigateByUrl('/admin/inventory/new');
      return;
    }
    this.showTopMessage(`Create action ready for ${this.activeTabLabel()}.`, 2200);
  }

  exportActive(): void {
    const tab = this.activeTab();
    const rows = tab === 'inventory'
      ? this.products()
      : tab === 'bookings'
        ? this.bookings()
        : tab === 'customers'
          ? this.customers()
          : tab === 'registrations'
            ? this.pendingCustomers
            : tab === 'payments'
              ? this.payments()
              : this.metrics();
    this.downloadCsv(`clickkaar-${tab}.csv`, rows);
  }

  bookedDays(productName: string): number {
    return this.bookings()
      .filter((booking) => booking.products.includes(productName) && booking.status !== 'Cancelled')
      .reduce((sum, booking) => sum + this.daysBetween(booking.startDate, booking.endDate), 0);
  }

  bookingOverlapsSelectedMonth(booking: AdminBooking): boolean {
    const selectedMonth = this.bookingMonthFilter();
    if (!selectedMonth) {
      return true;
    }

    const [year, month] = selectedMonth.split('-').map(Number);
    if (!year || !month) {
      return true;
    }

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    return bookingStart <= monthEnd && bookingEnd >= monthStart;
  }

  statusClass(status: string): string {
    if (['Available', 'Paid', 'Completed', 'Published', 'Current'].includes(status)) {
      return 'status-ok';
    }
    if (['Upcoming', 'Active', 'Pending', 'Draft', 'Needs review'].includes(status)) {
      return 'status-warn';
    }
    if (['Unavailable', 'Maintenance', 'Overdue', 'Failed', 'Refunded', 'Cancelled'].includes(status)) {
      return 'status-bad';
    }
    return 'status-info';
  }

  private mapProduct(product: AdminProductResponse): AdminProduct {
    const status = this.productStatusFromApi(product.availabilityStatus);
    const image = product.images?.[0] ?? '';
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: this.categoryFromApi(product.category),
      image,
      gallery: product.images?.length ? product.images : image ? [image] : [],
      description: product.fullDescription || product.shortDescription || '',
      specifications: this.parseSpecifications(product.specs ?? ''),
      dailyPrice: Number(product.dailyPrice),
      weeklyPrice: Number(product.weeklyPrice),
      warrantyDate: product.warrantyDate ?? '',
      invoiceUrl: product.invoiceUrl ?? '',
      available: status === 'Available',
      rating: 0,
      stock: status === 'Available' ? 1 : 0,
      popularity: 0,
      createdAt: '',
      status,
      maintenanceNote: status === 'Maintenance' ? 'Marked from admin panel' : ''
    };
  }

  private mapBooking(booking: AdminBookingResponse): AdminBooking {
    return {
      backendId: booking.id,
      id: booking.bookingNumber,
      customer: booking.customer,
      phone: booking.phone ?? '',
      products: booking.products,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: this.bookingStatusFromApi(booking.status),
      paymentStatus: this.paymentStatusFromApi(booking.paymentStatus),
      returnStatus: this.returnStatusFromApi(booking.returnStatus),
      total: Number(booking.total),
      notes: booking.notes?.join('\n') ?? ''
    };
  }

  private mapCustomer(customer: { id: number; name: string; email: string; phone?: string; verified: boolean; blocked: boolean; city?: string; wishlist: number; activeBookings: number; pastBookings: number }): AdminCustomer {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? '',
      verified: customer.verified,
      blocked: customer.blocked,
      city: customer.city ?? '',
      wishlist: customer.wishlist,
      activeBookings: customer.activeBookings,
      pastBookings: customer.pastBookings
    };
  }

  private mapPayment(payment: AdminPaymentResponse): AdminPayment {
    return {
      backendId: payment.id,
      id: String(payment.id),
      bookingId: payment.bookingId,
      customer: payment.customer,
      gateway: payment.gateway,
      mode: this.paymentModeFromApi(payment.mode),
      status: this.paymentStatusFromApi(payment.status),
      amount: Number(payment.amount),
      paidAt: payment.paidAt,
      remark: payment.remark ?? '',
      remarkChangeCount: payment.remarkChangeCount ?? 0
    };
  }

  private mapPaymentRemarkLog(log: PaymentRemarkLogResponse): PaymentRemarkLogView {
    return {
      id: log.id,
      oldRemark: log.oldRemark ?? '',
      newRemark: log.newRemark ?? '',
      changedBy: log.changedBy ?? '',
      changedAt: log.changedAt
    };
  }

  private applyContent(content: AdminContentResponse): void {
    this.blogPosts.set(content.blogPosts.map((post) => ({
      id: post.id,
      title: post.title,
      category: post.category ?? '',
      author: post.author ?? '',
      status: post.status === 'PUBLISHED' ? 'Published' : 'Draft',
      publishDate: post.publishDate ?? '',
      seoTitle: post.seoTitle ?? '',
      metaDescription: post.metaDescription ?? ''
    })));
    this.staticContent.set(content.staticContent.map((item) => ({
      key: item.key,
      title: item.title,
      owner: 'Admin',
      status: item.status === 'CURRENT' ? 'Current' : 'Needs review',
      updatedAt: item.updatedAt
    })));
    this.clampAdminPages();
    this.updateTabCount('content', String(content.blogPosts.length + content.staticContent.length));
  }

  private productRequestFromForm(): AdminProductRequest {
    const value = this.productForm.getRawValue();
    return {
      name: value.name,
      brand: value.brand,
      category: this.categoryToApi(value.category),
      shortDescription: value.description,
      fullDescription: value.description,
      specs: value.specifications,
      dailyPrice: value.dailyPrice,
      weeklyPrice: value.weeklyPrice,
      warrantyDate: value.warrantyDate || undefined,
      invoiceUrl: value.invoiceUrl || undefined,
      availabilityStatus: this.productStatusToApi(value.status),
      images: value.image ? [value.image] : []
    };
  }

  private categoryFromApi(category: string): string {
    const labels: Record<string, string> = {
      CAMERAS: 'Cameras',
      LENSES: 'Lenses',
      LIGHTING: 'Lighting',
      AUDIO: 'Audio Equipment',
      TRIPODS_SUPPORT: 'Tripods',
      ACCESSORIES: 'Accessories'
    };
    return labels[category] ?? category;
  }

  private categoryToApi(category: string): string {
    const labels: Record<string, string> = {
      Cameras: 'CAMERAS',
      Lenses: 'LENSES',
      Lighting: 'LIGHTING',
      'Audio Equipment': 'AUDIO',
      Audio: 'AUDIO',
      Tripods: 'TRIPODS_SUPPORT',
      Accessories: 'ACCESSORIES'
    };
    return labels[category] ?? category.trim().toUpperCase().replace(/\s+/g, '_');
  }

  private productStatusFromApi(status: string): ProductStatus {
    if (status === 'MAINTENANCE') return 'Maintenance';
    if (status === 'AVAILABLE') return 'Available';
    return 'Unavailable';
  }

  private productStatusToApi(status: ProductStatus): string {
    if (status === 'Maintenance') return 'MAINTENANCE';
    if (status === 'Available') return 'AVAILABLE';
    return 'UNAVAILABLE';
  }

  private bookingStatusFromApi(status: string): BookingStatus {
    const labels: Record<string, BookingStatus> = {
      PENDING: 'Upcoming',
      CONFIRMED: 'Upcoming',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      OVERDUE: 'Overdue'
    };
    return labels[status] ?? 'Upcoming';
  }

  private bookingStatusToApi(status: BookingStatus): string {
    const labels: Record<BookingStatus, string> = {
      Upcoming: 'CONFIRMED',
      Active: 'ACTIVE',
      Completed: 'COMPLETED',
      Cancelled: 'CANCELLED',
      Overdue: 'OVERDUE'
    };
    return labels[status];
  }

  private paymentStatusFromApi(status: string): PaymentStatus {
    const labels: Record<string, PaymentStatus> = {
      PAID: 'Paid',
      PENDING: 'Pending',
      FAILED: 'Failed',
      REFUNDED: 'Refunded'
    };
    return labels[status] ?? 'Pending';
  }

  private paymentModeFromApi(mode: string): 'Full payment' | 'Security deposit' {
    return mode === 'SECURITY_DEPOSIT' ? 'Security deposit' : 'Full payment';
  }

  private returnStatusFromApi(status: string): 'Not due' | 'Due today' | 'Returned' | 'Late' {
    const labels: Record<string, 'Not due' | 'Due today' | 'Returned' | 'Late'> = {
      NOT_DUE: 'Not due',
      DUE_TODAY: 'Due today',
      RETURNED: 'Returned',
      LATE: 'Late'
    };
    return labels[status] ?? 'Not due';
  }

  private parseSpecifications(value: string): Record<string, string> {
    return value.split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((specs, item) => {
        const [key, ...rest] = item.split(':');
        if (key && rest.length) {
          specs[key.trim()] = rest.join(':').trim();
        }
        return specs;
      }, {});
  }

  private daysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return Math.max(1, Math.round((end - start) / 86400000) + 1);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', { currency: 'INR', maximumFractionDigits: 0, style: 'currency' }).format(value);
  }

  private loadDocumentPreviews(customer: CustomerVerificationResponse): void {
    this.clearDocumentPreviews();
    this.documentPreviewError = '';
    this.isLoadingDocuments = customer.documents.length > 0;

    if (!customer.documents.length) {
      return;
    }

    let completed = 0;
    const markComplete = () => {
      completed += 1;
      if (completed === customer.documents.length && this.selectedPendingCustomer?.requestId === customer.requestId) {
        this.isLoadingDocuments = false;
      }
    };
    customer.documents.forEach((document) => {
      this.adminService.getPendingCustomerDocument(customer.requestId, document.type).subscribe({
        next: (blob) => {
          if (this.selectedPendingCustomer?.requestId !== customer.requestId) {
            return;
          }
          this.documentPreviews = {
            ...this.documentPreviews,
            [document.type]: this.createDocumentPreview(document, blob)
          };
        },
        error: (error) => {
          if (this.selectedPendingCustomer?.requestId === customer.requestId) {
            this.documentPreviewError = this.authService.getErrorMessage(error);
          }
          markComplete();
        },
        complete: () => {
          markComplete();
        }
      });
    });
  }

  private createDocumentPreview(document: RegistrationDocumentResponse, blob: Blob): DocumentPreview {
    return {
      label: document.label,
      fileName: document.fileName,
      url: URL.createObjectURL(blob),
      isImage: blob.type.startsWith('image/')
    };
  }

  imagePreviews(): DocumentPreview[] {
    return Object.values(this.documentPreviews).filter((preview) => preview.isImage);
  }

  activeDocumentIndex(): number {
    const previews = this.imagePreviews();
    const index = previews.findIndex((preview) => preview.url === this.activeDocumentPreview?.url);
    return index >= 0 ? index : 0;
  }

  private showDocumentPreviewAt(index: number): void {
    const previews = this.imagePreviews();
    if (!previews.length) {
      return;
    }

    const nextIndex = (index + previews.length) % previews.length;
    this.activeDocumentPreview = previews[nextIndex];
  }

  private clearDocumentPreviews(): void {
    this.activeDocumentPreview = undefined;
    Object.values(this.documentPreviews).forEach((preview) => URL.revokeObjectURL(preview.url));
    this.documentPreviews = {};
    this.documentPreviewError = '';
    this.isLoadingDocuments = false;
  }

  private downloadCsv(filename: string, rows: unknown[]): void {
    if (!rows.length) {
      this.showTopMessage('No rows available to export.', 2200);
      return;
    }

    const records = rows as Record<string, unknown>[];
    const headers = Object.keys(records[0]);
    const csvRows = [
      headers.join(','),
      ...records.map((row) => headers.map((header) => this.csvCell(row[header])).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private csvCell(value: unknown): string {
    const text = Array.isArray(value) ? value.join('|') : typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  private updateTabCount(id: AdminTab, count: string): void {
    const tab = this.tabs.find((item) => item.id === id);
    if (tab) {
      tab.count = count;
    }
  }

  private paginate<T>(items: T[], page: number): T[] {
    const safePage = Math.min(this.pageCount(items.length), Math.max(1, page));
    const start = (safePage - 1) * this.adminPageSize;
    return items.slice(start, start + this.adminPageSize);
  }

  private nextPage(currentPage: number, total: number, direction: number): number {
    return Math.min(this.pageCount(total), Math.max(1, currentPage + direction));
  }

  private clampAdminPages(): void {
    this.inventoryPage = Math.min(this.pageCount(this.filteredProducts().length), Math.max(1, this.inventoryPage));
    this.bookingsPage = Math.min(this.pageCount(this.filteredBookings().length), Math.max(1, this.bookingsPage));
    this.customersPage = Math.min(this.pageCount(this.filteredCustomers().length), Math.max(1, this.customersPage));
    this.paymentsPage = Math.min(this.pageCount(this.payments().length), Math.max(1, this.paymentsPage));
    this.blogPage = Math.min(this.pageCount(this.blogPosts().length), Math.max(1, this.blogPage));
    this.staticContentPage = Math.min(this.pageCount(this.staticContent().length), Math.max(1, this.staticContentPage));
  }

  private showTopMessage(message: string, duration: number): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-success-top']
    });
  }
}
