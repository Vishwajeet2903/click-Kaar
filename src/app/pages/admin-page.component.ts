import { CurrencyPipe, DatePipe, PercentPipe, formatDate } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Product } from '../models/product.model';
import {
  AdminBookingResponse,
  AdminBlogPostResponse,
  AdminCouponResponse,
  AdminContentResponse,
  AdminCustomerDetailResponse,
  AdminPaymentResponse,
  AdminProductRequest,
  AdminProductResponse,
  AdminReviewResponse,
  ProductImportResponse,
  AdminService,
  CustomerVerificationResponse,
  EmployeeResponse,
  PaymentRemarkLogResponse,
  RegistrationDocumentResponse
} from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { GalleryImage, GalleryService } from '../services/gallery.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

type AdminTab = 'dashboard' | 'registrations' | 'inventory' | 'bookings' | 'movement' | 'customers' | 'payments' | 'coupons' | 'content' | 'reviews' | 'reports' | 'employees' | 'roles' | 'settings';
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
  imageLabel: string;
  imageLoadFailed: boolean;
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
  noteLog: string[];
  deliveryOtpVerified: boolean;
}

interface AdminCustomer {
  id: number;
  customerNumber: string;
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

interface AdminCoupon {
  id: number;
  code: string;
  discountPercent: number;
  active: boolean;
  usageLimit?: number | null;
  usedCount: number;
  validUntil?: string | null;
  createdAt: string;
}

interface AdminReview {
  id: number;
  name: string;
  role: string;
  rating: number;
  quote: string;
  adminReply: string;
  createdAt: string;
}

interface AdminGalleryImage {
  id: number;
  imageUrl: string;
  altText: string;
  wide: boolean;
  tall: boolean;
  active: boolean;
  displayOrder: number;
  createdAt: string;
}

interface BlogPostAdmin {
  id: number;
  title: string;
  slug: string;
  coverImage: string;
  category: string;
  author: string;
  status: 'Draft' | 'Published';
  publishDate: string;
  tags: string;
  seoTitle: string;
  metaDescription: string;
  seoKeywords: string;
  content: string;
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

interface AdminConfirmDialog {
  title: string;
  message: string;
  actionLabel: string;
  tone: 'danger' | 'default';
  onConfirm: () => void;
}

interface AdminNoteDialog {
  booking: AdminBooking;
  note: string;
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, PercentPipe, FormsModule, ReactiveFormsModule, RouterLink, MatSnackBarModule, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Admin" />
    <section class="container admin-page admin-shell">
      @if (authService.isAdmin()) {
        <div class="admin-layout">
          <aside class="admin-sidebar surface">
            <div>
              <p class="eyebrow">Admin panel</p>
              <h1>Click-Kaar Ops</h1>
            </div>
            <nav aria-label="Admin sections">
              @for (tab of tabs; track tab.id) {
                <button type="button" [class.active]="activeTab() === tab.id" (click)="selectAdminTab(tab.id)">
                  <span>{{ tab.label }}</span>
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
                @if (activeTab() === 'inventory') {
                  <button type="button" class="primary-btn" (click)="addProduct()">Add product</button>
                }
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
                      <button type="button" class="link-btn" (click)="selectAdminTab('bookings')">View all</button>
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

                  <section class="surface panel pending-dashboard-panel">
                    <div class="panel-head registration-queue-head">
                      <div>
                        <h3>Pending registrations</h3>
                        <span>{{ pendingCustomers.length }} waiting for review</span>
                      </div>
                      <button type="button" class="link-btn" (click)="selectAdminTab('registrations')">View requests</button>
                    </div>
                    @if (isLoadingPending) {
                      <div class="queue-state compact-state">
                        <p class="muted">Loading pending registrations...</p>
                      </div>
                    } @else if (pendingLoadError) {
                      <div class="queue-state compact-state">
                        <p class="error-text">{{ pendingLoadError }}</p>
                      </div>
                    } @else if (pendingCustomers.length) {
                      <div class="dense-list request-list dashboard-request-list">
                        @for (customer of pendingCustomers.slice(0, 4); track customer.requestId) {
                          <article>
                            <button type="button" class="request-summary" (click)="openPendingDetails(customer)">
                              <span class="request-avatar">{{ initials(customer.fullName) }}</span>
                              <span class="request-copy">
                                <strong>{{ customer.fullName }}</strong>
                                <span>{{ customer.email }}</span>
                                <small>{{ customer.mobile || 'Mobile not added' }} - {{ customer.city || 'City not added' }}</small>
                              </span>
                            </button>
                            <div class="request-meta">
                              <span class="status-chip">{{ customer.status }}</span>
                              <button type="button" class="mini-btn" (click)="openPendingDetails(customer)">Open</button>
                            </div>
                          </article>
                        }
                      </div>
                    } @else {
                      <div class="queue-state compact-state empty-queue">
                        <h3>All caught up</h3>
                        <p class="muted">No customer registrations are waiting for approval.</p>
                      </div>
                    }
                  </section>
                </div>
              }

              @case ('registrations') {
                <div class="split-grid registration-grid">
                  <section class="surface panel registration-queue">
                    <div class="panel-head registration-queue-head">
                      <div>
                        <h3>Pending registration requests</h3>
                        <span>{{ pendingCustomers.length }} waiting for review</span>
                      </div>
                      <button type="button" class="link-btn" (click)="loadPendingCustomers()">Refresh</button>
                    </div>
                    @if (isLoadingPending) {
                      <div class="queue-state">
                        <p class="muted">Loading pending registrations...</p>
                      </div>
                    } @else if (pendingLoadError) {
                      <div class="queue-state">
                        <p class="error-text">{{ pendingLoadError }}</p>
                      </div>
                    } @else if (pendingCustomers.length) {
                      <div class="dense-list request-list">
                        @for (customer of pendingPageItems(); track customer.requestId) {
                          <article [class.active]="selectedPendingCustomer?.requestId === customer.requestId">
                            <button type="button" class="request-summary" (click)="openPendingDetails(customer)">
                              <span class="request-avatar">{{ initials(customer.fullName) }}</span>
                              <span class="request-copy">
                                <strong>{{ customer.fullName }}</strong>
                                <span>{{ customer.email }}</span>
                                <small>{{ customer.mobile || 'Mobile not added' }} - {{ customer.city || 'City not added' }}{{ customer.state ? ', ' + customer.state : '' }}</small>
                              </span>
                            </button>
                            <div class="request-meta">
                              <span class="status-chip">{{ customer.status }}</span>
                              <button type="button" class="mini-btn" (click)="openPendingDetails(customer)">View</button>
                            </div>
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
                      <div class="queue-state empty-queue">
                        <h3>All caught up</h3>
                        <p class="muted">No customer registrations are waiting for approval.</p>
                      </div>
                    }
                  </section>

                  <section class="surface panel registration-detail">
                    @if (selectedPendingCustomer) {
                      <div class="panel-head">
                        <div>
                          <h3>{{ selectedPendingCustomer.fullName }}</h3>
                          <span>{{ selectedPendingCustomer.email }}{{ selectedPendingCustomer.mobile ? ' - ' + selectedPendingCustomer.mobile : '' }}</span>
                        </div>
                        <span class="detail-page-count">{{ selectedPendingCustomer.status }}</span>
                      </div>

                      <div class="detail-stepper" aria-label="Registration review pages">
                        <button type="button" [class.active]="registrationDetailPage === 1" (click)="setRegistrationDetailPage(1)">Personal</button>
                        <button type="button" [class.active]="registrationDetailPage === 2" (click)="setRegistrationDetailPage(2)">Address</button>
                        <button type="button" [class.active]="registrationDetailPage === 3" (click)="setRegistrationDetailPage(3)">Documents</button>
                      </div>

                      @if (registrationDetailPage === 1) {
                        <div class="detail-section">
                          <div class="detail-section-head">
                            <h4>Personal details</h4>
                            <span>Page {{ registrationDetailPage }} of 3</span>
                          </div>
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
                          <div class="detail-section-head">
                            <h4>Address & work</h4>
                            <span>Page {{ registrationDetailPage }} of 3</span>
                          </div>
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
                          <div class="detail-section-head">
                            <h4>Uploaded documents</h4>
                            <span>{{ selectedPendingCustomer.documents.length }} file{{ selectedPendingCustomer.documents.length === 1 ? '' : 's' }}</span>
                          </div>
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
                                        <button type="button" class="document-preview-btn" (click)="openDocumentPreview(documentPreviews[document.type], $event)">
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
                  <label class="sheet-import-control">
                    <input type="file" accept=".xlsx,.xls,.csv" (change)="selectInventoryImportFile($event)">
                    <span>{{ inventoryImportFileName || 'Choose Excel/CSV' }}</span>
                  </label>
                  <button type="button" class="primary-btn compact-primary" [disabled]="isImportingInventory || !selectedInventoryImportFile" (click)="importInventorySheet()">
                    {{ isImportingInventory ? 'Importing...' : 'Import products' }}
                  </button>
                </div>
                @if (inventoryImportMessage) {
                  <p class="success-text import-status-text">{{ inventoryImportMessage }}</p>
                }
                @if (inventoryImportError) {
                  <p class="error-text import-status-text">{{ inventoryImportError }}</p>
                }

                <div class="inventory-card-panel inventory-table-panel">
                  @for (product of pagedProducts(); track product.id) {
                    <article class="surface inventory-desktop-card">
                      <div class="inventory-desktop-media">
                        @if (product.image && !product.imageLoadFailed) {
                          <img [src]="product.image" [alt]="product.name" (error)="markProductImageFailed(product.id)">
                        } @else {
                          <span class="image-short-name">{{ product.imageLabel }}</span>
                        }
                      </div>
                      <div class="inventory-desktop-main">
                        <div class="inventory-desktop-title">
                          <div>
                            <span>Product</span>
                            <strong>{{ product.name }}</strong>
                            <small>{{ product.brand }} - {{ product.category }}</small>
                          </div>
                          <b class="status" [class]="statusClass(product.status)">{{ product.status }}</b>
                        </div>
                        <dl class="inventory-desktop-grid">
                          <div><dt>Price</dt><dd>{{ product.dailyPrice | currency:'INR':'symbol':'1.0-0' }} / day</dd></div>
                          <div><dt>Warranty</dt><dd>{{ product.warrantyDate ? (product.warrantyDate | date:'mediumDate') : '-' }}</dd></div>
                          <div><dt>Stock</dt><dd>{{ product.stock }}</dd></div>
                          <div><dt>Booked days</dt><dd>{{ bookedDays(product.name) }}</dd></div>
                          <div class="wide-detail"><dt>Invoice</dt><dd>@if (product.invoiceUrl) { <a class="table-link" [href]="product.invoiceUrl" target="_blank" rel="noreferrer">View invoice</a> } @else { - }</dd></div>
                        </dl>
                      </div>
                      <div class="inventory-desktop-actions">
                        <span>Actions</span>
                        <button type="button" class="mini-btn" (click)="editProduct(product)">Edit</button>
                        @if (product.status === 'Maintenance') {
                          <button type="button" class="return-btn" (click)="returnFromMaintenance(product)">Return</button>
                        } @else {
                          <button type="button" class="danger-btn" (click)="markMaintenance(product)">Maintenance</button>
                        }
                        <button type="button" class="danger-btn delete-btn" [disabled]="deletingProductId === product.id" (click)="deleteProduct(product)">
                          {{ deletingProductId === product.id ? 'Deleting...' : 'Delete' }}
                        </button>
                      </div>
                    </article>
                  } @empty {
                    <div class="surface empty-cell inventory-desktop-empty">No inventory matches those filters.</div>
                  }
                </div>
                <div class="inventory-mobile-list">
                  @for (product of pagedProducts(); track product.id) {
                    <article class="surface inventory-mobile-card" [class.active]="selectedInventoryProduct?.id === product.id" tabindex="0" role="button" [attr.aria-label]="'Open product ' + product.name" (click)="openInventoryProduct(product)" (keydown.enter)="openInventoryProduct(product)" (keydown.space)="$event.preventDefault(); openInventoryProduct(product)">
                      <div class="inventory-card-media">
                        @if (product.image && !product.imageLoadFailed) {
                          <img [src]="product.image" [alt]="product.name" (error)="markProductImageFailed(product.id)">
                        } @else {
                          <span class="image-short-name">{{ product.imageLabel }}</span>
                        }
                      </div>
                      <div class="inventory-card-copy">
                        <strong>{{ product.name }}</strong>
                        <span>{{ product.brand }} - {{ product.category }}</span>
                        <p>{{ product.dailyPrice | currency:'INR':'symbol':'1.0-0' }} / day</p>
                      </div>
                      <b class="status" [class]="statusClass(product.status)">{{ product.status }}</b>
                    </article>
                  } @empty {
                    <div class="surface empty-cell inventory-mobile-empty">No inventory matches those filters.</div>
                  }
                </div>

                @if (selectedInventoryProduct) {
                  <section #inventoryProductDetailPanel class="surface panel inventory-mobile-detail">
                    <div class="inventory-detail-head">
                      <div class="inventory-detail-media">
                        @if (selectedInventoryProduct.image && !selectedInventoryProduct.imageLoadFailed) {
                          <img [src]="selectedInventoryProduct.image" [alt]="selectedInventoryProduct.name" (error)="markProductImageFailed(selectedInventoryProduct.id)">
                        } @else {
                          <span class="image-short-name">{{ selectedInventoryProduct.imageLabel }}</span>
                        }
                      </div>
                      <div>
                        <p class="eyebrow">Product details</p>
                        <h3>{{ selectedInventoryProduct.name }}</h3>
                        <span>{{ selectedInventoryProduct.brand }} - {{ selectedInventoryProduct.category }}</span>
                      </div>
                    </div>
                    <dl class="inventory-detail-grid">
                      <div><dt>Daily price</dt><dd>{{ selectedInventoryProduct.dailyPrice | currency:'INR':'symbol':'1.0-0' }}</dd></div>
                      <div><dt>Weekly price</dt><dd>{{ selectedInventoryProduct.weeklyPrice | currency:'INR':'symbol':'1.0-0' }}</dd></div>
                      <div><dt>Stock</dt><dd>{{ selectedInventoryProduct.stock }}</dd></div>
                      <div><dt>Status</dt><dd><b class="status" [class]="statusClass(selectedInventoryProduct.status)">{{ selectedInventoryProduct.status }}</b></dd></div>
                      <div><dt>Booked days</dt><dd>{{ bookedDays(selectedInventoryProduct.name) }}</dd></div>
                      <div><dt>Warranty</dt><dd>{{ selectedInventoryProduct.warrantyDate ? (selectedInventoryProduct.warrantyDate | date:'mediumDate') : '-' }}</dd></div>
                      <div class="wide-detail"><dt>Invoice</dt><dd>@if (selectedInventoryProduct.invoiceUrl) { <a class="table-link" [href]="selectedInventoryProduct.invoiceUrl" target="_blank" rel="noreferrer">View invoice</a> } @else { - }</dd></div>
                    </dl>
                    <div class="inventory-detail-actions">
                      <button type="button" class="mini-btn" (click)="editProduct(selectedInventoryProduct)">Edit</button>
                      @if (selectedInventoryProduct.status === 'Maintenance') {
                        <button type="button" class="return-btn" (click)="returnFromMaintenance(selectedInventoryProduct)">Return</button>
                      } @else {
                        <button type="button" class="danger-btn" (click)="markMaintenance(selectedInventoryProduct)">Maintenance</button>
                      }
                      <button type="button" class="danger-btn delete-btn" [disabled]="deletingProductId === selectedInventoryProduct.id" (click)="deleteProduct(selectedInventoryProduct)">
                        {{ deletingProductId === selectedInventoryProduct.id ? 'Deleting...' : 'Delete' }}
                      </button>
                    </div>
                  </section>
                }
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
                <div class="booking-card-panel booking-table-panel">
                  @for (booking of pagedBookings(); track booking.id) {
                    <article class="surface booking-desktop-card">
                      <div class="booking-desktop-main">
                        <div class="booking-desktop-title">
                          <div>
                            <span>Booking</span>
                            <strong>{{ booking.id }}</strong>
                            <small>{{ booking.customer }}{{ booking.phone ? ' - ' + booking.phone : '' }}</small>
                          </div>
                          <div class="booking-desktop-statuses">
                            <b class="status" [class]="statusClass(booking.status)">{{ booking.status }}</b>
                            <b class="status" [class]="statusClass(booking.paymentStatus)">{{ booking.paymentStatus }}</b>
                          </div>
                        </div>
                        <p class="booking-desktop-products">{{ booking.products.join(', ') }}</p>
                        <dl class="booking-desktop-grid">
                          <div><dt>From date</dt><dd>{{ booking.startDate | date:'mediumDate' }}</dd></div>
                          <div><dt>To date</dt><dd>{{ booking.endDate | date:'mediumDate' }}</dd></div>
                          <div><dt>Total</dt><dd>{{ booking.total | currency:'INR':'symbol':'1.0-0' }}</dd></div>
                          <div><dt>Return</dt><dd>{{ booking.returnStatus }}</dd></div>
                        </dl>
                      </div>
                      <div class="booking-desktop-note">
                        <label>Note</label>
                        <div class="note-control">
                          <input
                            class="note-input"
                            aria-label="Booking note"
                            placeholder="Note"
                            [ngModel]="booking.notes"
                            [disabled]="isSavingBookingNote(booking.backendId)"
                            (ngModelChange)="updateBookingNoteDraft(booking, $event)"
                            (keydown.enter)="$event.preventDefault(); saveBookingNote(booking.backendId)">
                          <button type="button" class="mini-btn" [disabled]="isSavingBookingNote(booking.backendId)" (click)="saveBookingNote(booking.backendId)">
                            {{ isSavingBookingNote(booking.backendId) ? 'Saving...' : 'Save' }}
                          </button>
                        </div>
                        <button type="button" class="remark-log-btn" [disabled]="bookingNoteCount(booking) === 0" (click)="toggleBookingNoteLog(booking)">
                          View exact log ({{ bookingNoteCount(booking) }})
                        </button>
                      </div>
                    </article>
                    @if (activeNoteLogBooking?.backendId === booking.backendId) {
                      <div class="remark-log-inline booking-desktop-log">
                        <div class="remark-log-head">
                          <p class="eyebrow">Booking note log</p>
                          <h3>{{ booking.id }}</h3>
                          <span>{{ booking.customer }} - {{ bookingNoteCount(booking) }} changes</span>
                        </div>
                        @if (bookingNoteEntries(booking).length) {
                          <div class="remark-log-list">
                            @for (note of bookingNoteEntries(booking); track $index) {
                              <article>
                                <div>
                                  <strong>Note {{ $index + 1 }}</strong>
                                  <span>{{ booking.id }}</span>
                                </div>
                                <dl>
                                  <div><dt>Saved note</dt><dd>{{ note }}</dd></div>
                                </dl>
                              </article>
                            }
                          </div>
                        } @else {
                          <p class="muted">No saved note changes were found.</p>
                        }
                      </div>
                    }
                  } @empty {
                    <div class="surface empty-cell booking-desktop-empty">No bookings match those filters.</div>
                  }
                </div>
                <div class="booking-mobile-list">
                  @for (booking of pagedBookings(); track booking.id) {
                    <article class="surface booking-mobile-card" [class.open]="isBookingCardOpen(booking)" tabindex="0" role="button" [attr.aria-expanded]="isBookingCardOpen(booking)" [attr.aria-label]="'Open order ' + booking.id" (click)="toggleBookingCard(booking)" (keydown.enter)="toggleBookingCard(booking)" (keydown.space)="$event.preventDefault(); toggleBookingCard(booking)">
                      <div class="booking-card-top">
                        <div>
                          <strong>{{ booking.id }}</strong>
                          <span>{{ booking.customer }}</span>
                        </div>
                        <b class="status" [class]="statusClass(booking.status)">{{ booking.status }}</b>
                      </div>
                      <p>{{ booking.products.join(', ') }}</p>
                      <div class="booking-card-meta">
                        <span>{{ booking.startDate | date:'MMM d' }} - {{ booking.endDate | date:'MMM d' }}</span>
                        <strong>{{ booking.total | currency:'INR':'symbol':'1.0-0' }}</strong>
                      </div>
                      @if (isBookingCardOpen(booking)) {
                        <div class="booking-card-details" (click)="$event.stopPropagation()">
                          <dl>
                            <div><dt>Phone</dt><dd>{{ booking.phone || '-' }}</dd></div>
                            <div><dt>Payment</dt><dd><b class="status" [class]="statusClass(booking.paymentStatus)">{{ booking.paymentStatus }}</b></dd></div>
                            <div><dt>Return</dt><dd>{{ booking.returnStatus }}</dd></div>
                            <div><dt>Items</dt><dd>{{ booking.products.join(', ') }}</dd></div>
                          </dl>
                          <button type="button" class="ghost-mini" (click)="addNote(booking)">Note</button>
                        </div>
                      }
                    </article>
                  } @empty {
                    <div class="surface empty-cell booking-mobile-empty">No bookings match those filters.</div>
                  }
                </div>
                <div class="pagination-row">
                  <span>{{ pageSummary(filteredBookings().length, bookingsPage) }}</span>
                  <div>
                    <button type="button" class="ghost-mini" [disabled]="bookingsPage === 1" (click)="changePage('bookings', -1)">Previous</button>
                    <button type="button" class="mini-btn" [disabled]="bookingsPage === pageCount(filteredBookings().length)" (click)="changePage('bookings', 1)">Next</button>
                  </div>
                </div>
              }

              @case ('movement') {
                <div class="movement-grid">
                  <section class="surface panel movement-panel outward-panel">
                    <div class="panel-head">
                      <div>
                        <h3>Outward deliveries</h3>
                        <span>{{ outwardBookings().length }} booking{{ outwardBookings().length === 1 ? '' : 's' }} to release</span>
                      </div>
                    </div>
                    <div class="movement-list">
                      @for (booking of outwardBookings(); track booking.id) {
                        <button type="button" class="movement-card clickable-movement" [class.selected-movement]="selectedOutwardBooking?.id === booking.id" (click)="openOutwardDetails(booking)">
                          <div>
                            <strong>{{ booking.id }}</strong>
                            <span>{{ booking.customer }}{{ booking.phone ? ' - ' + booking.phone : '' }}</span>
                          </div>
                          <p>{{ booking.products.join(', ') }}</p>
                          <small>Deliver on {{ booking.startDate | date:'mediumDate' }} - {{ booking.paymentStatus }}</small>
                          <b class="status" [class]="statusClass(booking.status)">{{ booking.status }}</b>
                        </button>
                      } @empty {
                        <div class="empty-cell movement-empty">No outward deliveries are pending.</div>
                      }
                    </div>
                  </section>

                  <section class="surface panel movement-panel inward-panel">
                    <div class="panel-head">
                      <div>
                        <h3>Inward returns</h3>
                        <span>{{ inwardBookings().length }} rental{{ inwardBookings().length === 1 ? '' : 's' }} to collect</span>
                      </div>
                    </div>
                    <div class="movement-list">
                      @for (booking of inwardBookings(); track booking.id) {
                        <button type="button" class="movement-card clickable-movement" [class.selected-movement]="selectedOutwardBooking?.id === booking.id" (click)="openOutwardDetails(booking)">
                          <div>
                            <strong>{{ booking.id }}</strong>
                            <span>{{ booking.customer }}{{ booking.phone ? ' - ' + booking.phone : '' }}</span>
                          </div>
                          <p>{{ booking.products.join(', ') }}</p>
                          <small>Return by {{ booking.endDate | date:'mediumDate' }}</small>
                          <b class="status" [class]="statusClass(booking.returnStatus)">{{ booking.returnStatus }}</b>
                        </button>
                      } @empty {
                        <div class="empty-cell movement-empty">No equipment returns are pending.</div>
                      }
                    </div>
                  </section>

                  @if (selectedOutwardBooking) {
                    <section #outwardDetailPanel class="surface panel outward-detail-panel">
                      <div class="outward-detail-top">
                        <div>
                          <p class="eyebrow">Order details</p>
                          <h3>{{ selectedOutwardBooking.id }}</h3>
                        </div>
                        <b class="status payment-status" [class]="statusClass(selectedOutwardBooking.paymentStatus)">{{ selectedOutwardBooking.paymentStatus }}</b>
                      </div>
                      <dl class="outward-detail-grid">
                        <div><dt>Customer</dt><dd>{{ selectedOutwardBooking.customer }}</dd></div>
                        <div><dt>Phone</dt><dd>{{ selectedOutwardBooking.phone || '-' }}</dd></div>
                        <div><dt>Delivery date</dt><dd>{{ selectedOutwardBooking.startDate | date:'mediumDate' }}</dd></div>
                        <div><dt>Return date</dt><dd>{{ selectedOutwardBooking.endDate | date:'mediumDate' }}</dd></div>
                        <div><dt>Total</dt><dd>{{ selectedOutwardBooking.total | currency:'INR':'symbol':'1.0-0' }}</dd></div>
                        <div><dt>Booking status</dt><dd>{{ selectedOutwardBooking.status }}</dd></div>
                        <div><dt>Delivery OTP</dt><dd>{{ selectedOutwardBooking.deliveryOtpVerified ? 'Verified' : 'Pending verification' }}</dd></div>
                        <div class="wide-detail"><dt>Equipment</dt><dd>{{ selectedOutwardBooking.products.join(', ') }}</dd></div>
                      </dl>
                      <div class="otp-panel">
                        <label>Delivery OTP<input inputmode="numeric" maxlength="6" placeholder="Enter customer OTP" [ngModel]="deliveryOtpDraft" (ngModelChange)="deliveryOtpDraft = $event"></label>
                        <button type="button" class="primary-btn" [disabled]="selectedOutwardBooking.deliveryOtpVerified" (click)="confirmDeliveryOtp()">{{ selectedOutwardBooking.deliveryOtpVerified ? 'OTP verified' : 'Confirm OTP' }}</button>
                        <button type="button" class="ghost-mini" (click)="closeOutwardDetails()">Close</button>
                      </div>
                    </section>
                  }
                </div>
              }
              @case ('customers') {
                <div class="tool-row"><input class="search-input" placeholder="Search customer, email, city" [ngModel]="customerQuery()" (ngModelChange)="customerQuery.set($event); customersPage = 1"></div>
                <div class="split-grid customer-management-grid">
                  <section class="customer-list-panel">
                    <div class="card-grid customer-card-grid">
                      @for (customer of pagedCustomers(); track customer.id) {
                        <article class="surface customer-card clickable-customer" [class.blocked]="customer.blocked" [class.active-customer]="selectedCustomerDetail?.id === customer.id" tabindex="0" role="button" [attr.aria-label]="'Open details for ' + customer.name" (click)="openCustomerDetails(customer)" (keydown.enter)="openCustomerDetails(customer)" (keydown.space)="openCustomerDetails(customer)">
                          <div class="customer-card-head">
                            <div class="avatar">{{ customer.name.charAt(0) }}</div>
                            <div class="customer-card-info">
                              <h3>{{ customer.name }}</h3>
                              <p>{{ customer.email }} - {{ customer.phone || 'No phone added' }}</p>
                              <span>{{ customer.customerNumber }} - {{ customer.city || 'City not added' }}</span>
                            </div>
                          </div>
                          <dl>
                            <div><dt>Active</dt><dd>{{ customer.activeBookings }}</dd></div>
                            <div><dt>Past</dt><dd>{{ customer.pastBookings }}</dd></div>
                            <div><dt>Wishlist</dt><dd>{{ customer.wishlist }}</dd></div>
                          </dl>
                          <div class="customer-card-actions">
                            <button type="button" [class.danger-btn]="!customer.blocked" [class.mini-btn]="customer.blocked" (click)="$event.stopPropagation(); toggleCustomerBlock(customer)">
                              {{ customer.blocked ? 'Unblock customer' : 'Block customer' }}
                            </button>
                            <button type="button" class="danger-btn delete-btn" [disabled]="deletingCustomerId === customer.id" (click)="$event.stopPropagation(); deleteCustomer(customer)">
                              {{ deletingCustomerId === customer.id ? 'Deleting...' : 'Delete customer' }}
                            </button>
                          </div>
                        </article>
                      } @empty {
                        <div class="surface empty-cell customer-empty">No customers match this search.</div>
                      }
                    </div>
                    <div class="pagination-row">
                      <span>{{ pageSummary(filteredCustomers().length, customersPage) }}</span>
                      <div>
                        <button type="button" class="ghost-mini" [disabled]="customersPage === 1" (click)="changePage('customers', -1)">Previous</button>
                        <button type="button" class="mini-btn" [disabled]="customersPage === pageCount(filteredCustomers().length)" (click)="changePage('customers', 1)">Next</button>
                      </div>
                    </div>
                  </section>

                  <section #customerDetailPanel class="surface panel customer-detail-panel">
                    <div class="panel-head">
                      <div>
                        <h3>Customer details</h3>
                        <span>{{ selectedCustomerDetail ? selectedCustomerDetail.customerNumber + ' - ' + selectedCustomerDetail.email : 'Select a customer card' }}</span>
                      </div>
                      @if (selectedCustomerDetail) {
                        <b class="status" [class]="selectedCustomerDetail.blocked ? 'status-bad' : 'status-ok'">{{ selectedCustomerDetail.blocked ? 'Blocked' : 'Active' }}</b>
                      }
                    </div>

                    @if (loadingCustomerId) {
                      <p class="muted">Loading customer details...</p>
                    } @else if (selectedCustomerError) {
                      <p class="error-text">{{ selectedCustomerError }}</p>
                    } @else if (selectedCustomerDetail) {
                      <div class="customer-detail-profile">
                        <div class="customer-detail-avatar">{{ initials(selectedCustomerDetail.name) }}</div>
                        <div>
                          <h3>{{ selectedCustomerDetail.name }}</h3>
                          <p>{{ selectedCustomerDetail.customerNumber }} - {{ selectedCustomerDetail.email }}</p>
                          <span>{{ selectedCustomerDetail.phone || 'No phone added' }}</span>
                        </div>
                      </div>

                      <dl class="customer-detail-grid">
                        <div><dt>First name</dt><dd>{{ selectedCustomerDetail.firstName || '-' }}</dd></div>
                        <div><dt>Last name</dt><dd>{{ selectedCustomerDetail.lastName || '-' }}</dd></div>
                        <div><dt>Gender</dt><dd>{{ selectedCustomerDetail.gender || '-' }}</dd></div>
                        <div><dt>Date of birth</dt><dd>{{ selectedCustomerDetail.dob || '-' }}</dd></div>
                        <div><dt>Alternate contact</dt><dd>{{ selectedCustomerDetail.alternateContactNumber || '-' }}</dd></div>
                        <div><dt>Residence type</dt><dd>{{ selectedCustomerDetail.residenceType || '-' }}</dd></div>
                        <div class="wide-detail"><dt>Address</dt><dd>{{ selectedCustomerDetail.currentAddress || '-' }}</dd></div>
                        <div><dt>City</dt><dd>{{ selectedCustomerDetail.city || '-' }}</dd></div>
                        <div><dt>State</dt><dd>{{ selectedCustomerDetail.state || '-' }}</dd></div>
                        <div><dt>Pincode</dt><dd>{{ selectedCustomerDetail.pincode || '-' }}</dd></div>
                        <div><dt>Country</dt><dd>{{ selectedCustomerDetail.country || '-' }}</dd></div>
                        <div><dt>Occupation</dt><dd>{{ selectedCustomerDetail.occupation || '-' }}</dd></div>
                        <div><dt>Company</dt><dd>{{ selectedCustomerDetail.companyName || '-' }}</dd></div>
                        <div class="wide-detail"><dt>Social profile</dt><dd>{{ selectedCustomerDetail.socialMediaProfile || '-' }}</dd></div>
                        <div><dt>Active bookings</dt><dd>{{ selectedCustomerDetail.activeBookings }}</dd></div>
                        <div><dt>Past bookings</dt><dd>{{ selectedCustomerDetail.pastBookings }}</dd></div>
                        <div><dt>Wishlist</dt><dd>{{ selectedCustomerDetail.wishlist }}</dd></div>
                      </dl>

                      <div class="detail-section customer-document-section">
                        <div class="detail-section-head">
                          <h4>Uploaded documents</h4>
                          <span>{{ selectedCustomerDetail.documents.length }} file{{ selectedCustomerDetail.documents.length === 1 ? '' : 's' }}</span>
                        </div>
                        @if (documentPreviewError) {
                          <p class="error-text">{{ documentPreviewError }}</p>
                        }
                        @if (selectedCustomerDetail.documents.length) {
                          <div class="document-grid customer-document-grid">
                            @for (document of selectedCustomerDetail.documents; track document.type) {
                              <article>
                                <div class="document-frame">
                                  @if (documentPreviews[document.type]) {
                                    @if (documentPreviews[document.type].isImage) {
                                      <button type="button" class="document-preview-btn" (click)="openDocumentPreview(documentPreviews[document.type], $event)">
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
                          <p class="muted">No documents are stored for this customer.</p>
                        }
                      </div>
                    } @else {
                      <div class="empty-detail">
                        <h3>Select a customer</h3>
                        <p class="muted">Open a customer card to view profile details and uploaded verification documents.</p>
                      </div>
                    }
                  </section>
                </div>
              }
              @case ('payments') {
                <div class="payments-card-panel payments-table-panel">
                  @for (payment of pagedPayments(); track payment.id) {
                    <article class="surface payment-desktop-card">
                      <div class="payment-desktop-main">
                        <div class="payment-desktop-title">
                          <div>
                            <span>Transaction</span>
                            <strong>{{ payment.id }}</strong>
                            <small>{{ payment.paidAt | date:'mediumDate' }}</small>
                          </div>
                          <b class="status" [class]="statusClass(payment.status)">{{ payment.status }}</b>
                        </div>
                        <dl class="payment-desktop-grid">
                          <div><dt>Booking</dt><dd>{{ payment.bookingId }}</dd></div>
                          <div><dt>Customer</dt><dd>{{ payment.customer }}</dd></div>
                          <div><dt>Gateway</dt><dd>{{ payment.gateway }}</dd></div>
                          <div><dt>Policy</dt><dd>{{ payment.mode }}</dd></div>
                          <div><dt>Amount</dt><dd>{{ payment.amount | currency:'INR':'symbol':'1.0-0' }}</dd></div>
                        </dl>
                      </div>
                      <div class="payment-desktop-remark">
                        <label>Remark</label>
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
                      </div>
                    </article>
                    @if (activeRemarkLogPayment?.backendId === payment.backendId) {
                      <div class="remark-log-inline payment-desktop-log">
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
                    }
                  } @empty {
                    <div class="surface empty-cell payments-desktop-empty">No payments are available.</div>
                  }
                </div>
                <div class="payments-mobile-list">
                  @for (payment of pagedPayments(); track payment.id) {
                    <article class="surface payment-mobile-card" [class.active]="selectedPaymentDetail?.backendId === payment.backendId" tabindex="0" role="button" [attr.aria-label]="'Open payment ' + payment.id" (click)="openPaymentDetail(payment)" (keydown.enter)="openPaymentDetail(payment)" (keydown.space)="$event.preventDefault(); openPaymentDetail(payment)">
                      <div class="payment-card-top">
                        <div>
                          <strong>{{ payment.id }}</strong>
                          <span>{{ payment.bookingId }} - {{ payment.customer }}</span>
                        </div>
                        <b class="status" [class]="statusClass(payment.status)">{{ payment.status }}</b>
                      </div>
                      <div class="payment-card-meta">
                        <span>{{ payment.gateway }} - {{ payment.mode }}</span>
                        <strong>{{ payment.amount | currency:'INR':'symbol':'1.0-0' }}</strong>
                      </div>
                      <small>{{ payment.paidAt | date:'mediumDate' }}</small>
                    </article>
                  } @empty {
                    <div class="surface empty-cell payments-mobile-empty">No payments are available.</div>
                  }
                </div>

                @if (selectedPaymentDetail) {
                  <section #paymentDetailPanel class="surface panel payment-mobile-detail">
                    <div class="payment-detail-head">
                      <div>
                        <p class="eyebrow">Payment details</p>
                        <h3>{{ selectedPaymentDetail.id }}</h3>
                        <span>{{ selectedPaymentDetail.bookingId }} - {{ selectedPaymentDetail.customer }}</span>
                      </div>
                      <b class="status payment-status" [class]="statusClass(selectedPaymentDetail.status)">{{ selectedPaymentDetail.status }}</b>
                    </div>
                    <dl class="payment-detail-grid">
                      <div><dt>Gateway</dt><dd>{{ selectedPaymentDetail.gateway }}</dd></div>
                      <div><dt>Policy</dt><dd>{{ selectedPaymentDetail.mode }}</dd></div>
                      <div><dt>Amount</dt><dd>{{ selectedPaymentDetail.amount | currency:'INR':'symbol':'1.0-0' }}</dd></div>
                      <div><dt>Paid at</dt><dd>{{ selectedPaymentDetail.paidAt | date:'mediumDate' }}</dd></div>
                    </dl>
                    <div class="payment-detail-remark">
                      <label>Remark
                        <input
                          class="remark-input"
                          placeholder="Remark"
                          [ngModel]="selectedPaymentDetail.remark"
                          [disabled]="isSavingPaymentRemark(selectedPaymentDetail.backendId)"
                          (ngModelChange)="updatePaymentRemarkDraft(selectedPaymentDetail, $event)"
                          (keydown.enter)="$event.preventDefault(); savePaymentRemark(selectedPaymentDetail.backendId)">
                      </label>
                      <button type="button" class="mini-btn" [disabled]="isSavingPaymentRemark(selectedPaymentDetail.backendId)" (click)="savePaymentRemark(selectedPaymentDetail.backendId)">
                        {{ isSavingPaymentRemark(selectedPaymentDetail.backendId) ? 'Saving...' : 'Save remark' }}
                      </button>
                      <button type="button" class="remark-log-btn" [disabled]="selectedPaymentDetail.remarkChangeCount === 0" (click)="togglePaymentRemarkLog(selectedPaymentDetail)">
                        View exact log ({{ selectedPaymentDetail.remarkChangeCount }})
                      </button>
                    </div>
                    @if (activeRemarkLogPayment?.backendId === selectedPaymentDetail.backendId) {
                      <div class="remark-log-inline payment-mobile-log">
                        <div class="remark-log-head">
                          <p class="eyebrow">Payment remark log</p>
                          <h3>{{ selectedPaymentDetail.bookingId }}</h3>
                          <span>{{ selectedPaymentDetail.customer }} - {{ selectedPaymentDetail.remarkChangeCount }} changes</span>
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
                    }
                  </section>
                }
                <div class="pagination-row">
                  <span>{{ pageSummary(payments().length, paymentsPage) }}</span>
                  <div>
                    <button type="button" class="ghost-mini" [disabled]="paymentsPage === 1" (click)="changePage('payments', -1)">Previous</button>
                    <button type="button" class="mini-btn" [disabled]="paymentsPage === pageCount(payments().length)" (click)="changePage('payments', 1)">Next</button>
                  </div>
                </div>
              }

              @case ('coupons') {
                <div class="split-grid">
                  <form class="surface editor-panel" [formGroup]="couponForm" (ngSubmit)="submitCoupon()">
                    <div class="panel-head"><h3>Create coupon</h3><span>Discount percent</span></div>
                    @if (couponFormError) {
                      <p class="form-alert" role="alert">{{ couponFormError }}</p>
                    }
                    <div class="form-grid coupon-form-grid">
                      <label>Coupon code<input formControlName="code" placeholder="WELCOME10" (input)="normalizeCouponInput()"></label>
                      <label>Discount percent<input type="number" min="1" max="100" formControlName="discountPercent"></label>
                      <label>Usage limit<input type="number" min="1" formControlName="usageLimit" placeholder="Unlimited"></label>
                      <label>Valid until<input type="date" formControlName="validUntil"></label>
                      <label class="checkbox-label"><input type="checkbox" formControlName="active"> Active coupon</label>
                    </div>
                    <button type="submit" class="primary-btn coupon-submit-btn" [disabled]="isSubmittingCoupon">{{ isSubmittingCoupon ? 'Creating...' : 'Create' }}</button>
                  </form>

                  <section class="surface panel">
                    <div class="panel-head">
                      <h3>Coupon codes</h3>
                      <button type="button" class="link-btn" (click)="loadCoupons()">Refresh</button>
                    </div>
                    <div class="dense-list coupon-list">
                      @for (coupon of pagedCoupons(); track coupon.id; let index = $index) {
                        <article [class.inactive]="!coupon.active" [style.--motion-index]="index">
                          <div class="coupon-field">
                            <small>Coupon code</small>
                            <strong>{{ coupon.code }}</strong>
                          </div>
                          <div class="coupon-field">
                            <small>Discount</small>
                            <span>{{ coupon.discountPercent }}%</span>
                          </div>
                          <div class="coupon-field">
                            <small>Usage</small>
                            <span>{{ couponUsageLabel(coupon) }}</span>
                          </div>
                          <div class="coupon-field">
                            <small>Valid until</small>
                            <span>{{ couponExpiryLabel(coupon) }}</span>
                          </div>
                          <div class="coupon-field">
                            <small>Created</small>
                            <span>{{ coupon.createdAt | date:'mediumDate' }}</span>
                          </div>
                          <div class="row-actions coupon-actions">
                            <button
                              type="button"
                              class="coupon-status-btn"
                              [class.status-ok]="coupon.active"
                              [class.status-bad]="!coupon.active"
                              [disabled]="updatingCouponStatusId === coupon.id"
                              (click)="toggleCouponActive(coupon)"
                            >
                              {{ updatingCouponStatusId === coupon.id ? 'Saving...' : coupon.active ? 'Active' : 'Inactive' }}
                            </button>
                            <button type="button" class="danger-btn delete-btn" [disabled]="deletingCouponId === coupon.id" (click)="deleteCoupon(coupon)">
                              {{ deletingCouponId === coupon.id ? 'Deleting...' : 'Delete' }}
                            </button>
                          </div>
                        </article>
                      } @empty {
                        <p class="muted">No coupons have been created yet.</p>
                      }
                    </div>
                    <div class="pagination-row">
                      <span>{{ pageSummary(coupons().length, couponsPage) }}</span>
                      <div>
                        <button type="button" class="ghost-mini" [disabled]="couponsPage === 1" (click)="changePage('coupons', -1)">Previous</button>
                        <button type="button" class="mini-btn" [disabled]="couponsPage === pageCount(coupons().length)" (click)="changePage('coupons', 1)">Next</button>
                      </div>
                    </div>
                  </section>
                </div>
              }

              @case ('content') {
                <div class="content-switcher surface">
                  <button type="button" [class.active]="activeContentSection() === 'blog'" (click)="setAdminContentSection('blog')">Blog & SEO</button>
                  <button type="button" [class.active]="activeContentSection() === 'gallery'" (click)="setAdminContentSection('gallery')">Gallery</button>
                </div>

                @if (activeContentSection() === 'blog') {
                  <div class="split-grid">
                    <section class="surface panel blog-list-panel">
                      <div class="panel-head"><h3>Blog & SEO</h3><button type="button" class="mini-btn" (click)="startNewBlogPost()">New post</button></div>
                      <div class="dense-list blog-admin-list">
                        @for (post of pagedBlogPosts(); track post.id) {
                          <article class="clickable-review" [class.active]="editingBlogPostId === post.id" (click)="editBlogPost(post)" tabindex="0" role="button" [attr.aria-label]="'Edit blog post ' + post.title" (keydown.enter)="editBlogPost(post)" (keydown.space)="editBlogPost(post)">
                            <div>
                              <strong>{{ post.title }}</strong>
                              <span>{{ post.category }} - {{ post.author }} - {{ post.publishDate | date:'mediumDate' }}</span>
                            </div>
                            <b class="status" [class]="statusClass(post.status)">{{ post.status }}</b>
                          </article>
                        } @empty {
                          <p class="muted">No blog posts yet.</p>
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
                    <form class="surface panel blog-editor-form" [formGroup]="blogForm" (ngSubmit)="submitBlogPost()">
                      <div class="panel-head">
                        <h3>{{ editingBlogPostId ? 'Edit blog post' : 'Create blog post' }}</h3>
                        @if (editingBlogPostId) {
                          <button type="button" class="ghost-mini" (click)="startNewBlogPost()">Cancel edit</button>
                        }
                      </div>
                      @if (blogFormError) {
                        <p class="form-alert" role="alert">{{ blogFormError }}</p>
                      }
                      <div class="blog-form-grid">
                        <label>Title<input formControlName="title" placeholder="Blog title" (input)="syncBlogSlug()"></label>
                        <label>Slug<input formControlName="slug" placeholder="blog-post-slug"></label>
                        <label>Category<input formControlName="category" placeholder="Guides"></label>
                        <label>Author<input formControlName="authorName" placeholder="Clickkaar Team"></label>
                        <label>Publish date<input type="date" formControlName="publishDate"></label>
                        <label>Status<select formControlName="status"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>
                        <label class="wide-field file-field">Cover image<input type="file" accept="image/*" (change)="setBlogCoverImage($event)"><span>{{ blogCoverLabel() }}</span></label>
                        <label class="wide-field">Tags<input formControlName="tags" placeholder="camera, lighting, rentals"></label>
                        <label class="wide-field">SEO title<input formControlName="seoTitle" placeholder="Search title"></label>
                        <label class="wide-field">Meta description<textarea formControlName="seoDescription" rows="2" placeholder="Short SEO description"></textarea></label>
                        <label class="wide-field">SEO keywords<input formControlName="seoKeywords" placeholder="camera rental, pune"></label>
                        <label class="wide-field">Content<textarea formControlName="content" rows="7" placeholder="Write the blog content. Use a new line for each paragraph."></textarea></label>
                      </div>
                      <div class="blog-form-actions">
                        @if (editingBlogPostId) {
                          <button type="button" class="danger-btn delete-btn" [disabled]="isSubmittingBlog" (click)="deleteBlogPost()">Delete</button>
                        }
                        <button type="submit" class="primary-btn" [disabled]="isSubmittingBlog">{{ isSubmittingBlog ? 'Saving...' : editingBlogPostId ? 'Update post' : 'Create post' }}</button>
                      </div>
                    </form>
                  </div>
                }

                @if (activeContentSection() === 'gallery') {
                  <div class="split-grid content-gallery-grid">
                    <form class="surface panel gallery-form" [formGroup]="galleryForm" (ngSubmit)="submitGalleryImage()">
                    <h3 class="gallery-card-title">Add gallery image</h3>
                    @if (galleryFormError) {
                      <p class="form-alert" role="alert">{{ galleryFormError }}</p>
                    }
                    <div class="gallery-upload-flow">
                      <div class="gallery-image-field">
                        <span>Choose image</span>
                        <label class="gallery-upload-box" [class.has-preview]="galleryPreviewUrl">
                          <input type="file" accept="image/*" (change)="setGalleryFile($event)">
                          @if (galleryPreviewUrl) {
                            <img [src]="galleryPreviewUrl" [alt]="galleryForm.controls.altText.value || 'Selected gallery image preview'">
                          } @else {
                            <b>Choose image</b>
                            <small>JPG, PNG, or WebP up to 10MB</small>
                          }
                        </label>
                      </div>
                      <div class="gallery-upload-fields">
                        <label>Alt text<input formControlName="altText" placeholder="Describe the image"></label>
                        <label>Display order<input type="number" formControlName="displayOrder" min="1"></label>
                        <div class="gallery-toggle-row">
                          <label class="checkbox-label"><input type="checkbox" formControlName="wide"><span>Wide tile</span></label>
                          <label class="checkbox-label"><input type="checkbox" formControlName="tall"><span>Tall tile</span></label>
                          <label class="checkbox-label"><input type="checkbox" formControlName="active"><span>Show on site</span></label>
                        </div>
                        @if (galleryFileName) {
                          <div class="selected-file">
                            <span>{{ galleryFileName }}</span>
                            <button type="button" class="ghost-mini" (click)="clearGalleryFile()">Remove</button>
                          </div>
                        }
                        <button type="submit" class="primary-btn wide" [disabled]="isSubmittingGallery">{{ isSubmittingGallery ? 'Adding...' : 'Add image' }}</button>
                      </div>
                    </div>
                  </form>

                  <section class="surface panel">
                    <div class="panel-head">
                      <h3>Gallery images</h3>
                      <button type="button" class="link-btn" (click)="loadGalleryImages()">Refresh</button>
                    </div>
                    <div class="gallery-admin-grid">
                      @for (image of galleryImages(); track image.id) {
                        <article>
                          <img [src]="image.imageUrl" [alt]="image.altText">
                          <div>
                            <strong>{{ image.altText }}</strong>
                            <span>Order {{ image.displayOrder }} - {{ image.active ? 'Live' : 'Hidden' }}</span>
                          </div>
                          <button type="button" class="danger-btn delete-btn" (click)="deleteGalleryImage(image)">Delete</button>
                        </article>
                      } @empty {
                        <p class="muted">No gallery images have been added yet.</p>
                      }
                    </div>
                    </section>
                  </div>
                }
              }

              @case ('reviews') {
                <div class="tool-row inventory-filter-row">
                  <input class="search-input" placeholder="Search reviewer, role, quote" [ngModel]="reviewQuery()" (ngModelChange)="reviewQuery.set($event); reviewsPage = 1">
                  <select [ngModel]="reviewRatingFilter()" (ngModelChange)="reviewRatingFilter.set($event); reviewsPage = 1">
                    <option value="">All ratings</option>
                    <option value="5">5 stars</option>
                    <option value="4">4 stars</option>
                    <option value="3">3 stars</option>
                    <option value="2">2 stars</option>
                    <option value="1">1 star</option>
                  </select>
                </div>

                <div class="split-grid">
                  <section class="surface panel review-detail-panel">
                    <div class="panel-head">
                      <h3>Review details</h3>
                      <button type="button" class="link-btn" (click)="loadReviews()">Refresh</button>
                    </div>
                    @if (selectedReview) {
                      <div class="review-detail">
                        <div>
                          <span>Name</span>
                          <strong>{{ selectedReview.name }}</strong>
                        </div>
                        <div>
                          <span>Role</span>
                          <strong>{{ selectedReview.role }}</strong>
                        </div>
                        <div>
                          <span>Rating</span>
                          <strong>{{ selectedReview.rating }} stars</strong>
                        </div>
                        <div>
                          <span>Submitted</span>
                          <strong>{{ selectedReview.createdAt | date:'medium' }}</strong>
                        </div>
                        <p>{{ selectedReview.quote }}</p>
                        <div class="review-reply-editor">
                          <label>Reply to review<textarea id="reviewReplyEditor" [(ngModel)]="reviewReplyDraft" [ngModelOptions]="{ standalone: true }" rows="4" placeholder="Write an admin reply that will show under this review."></textarea></label>
                          <div class="row-actions">
                            <button type="button" class="mini-btn" [disabled]="isSavingReviewReply" (click)="saveReviewReply(selectedReview)">{{ isSavingReviewReply ? 'Saving...' : 'Save reply' }}</button>
                            <button type="button" class="ghost-mini" [disabled]="isSavingReviewReply || !reviewReplyDraft.trim()" (click)="clearReviewReply(selectedReview)">Clear reply</button>
                            <button type="button" class="danger-btn delete-btn" (click)="deleteReview(selectedReview)">Delete review</button>
                          </div>
                        </div>
                      </div>
                    } @else {
                      <p class="muted">Select a customer review to view the submitted details.</p>
                    }
                  </section>

                  <section class="surface panel">
                    <div class="panel-head">
                      <h3>Customer reviews</h3>
                      <button type="button" class="link-btn" (click)="loadReviews()">Refresh</button>
                    </div>
                    <div class="dense-list review-list">
                      @for (review of pagedReviews(); track review.id; let index = $index) {
                        <article class="clickable-review" [class.active]="selectedReview?.id === review.id" [style.--motion-index]="index" (click)="viewReview(review)" tabindex="0" role="button" [attr.aria-label]="'View review by ' + review.name" (keydown.enter)="viewReview(review)" (keydown.space)="viewReview(review)">
                          <div>
                            <strong>{{ review.name }}</strong>
                            <span>{{ review.role }} - {{ review.rating }} stars - {{ review.createdAt | date:'mediumDate' }}</span>
                            <small>{{ review.quote }}</small>
                            @if (review.adminReply) {
                              <small class="review-reply-preview">Reply: {{ review.adminReply }}</small>
                            }
                          </div>
                          <div class="row-actions">
                            <button type="button" class="mini-btn" (click)="$event.stopPropagation(); replyToReviewFromList(review)">Reply</button>
                            <button type="button" class="danger-btn delete-btn" (click)="$event.stopPropagation(); deleteReview(review)">Delete</button>
                          </div>
                        </article>
                      } @empty {
                        <p class="muted">No reviews match those filters.</p>
                      }
                    </div>
                    <div class="pagination-row">
                      <span>{{ pageSummary(filteredReviews().length, reviewsPage) }}</span>
                      <div>
                        <button type="button" class="ghost-mini" [disabled]="reviewsPage === 1" (click)="changePage('reviews', -1)">Previous</button>
                        <button type="button" class="mini-btn" [disabled]="reviewsPage === pageCount(filteredReviews().length)" (click)="changePage('reviews', 1)">Next</button>
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
                <section class="surface panel category-performance-panel">
                  <div class="panel-head">
                    <div>
                      <h3>Category performance</h3>
                      <span>Share of rental activity by category</span>
                    </div>
                  </div>
                  <div class="category-chart-list">
                    @for (item of categoryReports(); track item.name) {
                      <article class="category-chart-row">
                        <div class="category-chart-meta">
                          <span>{{ item.name }}</span>
                          <strong>{{ item.value }}%</strong>
                        </div>
                        <div class="category-chart-track" [attr.aria-label]="item.name + ' ' + item.value + '%'">
                          <b [style.width.%]="item.value"></b>
                        </div>
                      </article>
                    } @empty {
                      <p class="muted">No category performance data is available yet.</p>
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
              }

              @case ('employees') {
                @if (employeeView() === 'manage') {
                  <div class="metric-grid employee-metric-grid">
                    <article class="surface metric-card"><span>Total team</span><strong>{{ employees().length }}</strong><small>Admin and staff accounts</small></article>
                    <article class="surface metric-card"><span>Admins</span><strong>{{ employeeCountByRole('ADMIN') + employeeCountByRole('SUPER_ADMIN') }}</strong><small>Super admin and admin access</small></article>
                    <article class="surface metric-card green"><span>Managers</span><strong>{{ employeeCountByRole('MANAGER') }}</strong><small>Booking and customer operations</small></article>
                    <article class="surface metric-card orange"><span>Inventory</span><strong>{{ employeeCountByRole('INVENTORY_STAFF') }}</strong><small>Gear release and returns</small></article>
                    <article class="surface metric-card red"><span>Content</span><strong>{{ employeeCountByRole('CONTENT_EDITOR') }}</strong><small>Blog, gallery and reviews</small></article>
                  </div>

                  <section class="surface panel employee-roster-panel employee-full-panel">
                    <div class="panel-head employee-page-head">
                      <div>
                        <h3>Manage employees</h3>
                        <span>{{ filteredEmployees().length }} account{{ filteredEmployees().length === 1 ? '' : 's' }} found</span>
                      </div>
                      <div class="employee-head-actions">
                        <button type="button" class="link-btn" (click)="loadEmployees()">Refresh</button>
                        <button type="button" class="primary-btn compact-primary" (click)="employeeView.set('create'); employeeFormError = ''; createdEmployee = undefined">Create employee</button>
                      </div>
                    </div>
                    @if (createdEmployee) {
                      <p class="success-text">{{ createdEmployee.fullName }} created with {{ createdEmployee.roles.join(', ') }} access.</p>
                    }
                    <div class="tool-row employee-tool-row">
                      <input class="search-input" type="search" placeholder="Search team by name, email, mobile or role" [ngModel]="employeeQuery()" (ngModelChange)="employeeQuery.set($event); employeesPage = 1" [ngModelOptions]="{ standalone: true }">
                    </div>
                    <div class="employee-roster-list">
                      @for (employee of pagedEmployees(); track employee.userId) {
                        <article class="employee-card">
                          <div class="employee-avatar">{{ initials(employee.fullName) }}</div>
                          <div class="employee-card-copy">
                            <strong>{{ employee.fullName }}</strong>
                            <span>{{ employee.email }}</span>
                            <small>{{ employee.mobile || 'Mobile not added' }}</small>
                          </div>
                          <div class="employee-role-stack">
                            @for (role of employee.roles; track role) {
                              <span class="status-chip">{{ employeeRoleLabel(role) }}</span>
                            }
                          </div>
                          <div class="row-actions employee-actions">
                            <button type="button" class="danger-btn delete-btn employee-delete-btn" [disabled]="employee.roles.includes('SUPER_ADMIN') || (employee.roles.includes('ADMIN') && !authService.isSuperAdmin()) || deletingEmployeeId === employee.userId" (click)="deleteEmployee(employee)">
                              {{ deletingEmployeeId === employee.userId ? 'Deleting...' : 'Delete' }}
                            </button>
                          </div>
                        </article>
                      } @empty {
                        <div class="queue-state compact-state empty-queue">
                          <h3>No employees found</h3>
                          <p class="muted">Create a manager, inventory staff member, or content editor to start building the team roster.</p>
                        </div>
                      }
                    </div>
                    <div class="pagination-row">
                      <span>{{ employeesPageSummary() }}</span>
                      <div>
                        <button type="button" class="ghost-mini" [disabled]="employeesPage === 1" (click)="changeEmployeesPage(-1)">Previous</button>
                        <button type="button" class="mini-btn" [disabled]="employeesPage === employeesPageCount()" (click)="changeEmployeesPage(1)">Next</button>
                      </div>
                    </div>
                  </section>
                } @else {
                  <form class="surface employee-form employee-create-page" [formGroup]="employeeForm" (ngSubmit)="submitEmployee()">
                    <div class="panel-head employee-page-head">
                      <div>
                        <h3>Create employee</h3>
                        <span>{{ authService.isSuperAdmin() ? 'Admin, manager or staff access' : 'Manager or staff access' }}</span>
                      </div>
                      <button type="button" class="ghost-btn compact-primary" (click)="employeeView.set('manage'); employeeFormError = ''">Back to employees</button>
                    </div>
                    @if (employeeFormError) {
                      <p class="form-alert" role="alert">{{ employeeFormError }}</p>
                    }
                    <div class="form-grid employee-create-grid">
                      <label>Full name<input formControlName="fullName"></label>
                      <label>Email<input formControlName="email"></label>
                      <label>Mobile<input formControlName="mobile"></label>
                      <label>Dashboard role<select class="employee-role-select" formControlName="role">@if (authService.isSuperAdmin()) {<option value="ADMIN">Admin</option>}<option value="MANAGER">Manager</option><option value="INVENTORY_STAFF">Inventory Staff</option><option value="CONTENT_EDITOR">Content Editor</option></select></label>
                      <label>Temporary password<input type="password" formControlName="password"></label>
                    </div>
                    <div class="employee-form-actions">
                      <button type="button" class="ghost-btn" (click)="employeeView.set('manage'); employeeFormError = ''">Cancel</button>
                      <button type="submit" class="primary-btn" [disabled]="isSubmitting">{{ isSubmitting ? 'Creating...' : 'Create employee' }}</button>
                    </div>
                  </form>
                }
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
            @if (confirmDialog) {
              <div class="admin-confirm-backdrop" role="presentation" (click)="cancelConfirmDialog()">
                <section class="surface admin-confirm-dialog" role="dialog" aria-modal="true" [attr.aria-label]="confirmDialog.title" (click)="$event.stopPropagation()">
                  <div>
                    <p class="eyebrow">Confirm action</p>
                    <h3>{{ confirmDialog.title }}</h3>
                    <p>{{ confirmDialog.message }}</p>
                  </div>
                  <div class="admin-confirm-actions">
                    <button type="button" class="ghost-btn" (click)="cancelConfirmDialog()">Cancel</button>
                    <button type="button" [class.danger-btn]="confirmDialog.tone === 'danger'" [class.primary-btn]="confirmDialog.tone !== 'danger'" (click)="acceptConfirmDialog()">{{ confirmDialog.actionLabel }}</button>
                  </div>
                </section>
              </div>
            }
          </div>
        </div>
        @if (activeDocumentPreview) {
          <div class="document-lightbox" role="dialog" aria-modal="true" [attr.aria-label]="activeDocumentPreview.label" (click)="closeDocumentPreview()">
            <div class="document-lightbox-content" (click)="$event.stopPropagation()">
              <button type="button" class="lightbox-close" aria-label="Close image preview" (click)="closeDocumentPreview()">&times;</button>
              <div class="lightbox-image-row">
                <button type="button" class="lightbox-nav previous" aria-label="Previous image" [disabled]="imagePreviews().length < 2" (click)="showPreviousDocumentPreview()">&lsaquo;</button>
                <img [src]="activeDocumentPreview.url" [alt]="activeDocumentPreview.label">
                <button type="button" class="lightbox-nav next" aria-label="Next image" [disabled]="imagePreviews().length < 2" (click)="showNextDocumentPreview()">&rsaquo;</button>
              </div>
              <div class="lightbox-foot">
                <strong>{{ activeDocumentPreview.label }}</strong>
                <span>{{ activeDocumentIndex() + 1 }} / {{ imagePreviews().length }}</span>
              </div>
            </div>
          </div>
        }
        @if (noteDialog) {
          <div class="admin-confirm-backdrop" role="presentation" (click)="cancelNoteDialog()">
            <section class="surface admin-confirm-dialog" role="dialog" aria-modal="true" aria-label="Internal note" (click)="$event.stopPropagation()">
              <div>
                <p class="eyebrow">Internal note</p>
                <h3>{{ noteDialog.booking.id }}</h3>
                <textarea class="admin-note-editor" rows="4" [ngModel]="noteDialog.note" (ngModelChange)="noteDialog.note = $event"></textarea>
              </div>
              <div class="admin-confirm-actions">
                <button type="button" class="ghost-btn" (click)="cancelNoteDialog()">Cancel</button>
                <button type="button" class="primary-btn" (click)="saveNoteDialog()">Save note</button>
              </div>
            </section>
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
      --admin-bg: #ececec;
      --admin-panel: #ffffff;
      --admin-soft: #ffffff;
      --admin-line: rgba(17, 17, 17, .09);
      --admin-muted: #6f6f68;
      --admin-ink: #141414;
      --admin-accent: #ff9700;
    }
    :host ::ng-deep section.container.admin-shell { border-radius: 32px !important; overflow: hidden; }
    .admin-page { color: var(--admin-ink); max-width: 95vw !important; padding-bottom: 2rem; word-spacing: 0; }
    .admin-layout { align-items: start; display: grid; gap: 1.25rem; grid-template-columns: 240px minmax(0, 1fr); }
    .admin-page :where(.surface) { background: var(--admin-panel); border: 1px solid var(--admin-line); border-radius: 8px; box-shadow: 0 18px 45px rgba(17,17,17,.06); }
    .admin-sidebar { align-self: start; background: #ffffff !important; color: #111; padding: .9rem; position: static; }
    .admin-sidebar .eyebrow { color: #ff9700; letter-spacing: .14em; margin: 0 0 .35rem; word-spacing: -.04em; }
    .admin-sidebar h1 { color: #111; font-size: 1.28rem; font-weight: 600; letter-spacing: 0; line-height: 1.14; margin: 0 0 1rem; }
    nav { display: grid; gap: .25rem; }
    nav button { align-items: center; background: transparent; border: 1px solid transparent; border-radius: 6px; color: #555; display: flex; font-size: .9rem; font-weight: 800; justify-content: space-between; line-height: 1.25; min-height: 40px; padding: .62rem .7rem; text-align: left; }
    nav button.active, nav button.active:hover { background: var(--admin-accent); border-color: var(--admin-accent); color: #fff; }
    nav button:hover { background: #f6f6f4; border-color: #e6e6e0; color: #111; }
    .admin-workspace { display: grid; gap: 1.25rem; min-width: 0; position: relative; }
    .admin-topbar { align-items: end; background: #ffffff; border: 1px solid var(--admin-line); border-radius: 8px; display: flex; gap: 1.25rem; justify-content: space-between; padding: 1.15rem 1.2rem; }
    .admin-topbar .eyebrow { color: #ff9700; letter-spacing: .14em; margin: 0 0 .25rem; word-spacing: -.04em; }
    .admin-topbar h2 { font-size: clamp(1.08rem, 1.9vw, 1.65rem); font-weight: 600; letter-spacing: 0; line-height: 1.14; margin: 0; }
    .topbar-actions, .tool-row, .action-cell { align-items: center; display: flex; flex-wrap: wrap; gap: .55rem; }
    .inventory-action-cell { flex-wrap: nowrap; min-width: 178px; }
    .sheet-import-control { align-items: center; background: #fff; border: 1px solid rgba(17,17,17,.12); border-radius: 999px; box-shadow: 0 8px 22px rgba(0,0,0,.05); color: #111; cursor: pointer; display: inline-flex; font-size: .78rem; font-weight: 900; min-height: 42px; max-width: min(260px, 100%); overflow: hidden; padding: .56rem .9rem; }
    .sheet-import-control input { display: none; }
    .sheet-import-control span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .import-status-text { margin: -.45rem 0 .1rem; }
    .inventory-card-panel { display: grid; gap: .9rem; }
    .inventory-desktop-card { align-items: stretch; display: grid; gap: 1rem; grid-template-columns: 128px minmax(0, 1fr) 118px; padding: 1rem; }
    .inventory-desktop-media { align-items: center; aspect-ratio: 1; background: #f3f3ef; border: 1px solid rgba(17,17,17,.07); border-radius: 8px; display: flex; justify-content: center; overflow: hidden; width: 128px; }
    .inventory-desktop-media img { height: 100%; object-fit: cover; width: 100%; }
    .inventory-desktop-main { display: grid; gap: .78rem; min-width: 0; }
    .inventory-desktop-title { align-items: flex-start; border-bottom: 1px solid var(--admin-line); display: flex; gap: 1rem; justify-content: space-between; min-width: 0; padding-bottom: .76rem; }
    .inventory-desktop-title > div { display: grid; gap: .22rem; min-width: 0; }
    .inventory-desktop-title span, .inventory-desktop-actions span { color: #777; font-size: .68rem; font-weight: 950; line-height: 1.25; text-transform: uppercase; }
    .inventory-desktop-title strong { color: #111; font-size: 1.02rem; font-weight: 950; line-height: 1.22; overflow-wrap: anywhere; }
    .inventory-desktop-title small { color: #57534d; font-size: .82rem; font-weight: 850; line-height: 1.38; overflow-wrap: anywhere; }
    .inventory-desktop-grid { display: grid; gap: .62rem; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; }
    .inventory-desktop-grid div { background: #f8f8f6; border: 1px solid rgba(17,17,17,.07); border-radius: 6px; min-width: 0; padding: .66rem .7rem; }
    .inventory-desktop-grid dt { color: #777; font-size: .68rem; font-weight: 950; line-height: 1.25; text-transform: uppercase; }
    .inventory-desktop-grid dd { color: #111; font-size: .84rem; font-weight: 850; line-height: 1.38; margin: .22rem 0 0; overflow-wrap: anywhere; }
    .inventory-desktop-actions { align-content: start; background: #fffaf2; border: 1px solid rgba(255,151,0,.18); border-radius: 7px; display: grid; gap: .42rem; min-width: 0; padding: .62rem; }
    .inventory-desktop-actions button { font-size: .72rem; min-height: 30px; padding: .38rem .55rem; width: 100%; }
    .inventory-desktop-empty { padding: 1rem; }    .inventory-mobile-list, .inventory-mobile-detail { display: none; }
    .inventory-mobile-card { align-items: center; display: grid; gap: .75rem; grid-template-columns: 58px minmax(0, 1fr) auto; padding: .78rem; }
    .inventory-mobile-card.active { background: #fffaf2; border-color: rgba(255,151,0,.34); }
    .inventory-card-media, .inventory-detail-media { align-items: center; aspect-ratio: 1; background: #f3f3ef; border-radius: 6px; display: flex; justify-content: center; overflow: hidden; width: 58px; }
    .inventory-card-media img, .inventory-detail-media img { height: 100%; object-fit: cover; width: 100%; }
    .inventory-card-copy { display: grid; gap: .22rem; min-width: 0; }
    .inventory-card-copy strong, .inventory-card-copy span, .inventory-card-copy p { display: block; margin: 0; overflow-wrap: anywhere; }
    .inventory-card-copy strong { color: #111; font-size: .94rem; line-height: 1.25; }
    .inventory-card-copy span, .inventory-card-copy p { color: #666; font-size: .8rem; font-weight: 800; line-height: 1.35; }
    .inventory-detail-head { align-items: center; display: grid; gap: .8rem; grid-template-columns: 76px minmax(0, 1fr); }
    .inventory-detail-media { width: 76px; }
    .inventory-detail-head h3 { color: #111; font-size: 1.06rem; line-height: 1.24; margin: .12rem 0 .2rem; overflow-wrap: anywhere; }
    .inventory-detail-head span { color: #666; font-size: .84rem; font-weight: 800; line-height: 1.35; }
    .inventory-detail-grid { display: grid; gap: .58rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; }
    .inventory-detail-grid div { background: #f8f8f6; border: 1px solid rgba(17,17,17,.07); border-radius: 6px; min-width: 0; padding: .65rem; }
    .inventory-detail-grid dt { color: #777; font-size: .68rem; font-weight: 950; text-transform: uppercase; }
    .inventory-detail-grid dd { color: #111; font-size: .84rem; font-weight: 850; line-height: 1.35; margin: .22rem 0 0; overflow-wrap: anywhere; }
    .inventory-detail-actions { display: grid; gap: .55rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .inventory-detail-actions button { width: 100%; }
    .inventory-action-cell .mini-btn,
    .inventory-action-cell .danger-btn,
    .inventory-action-cell .return-btn { flex: 0 0 auto; }
    .movement-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .movement-panel { align-content: start; }
    .movement-list { display: grid; gap: .75rem; }
    .movement-card { background: #fff; border: 1px solid rgba(17,17,17,.09); border-radius: 8px; display: grid; gap: .65rem; min-width: 0; padding: 1rem 1rem 1rem .7rem; }
    .movement-card div { align-items: flex-start; display: flex; flex-direction: column; gap: .24rem; justify-content: flex-start; min-width: 0; text-align: left; width: 100%; }
    .movement-card strong { color: #111; font-weight: 950; line-height: 1.2; text-align: left; width: 100%; }
    .movement-card span, .movement-card small { color: #666; font-size: .82rem; font-weight: 850; line-height: 1.35; text-align: left; width: 100%; }
    .movement-card p { color: #333; font-size: .92rem; font-weight: 700; line-height: 1.45; margin: 0; overflow-wrap: anywhere; text-align: left; width: 100%; }
    .movement-card .status { justify-self: start; }
    .movement-empty { border: 1px dashed rgba(17,17,17,.14); border-radius: 8px; padding: 1rem; }
    .clickable-movement { cursor: pointer; text-align: left; width: 100%; }
    .clickable-movement:hover, .selected-movement { background: #fffaf2; border-color: rgba(255,151,0,.42); transform: translateY(-1px); }
    .outward-detail-panel { grid-column: 1 / -1; justify-items: stretch; padding-left: .8rem; text-align: left; }
    .outward-detail-top { align-items: center; border-bottom: 1px solid rgba(17,17,17,.08); display: flex; gap: 1rem; justify-content: space-between; padding-bottom: .85rem; }
    .outward-detail-top > div, .outward-detail-top h3, .outward-detail-top .eyebrow { min-width: 0; text-align: left; }
    .payment-status { font-size: .82rem; padding: .42rem .72rem; }
    .outward-detail-grid { display: grid; gap: .75rem; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 0; }
    .outward-detail-grid div { background: #f8f8f6; border: 1px solid rgba(17,17,17,.07); border-radius: 8px; justify-items: start; min-width: 0; padding: .8rem .8rem .8rem .65rem; text-align: left; }
    .outward-detail-grid dt { color: #777; font-size: .72rem; font-weight: 950; margin-bottom: .3rem; text-transform: uppercase; }
    .outward-detail-grid dd { color: #111; font-weight: 850; line-height: 1.35; margin: 0; overflow-wrap: anywhere; text-align: left; }
    .wide-detail { grid-column: 1 / -1; }
    .otp-panel { align-items: end; display: grid; gap: .75rem; grid-template-columns: minmax(180px, 1fr) auto auto; justify-items: start; text-align: left; }
    .otp-panel label { color: #111; font-size: .82rem; font-weight: 900; }
    .otp-panel input { background: #fff; border: 1px solid rgba(17,17,17,.14); border-radius: 8px; color: #111; display: block; font: inherit; font-weight: 700; min-height: 44px; margin-top: .45rem; padding: .65rem .8rem; width: 100%; }
    .booking-actions-heading { text-align: center; width: 96px; }
    td.booking-action-cell { display: table-cell; min-width: 96px; text-align: center; vertical-align: middle; white-space: nowrap; }
    .booking-action-cell .mini-btn,
    .booking-action-cell .ghost-mini { margin-inline: auto; min-width: 58px; }
    .tool-row { background: var(--admin-panel); border: 1px solid var(--admin-line); border-radius: 8px; justify-content: space-between; padding: .8rem; }
    .search-input { flex: 1 1 260px; }
    .inventory-filter-row { justify-content: flex-start; }
    .inventory-filter-row .search-input { flex: 0 1 320px; max-width: 320px; }
    .inventory-filter-row select { flex: 0 0 180px; width: 180px; }
    .booking-filter-row { justify-content: flex-start; }
    .booking-filter-row .search-input { flex: 0 1 320px; max-width: 320px; }
    .booking-filter-row select { flex: 0 0 190px; width: 190px; }
    .booking-filter-row .month-input { flex: 0 0 170px; width: 170px; }
    .booking-card-panel { display: grid; gap: .9rem; }
    .booking-desktop-card { align-items: stretch; display: grid; gap: 1rem; grid-template-columns: minmax(0, 1fr) minmax(280px, .44fr); padding: 1rem; }
    .booking-desktop-main { display: grid; gap: .78rem; min-width: 0; }
    .booking-desktop-title { align-items: flex-start; border-bottom: 1px solid var(--admin-line); display: flex; gap: 1rem; justify-content: space-between; min-width: 0; padding-bottom: .76rem; }
    .booking-desktop-title > div:first-child { display: grid; gap: .22rem; min-width: 0; }
    .booking-desktop-title span, .booking-desktop-note label { color: #777; font-size: .68rem; font-weight: 950; line-height: 1.25; text-transform: uppercase; }
    .booking-desktop-title strong { color: #111; font-size: 1.02rem; font-weight: 950; line-height: 1.22; overflow-wrap: anywhere; }
    .booking-desktop-title small { color: #57534d; font-size: .82rem; font-weight: 850; line-height: 1.38; overflow-wrap: anywhere; }
    .booking-desktop-statuses { align-items: flex-end; display: grid; flex: 0 0 auto; gap: .42rem; justify-items: end; }
    .booking-desktop-products { color: #333; font-size: .86rem; font-weight: 820; line-height: 1.45; margin: 0; overflow-wrap: anywhere; }
    .booking-desktop-grid { display: grid; gap: .62rem; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; }
    .booking-desktop-grid div { background: #f8f8f6; border: 1px solid rgba(17,17,17,.07); border-radius: 6px; min-width: 0; padding: .66rem .7rem; }
    .booking-desktop-grid dt { color: #777; font-size: .68rem; font-weight: 950; line-height: 1.25; text-transform: uppercase; }
    .booking-desktop-grid dd { color: #111; font-size: .84rem; font-weight: 850; line-height: 1.38; margin: .22rem 0 0; overflow-wrap: anywhere; }
    .booking-desktop-note { align-content: start; background: #fffaf2; border: 1px solid rgba(255,151,0,.18); border-radius: 7px; display: grid; gap: .58rem; min-width: 0; padding: .78rem; }
    .note-control { align-items: center; display: grid; gap: .48rem; grid-template-columns: minmax(0, 1fr) auto; }
    .note-input { font-size: .84rem; font-weight: 750; line-height: 1.35; min-height: 38px; min-width: 0; padding: .58rem .68rem; }
    .booking-desktop-log { background: #fff7ec; border: 1px solid rgba(255,151,0,.18); border-radius: 8px; }
    .booking-desktop-empty { padding: 1rem; }
    .booking-mobile-list { display: none; }
    .booking-mobile-card { display: grid; gap: .72rem; padding: .9rem; }
    .booking-card-top { align-items: start; display: flex; gap: .75rem; justify-content: space-between; }
    .booking-card-top div { display: grid; gap: .18rem; min-width: 0; }
    .booking-card-top strong { color: #111; font-size: .96rem; line-height: 1.2; }
    .booking-card-top span, .booking-mobile-card p, .booking-card-meta span { color: #666; font-size: .82rem; font-weight: 800; line-height: 1.35; margin: 0; overflow-wrap: anywhere; }
    .booking-mobile-card p { color: #333; }
    .booking-card-meta { align-items: center; display: flex; gap: .75rem; justify-content: space-between; }
    .booking-card-meta strong { color: #111; font-size: .92rem; }
    .booking-card-details { border-top: 1px solid var(--admin-line); display: grid; gap: .75rem; padding-top: .78rem; }
    .booking-card-details dl { display: grid; gap: .55rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; }
    .booking-card-details dl div { background: #f8f8f6; border: 1px solid rgba(17,17,17,.07); border-radius: 6px; min-width: 0; padding: .62rem; }
    .booking-card-details dt { color: #777; font-size: .68rem; font-weight: 950; text-transform: uppercase; }
    .booking-card-details dd { color: #111; font-size: .82rem; font-weight: 850; line-height: 1.35; margin: .22rem 0 0; overflow-wrap: anywhere; }
    .booking-card-details button { justify-self: stretch; width: 100%; }

    input, select, textarea { background: #fff; border: 1px solid var(--admin-line); border-radius: 6px; color: var(--admin-ink); font: inherit; font-size: .92rem; font-weight: 500; line-height: 1.45; min-height: 42px; outline: 0; padding: .68rem .8rem; width: 100%; }
    textarea { min-height: 92px; resize: vertical; }
    input:focus, select:focus, textarea:focus { border-color: var(--admin-accent); box-shadow: 0 0 0 3px rgba(255,151,0,.14); }
    .employee-role-select { appearance: none; -moz-appearance: none; -webkit-appearance: none; background-image: none; padding-right: .8rem; }
    .employee-role-select::-ms-expand { display: none; }
    .table-link { color: var(--admin-accent); font-size: .78rem; font-weight: 900; text-decoration: none; white-space: nowrap; }
    .table-link:hover { color: #111; text-decoration: underline; }
    .payments-card-panel { display: grid; gap: .9rem; }
    .payment-desktop-card { align-items: stretch; display: grid; gap: 1rem; grid-template-columns: minmax(0, 1fr) minmax(280px, .44fr); padding: 1rem; }
    .payment-desktop-main { display: grid; gap: .82rem; min-width: 0; }
    .payment-desktop-title { align-items: flex-start; border-bottom: 1px solid var(--admin-line); display: flex; gap: 1rem; justify-content: space-between; min-width: 0; padding-bottom: .78rem; }
    .payment-desktop-title > div { display: grid; gap: .22rem; min-width: 0; }
    .payment-desktop-title span, .payment-desktop-remark label { color: #777; font-size: .68rem; font-weight: 950; line-height: 1.25; text-transform: uppercase; }
    .payment-desktop-title strong { color: #111; font-size: 1.02rem; font-weight: 950; line-height: 1.22; overflow-wrap: anywhere; }
    .payment-desktop-title small { color: #68635b; font-size: .78rem; font-weight: 850; line-height: 1.35; }
    .payment-desktop-grid { display: grid; gap: .62rem; grid-template-columns: repeat(5, minmax(0, 1fr)); margin: 0; }
    .payment-desktop-grid div { background: #f8f8f6; border: 1px solid rgba(17,17,17,.07); border-radius: 6px; min-width: 0; padding: .66rem .7rem; }
    .payment-desktop-grid dt { color: #777; font-size: .68rem; font-weight: 950; line-height: 1.25; text-transform: uppercase; }
    .payment-desktop-grid dd { color: #111; font-size: .84rem; font-weight: 850; line-height: 1.38; margin: .22rem 0 0; overflow-wrap: anywhere; }
    .payment-desktop-remark { align-content: start; background: #fffaf2; border: 1px solid rgba(255,151,0,.18); border-radius: 7px; display: grid; gap: .58rem; min-width: 0; padding: .78rem; }
    .remark-input { min-width: 220px; }
    .remark-cell { min-width: 340px; }
    .remark-control { align-items: center; display: grid; gap: .45rem; grid-template-columns: minmax(220px, 1fr) auto; }
    .remark-log-btn { background: transparent; border: 0; box-shadow: none; color: var(--admin-muted); display: inline-flex; font-size: .72rem; font-weight: 900; justify-content: flex-start; margin-top: .32rem; min-height: auto; padding: 0; text-transform: uppercase; }
    .payments-card-panel .remark-input { font-size: .84rem; font-weight: 750; line-height: 1.35; min-height: 38px; min-width: 0; padding: .58rem .68rem; }
    .payments-card-panel .remark-control { gap: .48rem; grid-template-columns: minmax(0, 1fr) auto; }
    .payments-card-panel .remark-log-btn, .booking-card-panel .remark-log-btn { color: #785600; font-weight: 950; line-height: 1.3; margin-top: .12rem; text-align: left; white-space: normal; }
    .payment-desktop-log { background: #fff7ec; border: 1px solid rgba(255,151,0,.18); border-radius: 8px; }
    .payments-desktop-empty { padding: 1rem; }
    .remark-log-btn:hover { color: var(--admin-accent); transform: none; }
    .remark-log-btn:disabled, .remark-log-btn:disabled:hover { color: var(--admin-muted); cursor: default; opacity: .65; }
    .payments-mobile-list, .payment-mobile-detail { display: none; }
    .payment-mobile-card { display: grid; gap: .6rem; padding: .85rem; }
    .payment-mobile-card.active { background: #fffaf2; border-color: rgba(255,151,0,.34); }
    .payment-card-top { align-items: start; display: flex; gap: .75rem; justify-content: space-between; }
    .payment-card-top div { display: grid; gap: .2rem; min-width: 0; }
    .payment-card-top strong, .payment-card-meta strong { color: #111; line-height: 1.2; }
    .payment-card-top span, .payment-card-meta span, .payment-mobile-card small { color: #666; font-size: .82rem; font-weight: 800; line-height: 1.35; overflow-wrap: anywhere; }
    .payment-card-meta { align-items: center; display: flex; gap: .75rem; justify-content: space-between; }
    .payment-detail-head { align-items: start; border-bottom: 1px solid var(--admin-line); display: flex; gap: .75rem; justify-content: space-between; padding-bottom: .75rem; }
    .payment-detail-head h3 { color: #111; font-size: 1.06rem; line-height: 1.24; margin: .12rem 0 .2rem; overflow-wrap: anywhere; }
    .payment-detail-head span { color: #666; font-size: .84rem; font-weight: 800; line-height: 1.35; }
    .payment-detail-grid { display: grid; gap: .58rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; }
    .payment-detail-grid div { background: #f8f8f6; border: 1px solid rgba(17,17,17,.07); border-radius: 6px; min-width: 0; padding: .65rem; }
    .payment-detail-grid dt { color: #777; font-size: .68rem; font-weight: 950; text-transform: uppercase; }
    .payment-detail-grid dd { color: #111; font-size: .84rem; font-weight: 850; line-height: 1.35; margin: .22rem 0 0; overflow-wrap: anywhere; }
    .payment-detail-remark { display: grid; gap: .62rem; }
    .payment-detail-remark .mini-btn { width: 100%; }
    .payment-mobile-log { background: #fff7ec; border: 1px solid var(--admin-line); border-radius: 8px; }
    button, .primary-btn, .ghost-btn, .mini-btn, .danger-btn, .return-btn, .ghost-mini, .link-btn { align-items: center; border: 0; border-radius: 999px; cursor: pointer; display: inline-flex; font-weight: 900; justify-content: center; transition: transform .25s ease, background .25s ease, color .25s ease, border-color .25s ease, box-shadow .25s ease; white-space: nowrap; }
    .primary-btn { background: #111; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; min-height: 50px; padding: .85rem 1.25rem; }
    .primary-btn:hover { background: var(--admin-accent); box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #fff; transform: translateY(-2px); }
    .ghost-btn { background: #fff; border: 1px solid rgba(17,17,17,.12); box-shadow: 0 8px 22px rgba(0,0,0,.06); color: #111; min-height: 50px; padding: .85rem 1.25rem; }
    .ghost-btn:hover, .ghost-mini:hover, .link-btn:hover { background: #111; border-color: #111; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; transform: translateY(-2px); }
    .mini-btn, .danger-btn, .return-btn, .ghost-mini, .link-btn { font-size: .78rem; min-height: 34px; padding: .48rem .78rem; }
    .mini-btn { background: #111; box-shadow: 0 10px 22px rgba(0,0,0,.14); color: #fff; }
    .mini-btn:hover { background: var(--admin-accent); box-shadow: 0 14px 28px rgba(255,151,0,.22); color: #fff; transform: translateY(-2px); }
    .danger-btn { background: #fff1f1; box-shadow: 0 8px 22px rgba(180,35,24,.08); color: #b42318; }
    .danger-btn:hover { background: #b42318; border-color: #b42318; box-shadow: 0 14px 28px rgba(180,35,24,.18); color: #fff; transform: translateY(-2px); }
    .delete-btn, .delete-btn:hover { background: #111; border-color: #111; box-shadow: 0 12px 26px rgba(0,0,0,.16); color: #fff; }
    .delete-btn:hover { background: #000; box-shadow: 0 14px 28px rgba(0,0,0,.2); transform: translateY(-2px); }
    .return-btn { background: #ecfdf3; border: 1px solid rgba(2,122,72,.2); box-shadow: 0 8px 22px rgba(2,122,72,.08); color: #027a48; }
    .return-btn:hover { background: #027a48; border-color: #027a48; box-shadow: 0 14px 28px rgba(2,122,72,.18); color: #fff; transform: translateY(-2px); }
    .ghost-mini, .link-btn { background: #fff; border: 1px solid rgba(17,17,17,.12); box-shadow: 0 8px 22px rgba(0,0,0,.05); color: #111; }
    button:disabled, button:disabled:hover { cursor: not-allowed; opacity: .55; transform: none !important; }
    .metric-grid { display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .metric-card { align-content: space-between; display: grid; gap: .55rem; min-height: 136px; min-width: 0; padding: 1rem; position: relative; }
    .metric-card::before { background: #111; border-radius: 999px; content: ""; height: 4px; left: .9rem; position: absolute; right: .9rem; top: .75rem; }
    .metric-card span { color: #555; font-size: .72rem; font-weight: 800; line-height: 1.3; padding-top: .55rem; text-transform: uppercase; }
    .metric-card strong { color: #111; font-size: clamp(1.32rem, 2.25vw, 1.9rem); line-height: 1.12; }
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
    .panel-head h3, .customer-card h3 { font-size: 1rem; letter-spacing: 0; line-height: 1.25; margin: 0; }
    .panel-head span { color: #555; font-size: .84rem; font-weight: 700; line-height: 1.35; }
    .dense-list { display: grid; gap: .65rem; }
    .dense-list article { align-items: center; background: var(--admin-soft); border: 1px solid var(--admin-line); border-radius: 6px; display: flex; gap: .8rem; justify-content: space-between; min-width: 0; padding: .78rem; }
    .dense-list article > div { min-width: 0; }
    .dense-list article.active { background: #fffaf2; border-color: var(--admin-accent); box-shadow: 0 10px 24px rgba(255,151,0,.11); }
    .dense-list strong, td strong { display: block; }
    .dense-list strong, td strong { color: #111; font-size: .94rem; line-height: 1.35; }
    .dense-list span, td span { color: #555; display: block; font-size: .82rem; line-height: 1.45; margin-top: .18rem; }
    .pending-dashboard-panel { align-content: start; }
    .registration-queue-head > div { min-width: 0; }
    .queue-state { align-content: center; background: var(--admin-soft); border: 1px dashed rgba(17,17,17,.14); border-radius: 6px; display: grid; min-height: 180px; padding: 1rem; text-align: center; }
    .queue-state.compact-state { min-height: 162px; }
    .queue-state h3 { color: #111; font-size: 1rem; line-height: 1.25; margin: 0 0 .35rem; }
    .request-list article { align-items: center; flex-direction: row; padding: .7rem; }
    .request-summary { align-items: center; background: transparent; border: 0; color: #111; display: grid; flex: 1 1 auto; font: inherit; gap: .7rem; grid-template-columns: 42px minmax(0, 1fr); justify-content: stretch; min-height: 44px; min-width: 0; padding: 0; text-align: left; white-space: normal; }
    .request-summary:hover { transform: none; }
    .request-avatar { align-items: center; aspect-ratio: 1; background: #eef4ff; border-radius: 999px; color: #ff9700 !important; display: inline-flex !important; font-size: .78rem !important; font-weight: 950; justify-content: center; letter-spacing: 0; margin: 0 !important; width: 42px; }
    .request-copy { display: block; min-width: 0; }
    .request-copy strong, .request-copy span, .request-copy small { overflow-wrap: anywhere; }
    .request-copy small { color: #9a6a00; display: block; font-size: .72rem; font-weight: 900; line-height: 1.35; margin-top: .25rem; }
    .request-meta { align-items: end; display: grid; flex: 0 0 auto; gap: .45rem; justify-items: end; }
    .status-chip { background: #fff7e6; border: 1px solid rgba(255,151,0,.22); border-radius: 999px; color: #9a6a00 !important; display: inline-flex !important; font-size: .68rem !important; font-weight: 950; line-height: 1.2; margin: 0 !important; padding: .28rem .5rem; text-transform: uppercase; }
    .request-list .mini-btn { flex: 0 0 auto; min-width: 74px; }
    .dashboard-request-list article { background: #fff; }
    .pagination-row { align-items: center; border-top: 1px solid var(--admin-line); display: flex; gap: .85rem; justify-content: space-between; padding-top: .85rem; }
    .pagination-row span { color: #777; font-size: .78rem; font-weight: 900; }
    .pagination-row div { align-items: center; display: flex; flex-wrap: wrap; gap: .55rem; }
    .employee-full-panel, .employee-create-page { width: 100%; }
    .employee-roster-panel { align-content: start; }
    .employee-page-head { align-items: center; }
    .employee-head-actions, .employee-form-actions { align-items: center; display: flex; flex-wrap: wrap; gap: .65rem; justify-content: flex-end; }
    .compact-primary { min-height: 42px; padding: .65rem 1rem; }
    .employee-tool-row { margin: 0; }
    .employee-tool-row .search-input { max-width: none; }
    .employee-roster-list { display: grid; gap: .7rem; }
    .employee-card { align-items: center; background: #fff; border: 1px solid var(--admin-line); border-radius: 8px; display: grid; gap: .8rem; grid-template-columns: 44px minmax(0, 1fr) auto auto; min-width: 0; padding: .78rem; }
    .employee-avatar { align-items: center; aspect-ratio: 1; background: #111; border-radius: 999px; color: #fff; display: inline-flex; font-size: .78rem; font-weight: 950; justify-content: center; width: 44px; }
    .employee-card-copy { min-width: 0; }
    .employee-card-copy strong, .employee-card-copy span, .employee-card-copy small { display: block; overflow-wrap: anywhere; }
    .employee-card-copy span, .employee-card-copy small { word-break: break-word; }
    .employee-card-copy strong { color: #111; font-size: .95rem; line-height: 1.25; }
    .employee-card-copy span { color: #555; font-size: .82rem; font-weight: 750; line-height: 1.4; margin-top: .18rem; }
    .employee-card-copy small { color: #9a6a00; font-size: .72rem; font-weight: 900; line-height: 1.35; margin-top: .2rem; }
    .employee-role-stack { align-items: end; display: grid; gap: .35rem; justify-items: end; }
    .employee-actions { justify-content: flex-end; }
    .employee-delete-btn { min-width: 82px; }
    .employee-create-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .employee-create-grid label:last-child { grid-column: 1 / -1; }
    .employee-form-actions { border-top: 1px solid var(--admin-line); padding-top: .95rem; }
    .registration-grid { align-items: start; grid-template-columns: minmax(320px, .72fr) minmax(0, 1.28fr); }
    .registration-detail { align-content: start; display: grid; gap: 1rem; }
    .registration-detail .panel-head { background: var(--admin-soft); border: 1px solid var(--admin-line); border-radius: 6px; margin-bottom: 0; padding: .85rem; }
    .detail-page-count { color: #777; flex: 0 0 auto; font-size: .78rem; font-weight: 900; }
    .detail-stepper { background: var(--admin-soft); border: 1px solid var(--admin-line); border-radius: 999px; display: grid; gap: .35rem; grid-template-columns: repeat(3, minmax(0, 1fr)); padding: .35rem; }
    .detail-stepper button { background: transparent; box-shadow: none; color: #777; min-height: 36px; padding: .5rem .65rem; }
    .detail-stepper button.active, .detail-stepper button:hover { background: #111; box-shadow: 0 10px 22px rgba(0,0,0,.14); color: #fff; transform: none; }
    .detail-section { background: var(--admin-soft); border: 1px solid var(--admin-line); border-radius: 6px; padding: 1rem; }
    .detail-section + .detail-section { margin-top: 0; }
    .detail-section-head { align-items: center; display: flex; gap: .75rem; justify-content: space-between; margin-bottom: .8rem; }
    .detail-section-head span { color: #777; font-size: .72rem; font-weight: 900; }
    .detail-section h4 { color: #9a6a00; font-size: .78rem; letter-spacing: .02em; margin: 0; text-transform: uppercase; word-spacing: 0; }
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
    .lightbox-close:hover, .lightbox-nav:hover { background: #ff9700; color: #fff; transform: translateY(-1px); }
    .lightbox-image-row { align-items: center; display: grid; gap: .75rem; grid-template-columns: 40px minmax(0, 1fr) 40px; min-height: 360px; }
    .lightbox-image-row img { background: #fff; border-radius: 8px; box-shadow: 0 24px 80px rgba(0,0,0,.34); display: block; margin: 0 auto; max-height: 76vh; object-fit: contain; padding: .5rem; width: 100%; }
    .lightbox-nav { align-self: center; justify-self: center; }
    .lightbox-nav:disabled, .lightbox-nav:disabled:hover { background: rgba(255,255,255,.52); box-shadow: none; color: rgba(17,17,17,.35); }
    .lightbox-foot { align-items: center; color: #fff; display: flex; gap: .7rem; justify-content: center; text-align: center; }
    .lightbox-foot strong, .lightbox-foot span { text-shadow: 0 2px 14px rgba(0,0,0,.32); }
    .lightbox-foot strong { font-size: .88rem; }
    .lightbox-foot span { color: rgba(255,255,255,.75); font-size: .8rem; font-weight: 900; }
    .admin-confirm-backdrop { align-items: center; background: rgba(0,0,0,.18); display: grid; inset: 0; justify-items: center; padding: 1.5rem; position: absolute; z-index: 5100; }
    .admin-confirm-dialog { background: #fff !important; border: 0; border-radius: 28px !important; box-shadow: 0 26px 70px rgba(0,0,0,.26); display: grid; gap: 1.15rem; max-width: 420px; min-width: min(360px, calc(100vw - 48px)); overflow: hidden; padding: 1.35rem; text-align: center; width: min(420px, calc(100vw - 48px)); }
    .admin-confirm-dialog .eyebrow { color: var(--admin-accent); letter-spacing: .14em; margin: 0 0 .35rem; word-spacing: -.04em; }
    .admin-confirm-dialog h3 { color: #111; font-size: 1.12rem; letter-spacing: 0; line-height: 1.2; margin: 0; }
    .admin-confirm-dialog p:not(.eyebrow) { color: #555; font-size: .9rem; font-weight: 750; line-height: 1.5; margin: .55rem 0 0; }
    .admin-confirm-actions { align-items: center; display: grid; gap: .7rem; grid-template-columns: 1fr 1fr; }
    .admin-confirm-actions button { width: 100%; }
    .admin-note-editor { margin-top: .8rem; min-height: 110px; width: 100%; }
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
    th { background: #f3f3ef; border-bottom: 1px solid var(--admin-line); color: var(--admin-muted); font-size: .7rem; letter-spacing: .02em; padding: .7rem .75rem; text-align: left; text-transform: uppercase; word-spacing: 0; }
    td { background: #fff; border-bottom: 1px solid rgba(17,17,17,.07); padding: .72rem .75rem; vertical-align: middle; }
    tr:hover td { background: #fffaf2; }
    .product-cell { align-items: center; display: flex; gap: .7rem; min-width: 230px; }
    .product-cell img { aspect-ratio: 1; border-radius: 6px; object-fit: cover; width: 52px; }
    .image-short-name { align-items: center; aspect-ratio: 1; background: #f3f3ef; border: 1px solid rgba(17,17,17,.08); border-radius: 6px; color: #555; display: inline-flex; flex: 0 0 52px; font-size: .58rem; font-weight: 950; justify-content: center; line-height: 1.1; max-width: 52px; overflow: hidden; padding: .28rem; text-align: center; text-transform: uppercase; word-spacing: 0; }
    .status { border-radius: 999px; display: inline-flex; font-size: .7rem; font-weight: 900; padding: .3rem .52rem; }
    .status-ok { background: #ecfdf3; color: #027a48; }
    .status-warn { background: #fff7e6; color: #b35a00; }
    .status-bad { background: #fff1f1; color: #b42318; }
    .status-info { background: #eef4ff; color: #2447a8; }
    .calendar-strip { background: #f3f3ef; border-radius: 999px; color: #555; padding: .32rem .52rem; }
    .empty-cell { color: #777; text-align: center; }
    .form-alert { background: #fff4f2; border: 1px solid rgba(180,35,24,.24); border-radius: 6px; color: #b42318; font-size: .9rem; font-weight: 800; line-height: 1.45; margin: 0 0 1rem; padding: .85rem 1rem; }
    .form-grid { display: grid; gap: .9rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .coupon-form-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .content-switcher { display: inline-flex; gap: .45rem; margin-bottom: 1rem; padding: .45rem; }
    .content-switcher button { background: transparent; border: 1px solid transparent; border-radius: 999px; color: #555; font-size: .9rem; font-weight: 900; min-height: 40px; padding: .55rem 1rem; }
    .content-switcher button.active,
    .content-switcher button:hover { background: #111; border-color: #111; color: #fff; }
    .blog-list-panel { align-content: start; }
    .blog-admin-list article { align-items: center; display: flex; gap: 1rem; justify-content: space-between; }
    .blog-admin-list article > div { min-width: 0; }
    .blog-admin-list strong,
    .blog-admin-list span { display: block; }
    .blog-admin-list span { color: var(--admin-muted); font-size: .82rem; font-weight: 800; margin-top: .22rem; }
    .blog-editor-form { align-content: start; }
    .blog-form-grid { display: grid; gap: .75rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .blog-form-grid .wide-field { grid-column: 1 / -1; }
    .blog-form-actions { align-items: center; display: flex; gap: .7rem; justify-content: flex-end; margin-top: .9rem; }
    .blog-form-actions .primary-btn,
    .blog-form-actions .danger-btn { min-width: 116px; }
    .content-gallery-grid { align-items: start; }
    .gallery-form { align-content: start; align-self: start; }
    .gallery-card-title { color: #111; font-size: 1rem; font-weight: 950; margin: 0 0 .5rem; }
    .gallery-upload-flow { align-items: stretch; display: grid; gap: .5rem; grid-template-columns: 1fr; }
    .gallery-image-field { display: grid; gap: .3rem; }
    .gallery-image-field > span { color: #111; font-size: .78rem; font-weight: 900; }
    .file-field input { display: none; }
    .file-field span { align-items: center; background: #fff; border: 1px dashed rgba(17,17,17,.22); border-radius: 6px; color: #555; display: flex; min-height: 42px; padding: .68rem .8rem; }
    .gallery-upload-box { align-items: center; background: #fff; border: 1px dashed rgba(17,17,17,.24); border-radius: 8px; color: var(--admin-muted); cursor: pointer; display: flex; flex-direction: column; justify-content: center; min-height: 110px; overflow: hidden; padding: .6rem; text-align: center; transition: border-color .2s ease, box-shadow .2s ease, background .2s ease; }
    .gallery-upload-box:hover { background: #fffaf2; border-color: var(--admin-accent); box-shadow: 0 12px 24px rgba(255,151,0,.11); }
    .gallery-upload-box input { display: none; }
    .gallery-upload-box b { color: #111; font-size: 1rem; font-weight: 950; }
    .gallery-upload-box small { color: var(--admin-muted); font-size: .78rem; font-weight: 800; margin-top: .35rem; }
    .gallery-upload-box img { height: 100%; object-fit: cover; width: 100%; }
    .gallery-upload-box.has-preview { border-style: solid; padding: 0; }
    .gallery-upload-fields { align-content: start; display: grid; gap: .48rem; }
    .gallery-toggle-row { align-items: center; display: grid; gap: .4rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .gallery-admin-grid { display: grid; gap: .85rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gallery-admin-grid article { background: #fff; border: 1px solid var(--admin-line); border-radius: 8px; display: grid; gap: .75rem; padding: .75rem; }
    .gallery-admin-grid img { aspect-ratio: 16 / 10; border-radius: 6px; object-fit: cover; width: 100%; }
    .gallery-admin-grid strong, .gallery-admin-grid span { display: block; overflow-wrap: anywhere; }
    .gallery-admin-grid span { color: var(--admin-muted); font-size: .8rem; font-weight: 800; margin-top: .2rem; }
    .selected-file { align-items: center; background: var(--admin-soft); border: 1px solid var(--admin-line); border-radius: 8px; display: flex; gap: .5rem; justify-content: space-between; min-width: 0; padding: .42rem .55rem; }
    .selected-file span { color: #333; font-size: .82rem; font-weight: 800; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .review-list article { align-items: start; }
    .review-list article { animation: coupon-page-settle 420ms cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--motion-index, 0) * 42ms); }
    .clickable-review { cursor: pointer; }
    .clickable-review:focus-visible { outline: 3px solid rgba(255,151,0,.34); outline-offset: 3px; }
    .review-list small { color: #777; display: block; font-size: .82rem; font-weight: 700; line-height: 1.45; margin-top: .38rem; max-width: 70ch; }
    .review-reply-preview { background: #fffaf2; border-left: 3px solid var(--admin-accent); color: #5f4300 !important; padding: .45rem .6rem; }
    .row-actions { align-items: center; display: flex; flex: 0 0 auto; gap: .5rem; }
    .review-detail-panel { align-content: start; }
    .review-detail { display: grid; gap: .8rem; }
    .review-detail > div { background: var(--admin-soft); border: 1px solid var(--admin-line); border-radius: 6px; padding: .8rem; }
    .review-detail span { color: var(--admin-muted); display: block; font-size: .72rem; font-weight: 900; margin-bottom: .28rem; text-transform: uppercase; }
    .review-detail strong { color: #111; font-weight: 950; }
    .review-detail p { background: #fff; border: 1px solid var(--admin-line); border-radius: 6px; color: #333; font-size: .95rem; font-weight: 700; line-height: 1.55; margin: 0; padding: .9rem; }
    .review-reply-editor { display: grid; gap: .7rem; }
    .review-reply-editor textarea { min-height: 98px; }
    label { color: #111; display: grid; font-size: .82rem; font-weight: 800; gap: .4rem; line-height: 1.35; }
    .checkbox-label { align-items: center; grid-template-columns: 18px 1fr; min-height: 42px; }
    .checkbox-label input { min-height: 18px; padding: 0; width: 18px; }
    .coupon-list article { align-items: stretch; display: grid; gap: .9rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .coupon-list article { animation: coupon-page-settle 420ms cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--motion-index, 0) * 42ms); }
    .coupon-field { align-content: center; background: #fff; border: 1px solid var(--admin-line); border-radius: 6px; display: grid; gap: .24rem; min-height: 68px; min-width: 0; padding: .7rem .8rem; }
    .coupon-field strong { color: #111; font-size: .94rem; letter-spacing: 0; line-height: 1.35; overflow-wrap: anywhere; word-spacing: 0; }
    .coupon-field span { color: #555; font-size: .84rem; font-weight: 850; line-height: 1.35; overflow-wrap: anywhere; }
    .coupon-field small { color: var(--admin-muted); display: block; font-size: .7rem; font-weight: 900; line-height: 1.2; text-transform: uppercase; }
    .coupon-list article.inactive .coupon-field strong,
    .coupon-list article.inactive .coupon-field span,
    .coupon-list article.inactive .coupon-field small { color: #b42318; }
    .coupon-actions { align-items: center; display: grid; grid-column: 1 / -1; gap: .5rem; grid-template-columns: 96px 96px; justify-content: start; }
    .coupon-status-btn,
    .coupon-actions .danger-btn { box-sizing: border-box; font-size: .78rem; height: 34px; line-height: 1.2; max-height: 34px; max-width: 96px; min-height: 34px; min-width: 96px; padding: .48rem .78rem; width: 96px; }
    .coupon-status-btn { align-items: center; border-radius: 999px; box-shadow: none; display: inline-flex; font-weight: 900; justify-content: center; text-align: center; }
    .coupon-status-btn:hover { box-shadow: 0 10px 22px rgba(0,0,0,.1); transform: translateY(-2px); }
    .coupon-status-btn:disabled,
    .coupon-status-btn:disabled:hover,
    .coupon-actions .danger-btn:disabled,
    .coupon-actions .danger-btn:disabled:hover { height: 34px; max-height: 34px; max-width: 96px; min-height: 34px; min-width: 96px; padding: .48rem .78rem; width: 96px; }
    .primary-btn.coupon-submit-btn { background: #111; box-sizing: border-box; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; font-size: .86rem; height: 40px; justify-self: start; line-height: 1.2; margin-top: .85rem; max-height: 40px; max-width: 116px; min-height: 40px; min-width: 116px; padding: .62rem 1rem; width: 116px; }
    .primary-btn.coupon-submit-btn:hover,
    .primary-btn.coupon-submit-btn:disabled,
    .primary-btn.coupon-submit-btn:disabled:hover { background: #111; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; height: 40px; max-height: 40px; max-width: 116px; min-height: 40px; min-width: 116px; padding: .62rem 1rem; transform: none !important; width: 116px; }
    .primary-btn.coupon-submit-btn:hover:not(:disabled) { background: #ff9700; transform: translateY(-1px) !important; }
    @keyframes coupon-page-settle {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .editor-panel > label { margin-top: 0; }
    .wide { margin-top: .85rem; width: 100%; }
    .card-grid { align-items: stretch; display: grid; gap: 1rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .customer-management-grid { align-items: start; grid-template-columns: minmax(280px, .85fr) minmax(0, 1.15fr); }
    .customer-card-grid { grid-template-columns: 1fr; }
    .customer-list-panel { display: grid; gap: 1rem; min-width: 0; }
    .customer-card { align-content: stretch; display: grid; gap: .85rem; grid-template-rows: auto 1fr auto; height: 100%; min-width: 0; padding: 1.05rem; }
    .customer-card.blocked { opacity: .68; }
    .clickable-customer { cursor: pointer; text-align: left; transition: transform .25s ease, border-color .25s ease, background .25s ease, box-shadow .25s ease; }
    .clickable-customer:hover, .active-customer { background: #fffaf2; border-color: rgba(255,151,0,.42); box-shadow: 0 18px 45px rgba(255,151,0,.11); transform: translateY(-1px); }
    .clickable-customer:focus-visible { outline: 3px solid rgba(255,151,0,.34); outline-offset: 3px; }
    .customer-card-head { align-items: flex-start; display: grid; gap: .75rem; grid-template-columns: 42px minmax(0, 1fr); min-width: 0; }
    .customer-card-info { display: grid; gap: .28rem; min-width: 0; }
    .customer-card p, .customer-card span { color: #777; font-size: .84rem; line-height: 1.4; margin: 0; overflow-wrap: anywhere; }
    .customer-card-actions { align-self: end; display: grid; gap: .55rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .customer-card-actions button { justify-self: stretch; min-height: 38px; width: 100%; }
    .customer-card-actions .danger-btn { border: 1px solid rgba(180,35,24,.22); }
    .customer-card-actions .danger-btn:hover { border-color: rgba(180,35,24,.72); }
    .customer-card-actions .delete-btn, .customer-card-actions .delete-btn:hover { border-color: #111; }
    .customer-detail-panel { align-content: start; }
    .customer-detail-profile { align-items: center; background: #fffaf2; border: 1px solid rgba(255,151,0,.24); border-radius: 8px; display: grid; gap: .8rem; grid-template-columns: 54px minmax(0, 1fr); padding: .9rem; }
    .customer-detail-profile h3 { color: #111; font-size: 1.08rem; line-height: 1.25; margin: 0 0 .2rem; overflow-wrap: anywhere; }
    .customer-detail-profile p, .customer-detail-profile span { color: #555; display: block; font-size: .86rem; font-weight: 800; line-height: 1.4; margin: 0; overflow-wrap: anywhere; }
    .customer-detail-avatar { align-items: center; aspect-ratio: 1; background: #ff9700; border-radius: 999px; color: #f6f6f4; display: inline-flex; font-weight: 950; justify-content: center; width: 54px; }
    .customer-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .customer-detail-grid div { background: var(--admin-soft); border: 1px solid var(--admin-line); border-radius: 6px; min-width: 0; padding: .72rem; }
    .customer-detail-grid dd { font-size: .95rem; line-height: 1.38; overflow-wrap: anywhere; }
    .customer-document-section { display: grid; gap: .75rem; }
    .customer-document-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .customer-empty { padding: 1rem; }
    .avatar { align-items: center; background: #ff9700 ; border-radius: 50%; color: #f6f6f4; display: inline-flex; flex: 0 0 auto; font-weight: 950; height: 42px; justify-content: center; width: 42px; }
    dl { display: grid; gap: .5rem; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 0; }
    .customer-card dl { align-self: end; }
    .customer-card dl div { background: var(--admin-soft); border: 1px solid var(--admin-line); border-radius: 6px; min-width: 0; padding: .62rem .5rem; }
    dt { color: #777; font-size: .7rem; font-weight: 900; text-transform: uppercase; }
    dd { color: #111; font-size: 1.15rem; font-weight: 950; margin: 0; }
    .category-performance-panel { align-content: start; gap: 1rem; }
    .category-chart-list { display: grid; gap: .9rem; }
    .category-chart-row { background: #fff; border: 1px solid var(--admin-line); border-radius: 8px; display: grid; gap: .6rem; min-width: 0; padding: .85rem .95rem; }
    .category-chart-meta { align-items: center; display: flex; gap: .75rem; justify-content: space-between; min-width: 0; }
    .category-chart-meta span { color: #111; font-size: .92rem; font-weight: 900; line-height: 1.35; overflow-wrap: anywhere; }
    .category-chart-meta strong { color: #111; flex: 0 0 auto; font-size: .95rem; font-weight: 950; line-height: 1.2; }
    .category-chart-track { background: #f0f0eb; border: 1px solid rgba(17,17,17,.06); border-radius: 999px; height: 14px; overflow: hidden; width: 100%; }
    .category-chart-track b { background: linear-gradient(90deg, #111 0%, #ff9700 100%); border-radius: inherit; display: block; height: 100%; min-width: 8px; }
    .error-text { color: #b42318; font-weight: 800; }
    .success-text { color: #027a48; font-weight: 900; margin: .8rem 0 0; }
    .access-card { margin: 0 auto; max-width: 680px; text-align: center; }
    .access-card h1 { font-size: clamp(2rem, 5vw, 4rem); line-height: .96; }
    .movement-panel button.movement-card,
    .movement-panel .movement-card,
    .movement-panel .movement-card > div,
    .movement-panel .movement-card strong,
    .movement-panel .movement-card span,
    .movement-panel .movement-card small,
    .movement-panel .movement-card p,
    .movement-panel .movement-card .status {
      align-items: flex-start !important;
      justify-content: flex-start !important;
      justify-items: start !important;
      justify-self: start !important;
      text-align: left !important;
      white-space: normal !important;
    }
    .movement-panel button.movement-card,
    .movement-panel .movement-card > div,
    .movement-panel .movement-card strong,
    .movement-panel .movement-card span,
    .movement-panel .movement-card small,
    .movement-panel .movement-card p { width: 100%; }
    @media (max-width: 1100px) {
      .admin-layout { grid-template-columns: 1fr; }
      .admin-sidebar { position: static; }
      nav { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .metric-grid, .card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .registration-grid { grid-template-columns: minmax(0, 1fr); }
    }
    @media (max-width: 760px) {
      :host ::ng-deep section.container.admin-shell { border-radius: 0 !important; overflow: visible; }
      .admin-page { max-width: 100vw !important; padding-left: .65rem; padding-right: .65rem; }
      .admin-page, .admin-page * { box-sizing: border-box; }
      .admin-page :where(.surface, .panel, .table-panel, .editor-panel, .employee-form, .access-card, .metric-card, .customer-card, .coupon-field) { max-width: 100%; min-width: 0; }
      .admin-page :where(.metric-grid, .split-grid, .card-grid, .dense-list, .coupon-list, .gallery-admin-grid, .admin-workspace) { min-width: 0; width: 100%; }
      .admin-page :where(h2, h3, strong, span, small, p, dd, dt, button, a) { overflow-wrap: anywhere; }
      .admin-layout, .admin-workspace { gap: .85rem; }
      .admin-sidebar { margin-inline: -.65rem; padding: .75rem .65rem .65rem; position: sticky; top: 0; z-index: 20; }
      .admin-sidebar h1 { font-size: 1.05rem; margin-bottom: .65rem; }
      .admin-sidebar nav { display: flex; gap: .45rem; grid-template-columns: none; margin-inline: -.15rem; overflow-x: auto; padding: .1rem .15rem .35rem; scroll-snap-type: x proximity; scrollbar-width: none; }
      .admin-sidebar nav::-webkit-scrollbar { display: none; }
      .admin-sidebar nav button { flex: 0 0 auto; font-size: .78rem; gap: .35rem; min-height: 40px; min-width: max-content; padding: .48rem .6rem; scroll-snap-align: start; }
      .admin-sidebar nav button span { overflow: visible; text-overflow: clip; white-space: nowrap; }
      .admin-sidebar nav button.active, .admin-sidebar nav button.active:hover { background: var(--admin-accent); border-color: var(--admin-accent); color: #fff; }
      .admin-topbar, .split-grid, .tool-row { align-items: stretch; grid-template-columns: 1fr; flex-direction: column; }
      .admin-topbar { gap: .85rem; padding: .95rem; }
      .admin-topbar h2 { font-size: clamp(.95rem, 5.6vw, 1.3rem); }
      .split-grid, .metric-grid, .card-grid, .form-grid, .blog-form-grid, .detail-grid, .document-grid, .gallery-upload-flow, .gallery-toggle-row, .gallery-admin-grid { grid-template-columns: 1fr; }
      .customer-management-grid { grid-template-columns: 1fr; }
      .customer-detail-panel { scroll-margin-top: 7rem; }

      .employee-metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .employee-page-head { align-items: stretch; }
      .employee-page-head > div { min-width: 0; width: 100%; }
      .employee-page-head h3 { font-size: 1.05rem; line-height: 1.25; }
      .employee-head-actions { align-items: stretch; display: grid; grid-template-columns: 1fr; justify-content: stretch; width: 100%; }
      .employee-head-actions button { width: 100%; }
      .employee-roster-list { gap: .78rem; }
      .employee-card { align-items: start; gap: .72rem; grid-template-columns: 42px minmax(0, 1fr); padding: .9rem; }
      .employee-avatar { font-size: .76rem; width: 42px; }
      .employee-card-copy { align-self: center; display: grid; gap: .22rem; min-width: 0; }
      .employee-card-copy strong { font-size: 1rem; line-height: 1.25; }
      .employee-card-copy span { color: #444; font-size: .86rem; font-weight: 800; line-height: 1.42; margin-top: 0; }
      .employee-card-copy small { color: #7a5300; font-size: .78rem; line-height: 1.35; margin-top: 0; }
      .employee-role-stack { align-items: stretch; display: flex; flex-wrap: wrap; gap: .45rem; grid-column: 1 / -1; justify-items: start; width: 100%; }
      .employee-role-stack .status-chip { flex: 1 1 132px; min-height: 34px; width: auto; }
      .employee-actions { grid-column: 1 / -1; justify-content: stretch; width: 100%; }
      .employee-delete-btn { min-height: 38px; width: 100%; }      .metric-card { gap: .45rem; min-height: auto; padding: .82rem; }
      .panel, .table-panel, .editor-panel, .employee-form, .access-card, .customer-card { padding: .82rem; width: 100%; }
      .panel-head, .detail-section-head { align-items: flex-start; flex-direction: column; gap: .55rem; }
      .panel-head button, .panel-head a, .detail-section-head button { align-self: flex-start; max-width: 100%; }
      .blog-form-grid .wide-field { grid-column: auto; }
      .blog-form-actions { align-items: stretch; flex-direction: column; }
      .blog-form-actions button { width: 100%; }
      .content-switcher { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
      .content-switcher button { width: 100%; }
      .gallery-upload-box { min-height: 132px; }
      .inventory-filter-row .search-input, .inventory-filter-row select, .booking-filter-row .search-input, .booking-filter-row select, .booking-filter-row .month-input, .search-input { flex-basis: auto; max-width: none; width: 100%; }
      .inventory-table-panel { display: none; }
      .inventory-mobile-list { display: grid; gap: .72rem; }
      .inventory-mobile-card { cursor: pointer; }
      .inventory-mobile-card .status { justify-self: end; }
      .inventory-mobile-detail { display: grid; gap: .85rem; scroll-margin-top: 7rem; }
      .inventory-detail-grid { grid-template-columns: 1fr; }
      .inventory-detail-actions { grid-template-columns: 1fr; }
      .inventory-mobile-empty { padding: 1rem; }
      .booking-table-panel { display: none; }
      .booking-mobile-list { display: grid; gap: .75rem; }
      .booking-mobile-card { border-radius: 8px; box-shadow: 0 12px 28px rgba(17,17,17,.06); cursor: pointer; }
      .booking-mobile-card.open { background: #fffaf2; border-color: rgba(255,151,0,.34); }
      .booking-card-top .status { flex: 0 0 auto; }
      .booking-card-details dl { grid-template-columns: 1fr; }
      .booking-mobile-empty { padding: 1rem; }
      .table-panel { margin-inline: -.15rem; overflow-x: auto; padding: .55rem; -webkit-overflow-scrolling: touch; }
      table { min-width: 760px; }
      th, td { padding: .62rem .65rem; }
      .product-cell { min-width: 190px; }
      .payments-table-panel { display: none; }
      .payments-mobile-list { display: grid; gap: .72rem; }
      .payment-mobile-card { cursor: pointer; }
      .payment-mobile-card .status { flex: 0 0 auto; }
      .payment-mobile-detail { display: grid; gap: .85rem; scroll-margin-top: 7rem; }
      .payment-detail-head { align-items: stretch; flex-direction: column; }
      .payment-detail-grid { grid-template-columns: 1fr; }
      .payments-mobile-empty { padding: 1rem; }
      .remark-cell { min-width: 280px; }
      .remark-control { grid-template-columns: 1fr; }
      .remark-input { min-width: 0; }
      .inventory-action-cell, .booking-action-cell, .action-cell { align-items: stretch; flex-direction: column; flex-wrap: nowrap; min-width: 0; }
      .inventory-action-cell .mini-btn, .inventory-action-cell .danger-btn, .inventory-action-cell .return-btn, .booking-action-cell .mini-btn, .booking-action-cell .ghost-mini { width: 100%; }
      .request-list article { align-items: stretch; flex-direction: column; }
      .request-summary { grid-template-columns: 38px minmax(0, 1fr); }
      .request-avatar { width: 38px; }
      .request-meta { align-items: stretch; grid-template-columns: 1fr; justify-items: stretch; }
      .status-chip { justify-content: center; width: 100%; }
      .coupon-list article { gap: .65rem; grid-template-columns: 1fr; padding: .75rem; }
      .coupon-actions { align-items: stretch; display: grid; gap: .5rem; grid-template-columns: 1fr 1fr; justify-content: stretch; }
      .coupon-actions .coupon-status-btn, .coupon-actions .danger-btn { width: 96px; }
      .request-list .mini-btn { width: 100%; }
      .pagination-row { align-items: stretch; flex-direction: column; }
      .pagination-row div, .pagination-row button { width: 100%; }
      .detail-stepper { border-radius: 18px; grid-template-columns: 1fr; }
      .detail-actions { align-items: stretch; flex-direction: column; width: 100%; }
      .detail-actions button, .detail-actions .primary-btn { width: 100%; }
      .topbar-actions { align-items: flex-start; flex-direction: row; }
      .topbar-actions button { flex: 0 1 auto; min-width: 0; }
      .customer-card-head { grid-template-columns: 38px minmax(0, 1fr); }
      .avatar { height: 38px; width: 38px; }
      .customer-card dl, dl { grid-template-columns: 1fr; }
      .customer-card-actions { grid-template-columns: 1fr; }
      .category-chart-row { padding: .78rem; }
      .primary-btn, .ghost-btn { font-size: .84rem; min-height: 42px; padding: .62rem .9rem; }
      .mini-btn, .danger-btn, .return-btn, .ghost-mini, .link-btn { font-size: .74rem; line-height: 1.2; min-height: 36px; padding: .46rem .65rem; white-space: normal; }
      .panel-head .link-btn, .panel-head .mini-btn, .panel-head .ghost-mini { min-width: 0; width: auto; }
      .content-switcher button { font-size: .82rem; min-height: 38px; padding: .48rem .65rem; }
      .movement-grid { grid-template-columns: 1fr; gap: .85rem; }
      .movement-panel { padding: .85rem; }
      .movement-list { gap: .62rem; }
      .movement-card { align-items: start !important; display: grid !important; gap: .55rem; grid-template-columns: minmax(0, 1fr); justify-content: stretch !important; justify-items: start !important; padding: .82rem .82rem .82rem .6rem; text-align: left !important; width: 100%; }
      .movement-card div { align-items: flex-start !important; flex-direction: column; gap: .3rem; justify-content: flex-start !important; text-align: left !important; width: 100%; }
      .movement-card strong { font-size: .94rem; }
      .movement-card span, .movement-card small { font-size: .78rem; }
      .movement-card p { font-size: .86rem; line-height: 1.42; }
      .movement-card .status { max-width: 100%; white-space: normal; }
      .movement-panel .movement-card { align-items: start; justify-items: stretch; text-align: left; }
      .movement-panel .movement-card > div,
      .movement-panel .movement-card strong,
      .movement-panel .movement-card span,
      .movement-panel .movement-card p,
      .movement-panel .movement-card small { display: block !important; justify-self: start !important; min-width: 0; text-align: left !important; width: 100%; }
      .movement-panel .movement-card .status { align-self: start !important; justify-self: start !important; text-align: left !important; width: auto; }
      .outward-detail-panel { padding: .85rem .85rem .85rem .6rem; width: 100%; }
      .outward-detail-top { align-items: flex-start; flex-direction: column; gap: .65rem; }
      .outward-detail-top > div { min-width: 0; width: 100%; }
      .outward-detail-top h3 { font-size: 1rem; line-height: 1.25; overflow-wrap: anywhere; }
      .payment-status { justify-content: center; max-width: 100%; white-space: normal; }
      .outward-detail-grid { gap: .62rem; grid-template-columns: 1fr; }
      .outward-detail-grid div { padding: .72rem .72rem .72rem .58rem; }
      .outward-detail-grid dd { font-size: .9rem; }
      .wide-detail { grid-column: auto; }
      .otp-panel { align-items: stretch; grid-template-columns: 1fr; }
      .otp-panel .primary-btn, .otp-panel .ghost-mini { width: 100%; }
      .otp-panel input { min-height: 42px; }
      .admin-workspace { scroll-margin-top: 86px; }
      .document-lightbox { padding: .7rem; }
      .document-lightbox-content { max-height: 94vh; max-width: 96vw; }
      .lightbox-image-row { gap: .45rem; grid-template-columns: 34px minmax(0, 1fr) 34px; min-height: 260px; }
      .lightbox-close, .lightbox-nav { font-size: 1.2rem; min-height: 34px; width: 34px; }
      .lightbox-foot { flex-direction: column; gap: .2rem; }
      .admin-confirm-actions { grid-template-columns: 1fr; }
    }
    @media (max-width: 420px) {
      .admin-page { padding-left: .5rem; padding-right: .5rem; }
      .admin-sidebar { margin-inline: -.5rem; padding-left: .5rem; padding-right: .5rem; }
      .admin-sidebar nav button { font-size: .75rem; min-width: max-content; padding-inline: .52rem; }
      .admin-topbar, .panel, .editor-panel, .employee-form, .customer-card { padding: .75rem; }
      .employee-metric-grid { grid-template-columns: 1fr; }
      .employee-card { grid-template-columns: 38px minmax(0, 1fr); padding: .78rem; }
      .employee-avatar { width: 38px; }
      .employee-card-copy strong { font-size: .96rem; }
      .employee-card-copy span { font-size: .82rem; }
      .primary-btn, .ghost-btn { font-size: .82rem; min-height: 40px; padding: .56rem .78rem; }
      .mini-btn, .danger-btn, .return-btn, .ghost-mini, .link-btn { white-space: normal; }
      table { min-width: 700px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .coupon-list article, .review-list article { animation: none; }
    }
  `]
})
export class AdminPageComponent implements OnInit, OnDestroy {
  @ViewChild('customerDetailPanel') private customerDetailPanel?: ElementRef<HTMLElement>;
  @ViewChild('outwardDetailPanel') private outwardDetailPanel?: ElementRef<HTMLElement>;
  @ViewChild('inventoryProductDetailPanel') private inventoryProductDetailPanel?: ElementRef<HTMLElement>;
  @ViewChild('paymentDetailPanel') private paymentDetailPanel?: ElementRef<HTMLElement>;

  readonly authService = inject(AuthService);

  private readonly adminService = inject(AdminService);
  private readonly galleryService = inject(GalleryService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly activeTab = signal<AdminTab>('dashboard');
  readonly products = signal<AdminProduct[]>([]);
  readonly bookings = signal<AdminBooking[]>([]);
  readonly customers = signal<AdminCustomer[]>([]);
  readonly payments = signal<AdminPayment[]>([]);
  readonly coupons = signal<AdminCoupon[]>([]);
  readonly reviews = signal<AdminReview[]>([]);
  readonly galleryImages = signal<AdminGalleryImage[]>([]);
  readonly blogPosts = signal<BlogPostAdmin[]>([]);
  readonly staticContent = signal<StaticContentItem[]>([]);

  readonly inventoryQuery = signal('');
  readonly inventoryStatus = signal('');
  readonly bookingQuery = signal('');
  readonly bookingStatusFilter = signal('');
  readonly bookingMonthFilter = signal('');
  readonly paymentStatusFilter = signal('');
  readonly customerQuery = signal('');
  readonly employeeQuery = signal('');
  readonly reviewQuery = signal('');
  readonly reviewRatingFilter = signal('');
  readonly activeContentSection = signal<'blog' | 'gallery'>('blog');
  readonly employeeView = signal<'manage' | 'create'>('manage');
  editingProductId?: number;
  createdEmployee?: EmployeeResponse;
  productFormError = '';
  inventoryImportFileName = '';
  inventoryImportMessage = '';
  inventoryImportError = '';
  employeeFormError = '';
  couponFormError = '';
  blogFormError = '';
  galleryFormError = '';
  galleryFileName = '';
  galleryPreviewUrl = '';
  blogCoverFileName = '';
  pendingCustomers: CustomerVerificationResponse[] = [];
  pendingPage = 1;
  readonly pendingPageSize = 3;
  readonly adminPageSize = 5;
  inventoryPage = 1;
  bookingsPage = 1;
  customersPage = 1;
  paymentsPage = 1;
  couponsPage = 1;
  employeesPage = 1;
  reviewsPage = 1;
  blogPage = 1;
  staticContentPage = 1;
  pendingLoadError = '';
  isSubmitting = false;
  isImportingInventory = false;
  isSubmittingCoupon = false;
  deletingCouponId?: number;
  deletingEmployeeId?: number;
  deletingCustomerId?: number;
  deletingProductId?: number;
  updatingCouponStatusId?: number;
  isSubmittingBlog = false;
  isSubmittingGallery = false;
  editingBlogPostId?: number;
  isLoadingPending = false;
  verifyingRequestId?: number;
  selectedPendingCustomer?: CustomerVerificationResponse;
  selectedCustomerDetail?: AdminCustomerDetailResponse;
  selectedCustomerError = '';
  loadingCustomerId?: number;
  selectedReview?: AdminReview;
  confirmDialog?: AdminConfirmDialog;
  noteDialog?: AdminNoteDialog;
  selectedOutwardBooking?: AdminBooking;
  activeNoteLogBooking?: AdminBooking;
  selectedInventoryProduct?: AdminProduct;
  selectedPaymentDetail?: AdminPayment;
  openBookingCardId?: string;
  deliveryOtpDraft = '';
  reviewReplyDraft = '';
  isSavingReviewReply = false;
  registrationDetailPage = 1;
  documentPreviews: Record<string, DocumentPreview> = {};
  documentPreviewError = '';
  isLoadingDocuments = false;
  activeDocumentPreview?: DocumentPreview;
  private documentPreviewReturnTarget?: HTMLElement;
  private readonly savingPaymentRemarkIds = new Set<number>();
  private readonly savingBookingNoteIds = new Set<number>();
  activeRemarkLogPayment?: AdminPayment;
  activePaymentRemarkLogs: PaymentRemarkLogView[] = [];
  isLoadingPaymentRemarkLog = false;
  paymentRemarkLogError = '';
  selectedInventoryImportFile?: File;
  private selectedGalleryFile?: File;
  private selectedBlogCoverFile?: File;

  readonly tabs: { id: AdminTab; label: string; count: string }[] = [
    { id: 'dashboard', label: 'Dashboard', count: 'Live' },
    { id: 'registrations', label: 'Registrations', count: '0' },
    { id: 'inventory', label: 'Inventory', count: '8' },
    { id: 'bookings', label: 'Bookings', count: '4' },
    { id: 'movement', label: 'Inward & Outward', count: '0' },
    { id: 'customers', label: 'Customers', count: '3' },
    { id: 'payments', label: 'Payments', count: '3' },
    { id: 'coupons', label: 'Coupons', count: '0' },
    { id: 'content', label: 'Content', count: '5' },
    { id: 'reviews', label: 'Reviews', count: '0' },
    { id: 'reports', label: 'Reports', count: 'CSV' },
    { id: 'employees', label: 'Employees', count: '0' },
    { id: 'roles', label: 'Roles', count: 'RBAC' },
    { id: 'settings', label: 'Settings', count: 'Ops' }
  ];

  readonly categoryReports = signal<Array<{ name: string; value: number }>>([]);
  readonly rolePermissions = signal<RolePermission[]>([]);
  readonly employees = signal<EmployeeResponse[]>([]);

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
    role: ['MANAGER', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly couponForm = this.fb.nonNullable.group({
    code: ['', Validators.required],
    discountPercent: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
    usageLimit: [null as number | null, Validators.min(1)],
    validUntil: [''],
    active: [true]
  });

  readonly galleryForm = this.fb.nonNullable.group({
    altText: ['', Validators.required],
    displayOrder: [1, [Validators.required, Validators.min(1)]],
    wide: [false],
    tall: [false],
    active: [true]
  });

  readonly blogForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    slug: ['', Validators.required],
    coverImage: [''],
    authorName: ['', Validators.required],
    publishDate: [new Date().toISOString().slice(0, 10), Validators.required],
    category: ['', Validators.required],
    tags: [''],
    seoTitle: [''],
    seoDescription: [''],
    seoKeywords: [''],
    content: ['', Validators.required],
    status: ['DRAFT' as 'DRAFT' | 'PUBLISHED', Validators.required]
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
      movement: 'Inward & outward',
      customers: 'Customer management',
      payments: 'Payments & refunds',
      coupons: 'Coupon management',
      content: 'Blog, content & gallery',
      reviews: 'Review management',
      reports: 'Reports & analytics',
      employees: 'Employee management',
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
      .filter((item) => !query || [item.id, item.customer, ...item.products].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => this.compareBookingsNewestFirst(a, b));
  });

  readonly outwardBookings = computed(() => [...this.bookings()].sort((a, b) => this.compareBookingsNewestFirst(a, b)).filter((booking) => this.isOutwardBooking(booking)));
  readonly inwardBookings = computed(() => [...this.bookings()].sort((a, b) => this.compareBookingsNewestFirst(a, b)).filter((booking) => this.isInwardBooking(booking)));
  readonly filteredCustomers = computed(() => {
    const query = this.customerQuery().trim().toLowerCase();
    return this.customers().filter((item) => !query || [item.name, item.email, item.city, item.phone].some((value) => value.toLowerCase().includes(query)));
  });

  readonly filteredEmployees = computed(() => {
    const query = this.employeeQuery().trim().toLowerCase();
    return this.employees().filter((item) => {
      const roleText = item.roles.map((role) => this.employeeRoleLabel(role)).join(' ');
      return !query || [item.fullName, item.email, item.mobile, roleText].some((value) => value.toLowerCase().includes(query));
    });
  });

  readonly filteredReviews = computed(() => {
    const query = this.reviewQuery().trim().toLowerCase();
    const rating = Number(this.reviewRatingFilter());
    return this.reviews()
      .filter((item) => !rating || item.rating === rating)
      .filter((item) => !query || [item.name, item.role, item.quote].some((value) => value.toLowerCase().includes(query)));
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

  pagedCoupons(): AdminCoupon[] {
    return this.paginate(this.coupons(), this.couponsPage);
  }

  pagedEmployees(): EmployeeResponse[] {
    return this.paginate(this.filteredEmployees(), this.employeesPage);
  }

  pagedReviews(): AdminReview[] {
    return this.paginate(this.filteredReviews(), this.reviewsPage);
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
    this.clearGalleryPreview();
  }

  private loadAdminData(): void {
    this.loadInventory();
    this.loadBookings();
    this.loadCustomers();
    this.loadPayments();
    this.loadCoupons();
    this.loadReviews();
    this.loadGalleryImages();
    this.loadContent();
    this.loadCategoryReports();
    this.loadRolePermissions();
    this.loadEmployees();
    this.loadSettings();
  }

  private loadInventory(): void {
    this.adminService.getInventory().subscribe({
      next: (products) => {
        this.products.set(products.map((product) => this.mapProduct(product)));
        this.clampAdminPages();
        this.updateTabCount('inventory', String(products.length));
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  private loadBookings(): void {
    this.adminService.getBookings().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings.map((booking) => this.mapBooking(booking)));
        this.clampAdminPages();
        this.updateTabCount('bookings', String(bookings.length));
        this.updateTabCount('movement', String(this.outwardBookings().length + this.inwardBookings().length));
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  private loadCustomers(): void {
    this.adminService.getCustomers().subscribe({
      next: (customers) => {
        this.customers.set(customers.map((customer) => this.mapCustomer(customer)));
        this.clampAdminPages();
        this.updateTabCount('customers', String(customers.length));
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  private loadPayments(): void {
    this.adminService.getPayments().subscribe({
      next: (payments) => {
        this.payments.set(payments.map((payment) => this.mapPayment(payment)));
        this.clampAdminPages();
        this.updateTabCount('payments', String(payments.length));
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  loadCoupons(): void {
    this.adminService.getCoupons().subscribe({
      next: (coupons) => {
        this.coupons.set(coupons.map((coupon) => this.mapCoupon(coupon)));
        this.clampAdminPages();
        this.updateTabCount('coupons', String(coupons.length));
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  loadReviews(): void {
    this.adminService.getReviews().subscribe({
      next: (reviews) => {
        const mappedReviews = reviews.map((review) => this.mapReview(review));
        this.reviews.set(mappedReviews);
        if (this.selectedReview && !mappedReviews.some((review) => review.id === this.selectedReview?.id)) {
          this.selectedReview = undefined;
          this.reviewReplyDraft = '';
        } else if (this.selectedReview) {
          this.selectedReview = mappedReviews.find((review) => review.id === this.selectedReview?.id);
          this.reviewReplyDraft = this.selectedReview?.adminReply ?? '';
        }
        this.clampAdminPages();
        this.updateTabCount('reviews', String(reviews.length));
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  loadGalleryImages(): void {
    this.galleryService.getAdminGallery().subscribe({
      next: (images) => {
        this.galleryImages.set(images.map((image) => this.mapGalleryImage(image)));
        this.updateContentTabCount();
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  private loadContent(): void {
    this.adminService.getContent().subscribe({
      next: (content) => this.applyContent(content),
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  private loadCategoryReports(): void {
    this.adminService.getCategoryReports().subscribe({
      next: (reports) => this.categoryReports.set(reports.map((report) => ({
        ...report,
        name: this.reportCategoryName(report.name)
      }))),
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  private reportCategoryName(name: string): string {
    const normalized = name.trim().toUpperCase().replace(/[\s-]+/g, '_');
    return normalized === 'TRIPOD_SUPPORT' || normalized === 'TRIPODS_SUPPORT' ? 'Tripod' : name;
  }

  private loadRolePermissions(): void {
    this.adminService.getRolePermissions().subscribe({
      next: (permissions) => this.rolePermissions.set(permissions),
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  loadEmployees(): void {
    this.adminService.getEmployees().subscribe({
      next: (employees) => {
        this.employees.set(employees);
        this.employeesPage = Math.min(this.employeesPageCount(), Math.max(1, this.employeesPage));
        this.updateTabCount('employees', String(employees.length));
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  private loadSettings(): void {
    this.adminService.getSettings().subscribe({
      next: (settings) => this.settingsForm.patchValue(settings),
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
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
          this.showTopMessage(this.authService.getErrorMessage(error), 3600);
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
          this.showTopMessage(this.pendingLoadError, 3600);
        }
      });
  }

  openPendingDetails(customer: CustomerVerificationResponse): void {
    this.selectedPendingCustomer = customer;
    this.registrationDetailPage = 1;
    this.activeTab.set('registrations');
    this.loadDocumentPreviews(customer);
  }

  selectAdminTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    this.scrollToSectionTop();
  }

  setAdminContentSection(section: 'blog' | 'gallery'): void {
    this.activeContentSection.set(section);
    this.scrollToActiveSection();
  }

  setRegistrationDetailPage(page: number): void {
    this.registrationDetailPage = Math.min(3, Math.max(1, page));
  }

  changeRegistrationDetailPage(direction: number): void {
    this.setRegistrationDetailPage(this.registrationDetailPage + direction);
    this.scrollToSectionTop();
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

  changePage(section: 'inventory' | 'bookings' | 'customers' | 'payments' | 'coupons' | 'reviews' | 'blog' | 'staticContent', direction: number): void {
    if (section === 'inventory') {
      this.inventoryPage = this.nextPage(this.inventoryPage, this.filteredProducts().length, direction);
      this.scrollToSectionTop();
      return;
    }
    if (section === 'bookings') {
      this.bookingsPage = this.nextPage(this.bookingsPage, this.filteredBookings().length, direction);
      this.scrollToSectionTop();
      return;
    }
    if (section === 'customers') {
      this.customersPage = this.nextPage(this.customersPage, this.filteredCustomers().length, direction);
      this.scrollToSectionTop();
      return;
    }
    if (section === 'payments') {
      this.paymentsPage = this.nextPage(this.paymentsPage, this.payments().length, direction);
      this.scrollToSectionTop();
      return;
    }
    if (section === 'coupons') {
      this.couponsPage = this.nextPage(this.couponsPage, this.coupons().length, direction);
      this.scrollToSectionTop();
      return;
    }
    if (section === 'reviews') {
      this.reviewsPage = this.nextPage(this.reviewsPage, this.filteredReviews().length, direction);
      this.scrollToSectionTop();
      return;
    }
    if (section === 'blog') {
      this.blogPage = this.nextPage(this.blogPage, this.blogPosts().length, direction);
      this.scrollToSectionTop();
      return;
    }
    this.staticContentPage = this.nextPage(this.staticContentPage, this.staticContent().length, direction);
    this.scrollToSectionTop();
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
    this.scrollToSectionTop();
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

  openDocumentPreview(preview: DocumentPreview, event?: Event): void {
    this.documentPreviewReturnTarget = event?.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
    this.activeDocumentPreview = preview;
    window.setTimeout(() => {
      const target = document.querySelector('.document-lightbox');
      if (target) {
        target.scrollIntoView({ block: 'start', behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    });
  }

  closeDocumentPreview(): void {
    const returnTarget = this.documentPreviewReturnTarget;
    this.activeDocumentPreview = undefined;
    this.documentPreviewReturnTarget = undefined;
    if (returnTarget) {
      window.setTimeout(() => returnTarget.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    }
  }

  openPaymentDetail(payment: AdminPayment): void {
    this.selectedPaymentDetail = payment;
    this.scrollToPaymentDetailOnMobile();
  }

  private scrollToPaymentDetailOnMobile(): void {
    if (!window.matchMedia('(max-width: 760px)').matches) {
      return;
    }

    window.setTimeout(() => {
      if (this.paymentDetailPanel?.nativeElement) {
        this.smoothScrollToElement(this.paymentDetailPanel.nativeElement, 88, 760);
      }
    });
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

  selectInventoryImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.inventoryImportMessage = '';
    this.inventoryImportError = '';
    this.selectedInventoryImportFile = file;
    this.inventoryImportFileName = file?.name ?? '';
  }

  importInventorySheet(): void {
    const file = this.selectedInventoryImportFile;
    this.inventoryImportMessage = '';
    this.inventoryImportError = '';
    if (!file) {
      this.inventoryImportError = 'Choose an Excel or CSV file first.';
      return;
    }

    this.isImportingInventory = true;
    this.adminService.importProducts(file)
      .pipe(finalize(() => {
        this.isImportingInventory = false;
      }))
      .subscribe({
        next: (result) => this.applyInventoryImportResult(result),
        error: (error) => {
          this.inventoryImportError = this.authService.getErrorMessage(error);
          this.showTopMessage(this.inventoryImportError, 4200);
        }
      });
  }

  private applyInventoryImportResult(result: ProductImportResponse): void {
    this.products.update((items) => [
      ...result.products.map((product) => this.mapProduct(product)),
      ...items
    ]);
    this.inventoryPage = 1;
    this.clampAdminPages();
    this.updateTabCount('inventory', String(this.products().length));
    const skipped = result.skippedCount ? ` ${result.skippedCount} row${result.skippedCount === 1 ? '' : 's'} skipped.` : '';
    const warning = result.errors?.length ? ` ${result.errors[0]}` : '';
    this.inventoryImportMessage = `${result.importedCount} product${result.importedCount === 1 ? '' : 's'} imported.${skipped}${warning}`;
    this.showTopMessage(this.inventoryImportMessage, 4200);
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

  openInventoryProduct(product: AdminProduct): void {
    this.selectedInventoryProduct = product;
    this.scrollToInventoryProductOnMobile();
  }

  private scrollToInventoryProductOnMobile(): void {
    if (!window.matchMedia('(max-width: 760px)').matches) {
      return;
    }

    window.setTimeout(() => {
      if (this.inventoryProductDetailPanel?.nativeElement) {
        this.smoothScrollToElement(this.inventoryProductDetailPanel.nativeElement, 88, 760);
      }
    });
  }
  editProduct(product: AdminProduct): void {
    this.router.navigateByUrl(`/admin/inventory/edit/${product.id}`);
  }

  addProduct(): void {
    this.router.navigateByUrl('/admin/inventory/new');
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
    this.openConfirmDialog('Mark product under maintenance?', product.name, 'Mark maintenance', 'default', () => {
    this.adminService.markProductMaintenance(product.id).subscribe({
      next: (updatedProduct) => {
        this.products.update((items) => items.map((item) => item.id === updatedProduct.id ? this.mapProduct(updatedProduct) : item));
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
    });
  }

  returnFromMaintenance(product: AdminProduct): void {
    this.openConfirmDialog('Return product to available?', product.name, 'Mark available', 'default', () => {
    this.adminService.updateProduct(product.id, this.productRequestFromProduct(product, 'Available')).subscribe({
      next: (updatedProduct) => {
        this.products.update((items) => items.map((item) => item.id === updatedProduct.id ? this.mapProduct(updatedProduct) : item));
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
    });
  }


  deleteProduct(product: AdminProduct): void {
    this.openConfirmDialog('Delete product?', `${product.name} will be removed from inventory.`, 'Delete', 'danger', () => {
      this.deletingProductId = product.id;
      this.adminService.deleteProduct(product.id)
        .pipe(finalize(() => {
          this.deletingProductId = undefined;
        }))
        .subscribe({
          next: () => {
            this.products.update((items) => items.filter((item) => item.id !== product.id));
            if (this.selectedInventoryProduct?.id === product.id) {
              this.selectedInventoryProduct = undefined;
            }
            this.clampAdminPages();
            this.showTopMessage('Product deleted.', 2200);
          },
          error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
        });
    });
  }


  openOutwardDetails(booking: AdminBooking): void {
    this.selectedOutwardBooking = booking;
    this.deliveryOtpDraft = '';
    this.scrollToActiveSection('.admin-page .outward-detail-panel');
    this.scrollToOutwardDetailsOnMobile();
  }

  closeOutwardDetails(): void {
    this.selectedOutwardBooking = undefined;
    this.deliveryOtpDraft = '';
  }

  private scrollToOutwardDetailsOnMobile(): void {
    if (!window.matchMedia('(max-width: 760px)').matches) {
      return;
    }

    window.setTimeout(() => {
      if (this.outwardDetailPanel?.nativeElement) {
        this.smoothScrollToElement(this.outwardDetailPanel.nativeElement, 88, 760);
      }
    });
  }

  confirmDeliveryOtp(): void {
    const otp = this.deliveryOtpDraft.trim();
    const booking = this.selectedOutwardBooking;
    if (!booking || otp.length < 4) {
      this.showTopMessage('Enter a valid delivery OTP.', 2600);
      return;
    }
    this.adminService.verifyDeliveryOtp(booking.backendId, otp).subscribe({
      next: (updatedBooking) => {
        const mappedBooking = this.mapBooking(updatedBooking);
        this.bookings.update((items) => items.map((item) => item.backendId === mappedBooking.backendId ? mappedBooking : item));
        this.selectedOutwardBooking = mappedBooking;
        this.deliveryOtpDraft = '';
        this.showTopMessage('Delivery OTP verified. Booking marked active.', 2600);
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  toggleBookingCard(booking: AdminBooking): void {
    this.openBookingCardId = this.openBookingCardId === booking.id ? undefined : booking.id;
  }

  isBookingCardOpen(booking: AdminBooking): boolean {
    return this.openBookingCardId === booking.id;
  }

  addNote(booking: AdminBooking): void {
    this.noteDialog = { booking, note: booking.notes };
  }

  cancelNoteDialog(): void {
    this.noteDialog = undefined;
  }

  updateBookingNoteDraft(booking: AdminBooking, note: string): void {
    this.bookings.update((items) => items.map((item) => item.backendId === booking.backendId ? { ...item, notes: note } : item));
    if (this.selectedOutwardBooking?.backendId === booking.backendId) {
      this.selectedOutwardBooking = { ...this.selectedOutwardBooking, notes: note };
    }
    if (this.activeNoteLogBooking?.backendId === booking.backendId) {
      this.activeNoteLogBooking = { ...this.activeNoteLogBooking, notes: note };
    }
  }

  toggleBookingNoteLog(booking: AdminBooking): void {
    this.activeNoteLogBooking = this.activeNoteLogBooking?.backendId === booking.backendId ? undefined : booking;
  }

  bookingNoteEntries(booking: AdminBooking): string[] {
    return booking.noteLog;
  }

  bookingNoteCount(booking: AdminBooking): number {
    return booking.noteLog.length;
  }

  saveBookingNote(bookingId: number): void {
    const booking = this.bookings().find((item) => item.backendId === bookingId);
    if (!booking || this.isSavingBookingNote(bookingId)) {
      return;
    }

    this.savingBookingNoteIds.add(bookingId);
    this.adminService.addBookingNote(bookingId, booking.notes)
      .pipe(finalize(() => {
        this.savingBookingNoteIds.delete(bookingId);
      }))
      .subscribe({
        next: (updatedBooking) => {
          const mappedBooking = this.mapBooking(updatedBooking);
          this.bookings.update((items) => items.map((item) => item.backendId === mappedBooking.backendId ? mappedBooking : item));
          if (this.selectedOutwardBooking?.backendId === mappedBooking.backendId) {
            this.selectedOutwardBooking = mappedBooking;
          }
          this.showTopMessage('Internal note saved.', 1800);
        },
        error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
      });
  }

  isSavingBookingNote(bookingId: number): boolean {
    return this.savingBookingNoteIds.has(bookingId);
  }

  saveNoteDialog(): void {
    const dialog = this.noteDialog;
    if (!dialog) {
      return;
    }

    this.noteDialog = undefined;
    this.adminService.addBookingNote(dialog.booking.backendId, dialog.note).subscribe({
      next: (updatedBooking) => {
        this.bookings.update((items) => items.map((item) => item.backendId === updatedBooking.id ? this.mapBooking(updatedBooking) : item));
        this.showTopMessage('Internal note saved.', 2200);
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  openCustomerDetails(customer: AdminCustomer): void {
    this.selectedCustomerError = '';
    this.loadingCustomerId = customer.id;
    this.clearDocumentPreviews();
    this.scrollToCustomerDetailsOnMobile();
    this.adminService.getCustomerDetails(customer.id)
      .pipe(finalize(() => {
        if (this.loadingCustomerId === customer.id) {
          this.loadingCustomerId = undefined;
        }
      }))
      .subscribe({
        next: (detail) => {
          this.selectedCustomerDetail = detail;
          this.loadVerifiedCustomerDocumentPreviews(detail);
        },
        error: (error) => {
          const message = this.authService.getErrorMessage(error);
          this.selectedCustomerError = message.includes('No static resource')
            ? 'Customer details API is not available in the running backend. Restart or redeploy the backend with the latest code.'
            : message;
          this.selectedCustomerDetail = undefined;
        }
      });
  }

  private scrollToCustomerDetailsOnMobile(): void {
    if (!window.matchMedia('(max-width: 760px)').matches) {
      return;
    }

    window.setTimeout(() => {
      this.customerDetailPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  toggleCustomerBlock(customer: AdminCustomer): void {
    const action = customer.blocked ? 'unblock' : 'block';
    this.openConfirmDialog(`${action === 'block' ? 'Block' : 'Unblock'} customer?`, customer.name, action === 'block' ? 'Block customer' : 'Unblock customer', action === 'block' ? 'danger' : 'default', () => {
      this.adminService.setCustomerBlocked(customer.id, !customer.blocked).subscribe({
        next: (updatedCustomer) => {
          const mappedCustomer = this.mapCustomer(updatedCustomer);
          this.customers.update((items) => items.map((item) => item.id === updatedCustomer.id ? mappedCustomer : item));
          if (this.selectedCustomerDetail?.id === updatedCustomer.id) {
            this.selectedCustomerDetail = { ...this.selectedCustomerDetail, blocked: mappedCustomer.blocked };
          }
        },
        error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
      });
    });
  }

  deleteCustomer(customer: AdminCustomer): void {
    this.openConfirmDialog('Delete customer?', `${customer.name} will be permanently removed if they have no booking history.`, 'Delete customer', 'danger', () => {
      this.deletingCustomerId = customer.id;
      this.adminService.deleteCustomer(customer.id)
        .pipe(finalize(() => {
          if (this.deletingCustomerId === customer.id) {
            this.deletingCustomerId = undefined;
          }
        }))
        .subscribe({
          next: () => {
            this.customers.update((items) => items.filter((item) => item.id !== customer.id));
            this.updateTabCount('customers', String(this.customers().length));
            this.customersPage = Math.min(this.pageCount(this.filteredCustomers().length), Math.max(1, this.customersPage));
            if (this.selectedCustomerDetail?.id === customer.id) {
              this.selectedCustomerDetail = undefined;
              this.clearDocumentPreviews();
            }
            this.showTopMessage('Customer deleted.', 2200);
          },
          error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 4200)
        });
    });
  }

  updatePaymentRemarkDraft(payment: AdminPayment, remark: string): void {
    this.payments.update((items) => items.map((item) => item.backendId === payment.backendId ? { ...item, remark } : item));
    if (this.selectedPaymentDetail?.backendId === payment.backendId) {
      this.selectedPaymentDetail = { ...this.selectedPaymentDetail, remark };
    }
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
        const mappedPayment = this.mapPayment(updatedPayment);
        this.payments.update((items) => items.map((item) => item.backendId === updatedPayment.id ? mappedPayment : item));
        if (this.selectedPaymentDetail?.backendId === mappedPayment.backendId) {
          this.selectedPaymentDetail = mappedPayment;
        }
        this.showTopMessage('Payment remark saved.', 1800);
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  isSavingPaymentRemark(paymentId: number): boolean {
    return this.savingPaymentRemarkIds.has(paymentId);
  }

  markContentReviewed(): void {
    this.staticContent.update((items) => items.map((item) => ({ ...item, status: 'Current' })));
  }

  startNewBlogPost(): void {
    this.editingBlogPostId = undefined;
    this.blogFormError = '';
    this.selectedBlogCoverFile = undefined;
    this.blogCoverFileName = '';
    this.blogForm.reset({
      title: '',
      slug: '',
      coverImage: '',
      authorName: '',
      publishDate: new Date().toISOString().slice(0, 10),
      category: '',
      tags: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      content: '',
      status: 'DRAFT'
    });
  }

  editBlogPost(post: BlogPostAdmin): void {
    this.editingBlogPostId = post.id;
    this.blogFormError = '';
    this.selectedBlogCoverFile = undefined;
    this.blogCoverFileName = '';
    this.blogForm.setValue({
      title: post.title,
      slug: post.slug,
      coverImage: post.coverImage,
      authorName: post.author,
      publishDate: post.publishDate || new Date().toISOString().slice(0, 10),
      category: post.category,
      tags: post.tags,
      seoTitle: post.seoTitle,
      seoDescription: post.metaDescription,
      seoKeywords: post.seoKeywords,
      content: post.content,
      status: post.status === 'Published' ? 'PUBLISHED' : 'DRAFT'
    });
  }

  syncBlogSlug(): void {
    if (this.editingBlogPostId || this.blogForm.controls.slug.value.trim()) {
      return;
    }

    this.blogForm.controls.slug.setValue(this.slugify(this.blogForm.controls.title.value), { emitEvent: false });
  }

  setBlogCoverImage(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.selectedBlogCoverFile = input?.files?.[0];
    this.blogCoverFileName = this.selectedBlogCoverFile?.name ?? '';
  }

  blogCoverLabel(): string {
    return this.blogCoverFileName || (this.blogForm.controls.coverImage.value ? 'Current image selected' : 'Choose image');
  }

  normalizeCouponInput(): void {
    const code = this.couponForm.controls.code.value.toUpperCase().replace(/\s+/g, '');
    this.couponForm.controls.code.setValue(code, { emitEvent: false });
  }

  setGalleryFile(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    this.clearGalleryPreview();
    this.selectedGalleryFile = file;
    this.galleryFileName = file?.name ?? '';
    if (file) {
      this.galleryPreviewUrl = URL.createObjectURL(file);
    }
  }

  clearGalleryFile(): void {
    this.selectedGalleryFile = undefined;
    this.galleryFileName = '';
    this.clearGalleryPreview();
  }

  submitCoupon(): void {
    this.couponFormError = '';
    this.normalizeCouponInput();
    if (this.couponForm.invalid || this.isSubmittingCoupon) {
      this.couponForm.markAllAsTouched();
      this.couponFormError = 'Enter a coupon code, discount percent from 1 to 100, and a usage limit of at least 1 if set.';
      return;
    }

    this.isSubmittingCoupon = true;
    const formValue = this.couponForm.getRawValue();
    const request = {
      code: formValue.code,
      discountPercent: formValue.discountPercent,
      active: formValue.active,
      usageLimit: formValue.usageLimit || null,
      validUntil: formValue.validUntil || null
    };
    this.adminService.createCoupon(request)
      .pipe(finalize(() => {
        this.isSubmittingCoupon = false;
      }))
      .subscribe({
        next: (coupon) => {
          this.coupons.update((items) => [this.mapCoupon(coupon), ...items]);
          this.couponsPage = 1;
          this.updateTabCount('coupons', String(this.coupons().length));
          this.couponForm.reset({ code: '', discountPercent: 10, usageLimit: null, validUntil: '', active: true });
          this.showTopMessage('Coupon code created.', 2600);
        },
        error: (error) => {
          this.couponFormError = this.authService.getErrorMessage(error);
        }
      });
  }

  deleteCoupon(coupon: AdminCoupon): void {
    if (this.deletingCouponId) {
      return;
    }

    this.openConfirmDialog('Delete coupon?', coupon.code, 'Delete', 'danger', () => {
    this.deletingCouponId = coupon.id;
    this.adminService.deleteCoupon(coupon.id)
      .pipe(finalize(() => {
        this.deletingCouponId = undefined;
      }))
      .subscribe({
        next: () => {
          this.coupons.update((items) => items.filter((item) => item.id !== coupon.id));
          this.clampAdminPages();
          this.updateTabCount('coupons', String(this.coupons().length));
          this.showTopMessage('Coupon deleted.', 2600);
        },
        error: (error) => {
          this.showTopMessage(this.authService.getErrorMessage(error), 3200);
        }
      });
    });
  }

  toggleCouponActive(coupon: AdminCoupon): void {
    if (this.updatingCouponStatusId) {
      return;
    }

    const nextActive = !coupon.active;
    this.updatingCouponStatusId = coupon.id;
    this.coupons.update((items) => items.map((item) => item.id === coupon.id ? { ...item, active: nextActive } : item));
    this.adminService.setCouponActive(coupon.id, nextActive)
      .pipe(finalize(() => {
        this.updatingCouponStatusId = undefined;
      }))
      .subscribe({
        next: (updatedCoupon) => {
          this.coupons.update((items) => items.map((item) => item.id === updatedCoupon.id ? this.mapCoupon(updatedCoupon) : item));
          this.showTopMessage(`Coupon ${updatedCoupon.active ? 'activated' : 'deactivated'}.`, 2400);
        },
        error: (error) => {
          this.coupons.update((items) => items.map((item) => item.id === coupon.id ? { ...item, active: coupon.active } : item));
          this.showTopMessage(this.authService.getErrorMessage(error), 3200);
        }
      });
  }

  couponUsageLabel(coupon: AdminCoupon): string {
    return coupon.usageLimit ? `${coupon.usedCount}/${coupon.usageLimit} used` : `${coupon.usedCount} used`;
  }

  couponExpiryLabel(coupon: AdminCoupon): string {
    return coupon.validUntil ? formatDate(coupon.validUntil, 'mediumDate', 'en-IN') : 'No expiry date';
  }

  submitBlogPost(): void {
    this.blogFormError = '';
    this.blogForm.controls.slug.setValue(this.slugify(this.blogForm.controls.slug.value || this.blogForm.controls.title.value), { emitEvent: false });

    if (this.blogForm.invalid || this.isSubmittingBlog || (!this.blogForm.controls.coverImage.value && !this.selectedBlogCoverFile)) {
      this.blogForm.markAllAsTouched();
      this.blogFormError = 'Enter the title, slug, author, date, category, content, status, and choose a cover image.';
      return;
    }

    this.isSubmittingBlog = true;
    if (this.selectedBlogCoverFile) {
      this.adminService.uploadImage(this.selectedBlogCoverFile).subscribe({
        next: (upload) => {
          this.blogForm.controls.coverImage.setValue(upload.imageUrl);
          this.submitBlogPostRequest();
        },
        error: (error) => {
          this.isSubmittingBlog = false;
          this.blogFormError = this.authService.getErrorMessage(error);
        }
      });
      return;
    }

    this.submitBlogPostRequest();
  }

  private submitBlogPostRequest(): void {
    const request = this.blogForm.getRawValue();
    const save = this.editingBlogPostId
      ? this.adminService.updateBlogPost(this.editingBlogPostId, request)
      : this.adminService.createBlogPost(request);

    save.pipe(finalize(() => {
      this.isSubmittingBlog = false;
    })).subscribe({
      next: (post) => {
        const mappedPost = this.mapBlogPostResponse(post);
        if (this.editingBlogPostId) {
          this.blogPosts.update((items) => items.map((item) => item.id === mappedPost.id ? mappedPost : item));
          this.showTopMessage('Blog post updated.', 2200);
        } else {
          this.blogPosts.update((items) => [mappedPost, ...items]);
          this.showTopMessage('Blog post created.', 2200);
        }
        this.updateContentTabCount();
        this.startNewBlogPost();
      },
      error: (error) => {
        this.blogFormError = this.authService.getErrorMessage(error);
      }
    });
  }

  deleteBlogPost(): void {
    if (!this.editingBlogPostId || this.isSubmittingBlog) {
      return;
    }

    const post = this.blogPosts().find((item) => item.id === this.editingBlogPostId);
    const postId = this.editingBlogPostId;
    this.openConfirmDialog('Delete blog post?', post?.title ?? 'This post will be removed.', 'Delete', 'danger', () => {
    this.isSubmittingBlog = true;
    this.adminService.deleteBlogPost(postId)
      .pipe(finalize(() => {
        this.isSubmittingBlog = false;
      }))
      .subscribe({
        next: () => {
          this.blogPosts.update((items) => items.filter((item) => item.id !== postId));
          this.clampAdminPages();
          this.updateContentTabCount();
          this.startNewBlogPost();
          this.showTopMessage('Blog post deleted.', 2200);
        },
        error: (error) => {
          this.blogFormError = this.authService.getErrorMessage(error);
        }
      });
    });
  }

  submitGalleryImage(): void {
    this.galleryFormError = '';
    if (this.galleryForm.invalid || !this.selectedGalleryFile || this.isSubmittingGallery) {
      this.galleryForm.markAllAsTouched();
      this.galleryFormError = 'Choose an image, enter alt text, and set a display order.';
      return;
    }

    const value = this.galleryForm.getRawValue();
    const formData = new FormData();
    formData.append('image', this.selectedGalleryFile);
    formData.append('altText', value.altText);
    formData.append('displayOrder', String(value.displayOrder));
    formData.append('wide', String(value.wide));
    formData.append('tall', String(value.tall));
    formData.append('active', String(value.active));

    this.isSubmittingGallery = true;
    this.galleryService.uploadGalleryImage(formData)
      .pipe(finalize(() => {
        this.isSubmittingGallery = false;
      }))
      .subscribe({
        next: (image) => {
          const nextImages = [...this.galleryImages(), this.mapGalleryImage(image)]
            .sort((a, b) => a.displayOrder - b.displayOrder || b.id - a.id);
          this.galleryImages.set(nextImages);
          this.updateContentTabCount();
          this.galleryForm.reset({
            altText: '',
            displayOrder: nextImages.length + 1,
            wide: false,
            tall: false,
            active: true
          });
          this.clearGalleryFile();
          this.showTopMessage('Gallery image added.', 2600);
        },
        error: (error) => {
          this.galleryFormError = this.authService.getErrorMessage(error);
        }
      });
  }

  deleteGalleryImage(image: AdminGalleryImage): void {
    this.galleryService.deleteGalleryImage(image.id).subscribe({
      next: () => {
        const nextImages = this.galleryImages().filter((item) => item.id !== image.id);
        this.galleryImages.set(nextImages);
        this.updateContentTabCount();
        this.showTopMessage('Gallery image deleted.', 2200);
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  viewReview(review: AdminReview): void {
    this.selectedReview = review;
    this.reviewReplyDraft = review.adminReply;
  }

  replyToReviewFromList(review: AdminReview): void {
    this.viewReview(review);
    window.setTimeout(() => document.getElementById('reviewReplyEditor')?.focus());
  }

  saveReviewReply(review: AdminReview): void {
    if (this.isSavingReviewReply) {
      return;
    }

    this.isSavingReviewReply = true;
    this.adminService.replyToReview(review.id, this.reviewReplyDraft.trim())
      .pipe(finalize(() => {
        this.isSavingReviewReply = false;
      }))
      .subscribe({
        next: (updatedReview) => {
          const mappedReview = this.mapReview(updatedReview);
          this.reviews.update((items) => items.map((item) => item.id === mappedReview.id ? mappedReview : item));
          this.selectedReview = mappedReview;
          this.reviewReplyDraft = mappedReview.adminReply;
          this.showTopMessage('Review reply saved.', 2200);
        },
        error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
      });
  }

  clearReviewReply(review: AdminReview): void {
    this.reviewReplyDraft = '';
    this.saveReviewReply(review);
  }

  deleteReview(review: AdminReview): void {
    this.openConfirmDialog('Delete review?', review.name, 'Delete', 'danger', () => {
    this.adminService.deleteReview(review.id).subscribe({
      next: () => {
        this.reviews.update((items) => items.filter((item) => item.id !== review.id));
        if (this.selectedReview?.id === review.id) {
          this.selectedReview = undefined;
          this.reviewReplyDraft = '';
        }
        this.clampAdminPages();
        this.updateTabCount('reviews', String(this.reviews().length));
        this.showTopMessage('Review deleted.', 2200);
      },
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
    });
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
          this.employees.update((items) => [employee, ...items.filter((item) => item.userId !== employee.userId)]);
          this.updateTabCount('employees', String(this.employees().length));
          this.employeeView.set('manage');
          this.employeeForm.reset({
            fullName: '',
            email: '',
            mobile: '',
            role: 'MANAGER',
            password: ''
          });
          this.showTopMessage('Employee account created.', 2600);
        },
        error: (error) => {
          this.showTopMessage(this.authService.getErrorMessage(error), 3600);
        }
      });
  }

  deleteEmployee(employee: EmployeeResponse): void {
    if (employee.roles.includes('SUPER_ADMIN')) {
      this.showTopMessage('Super Admin account cannot be deleted.', 2600);
      return;
    }
    if (employee.roles.includes('ADMIN') && !this.authService.isSuperAdmin()) {
      this.showTopMessage('Only Super Admin can delete an Admin account.', 2600);
      return;
    }

    this.openConfirmDialog('Delete employee?', employee.fullName, 'Delete', 'danger', () => {
      this.deletingEmployeeId = employee.userId;
      this.adminService.deleteEmployee(employee.userId)
        .pipe(finalize(() => {
          this.deletingEmployeeId = undefined;
        }))
        .subscribe({
          next: () => {
            this.employees.update((items) => items.filter((item) => item.userId !== employee.userId));
            this.employeesPage = Math.min(this.employeesPageCount(), Math.max(1, this.employeesPage));
            this.updateTabCount('employees', String(this.employees().length));
            this.showTopMessage('Employee deleted.', 2400);
          },
          error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
        });
    });
  }

  saveSettings(): void {
    this.adminService.saveSettings(this.settingsForm.getRawValue()).subscribe({
      next: () => this.showTopMessage('Settings saved.', 2600),
      error: (error) => this.showTopMessage(this.authService.getErrorMessage(error), 3600)
    });
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
              : tab === 'reviews'
                ? this.reviews()
                : this.metrics();
    this.downloadCsv(`clickkaar-${tab}.csv`, rows);
  }

  private compareBookingsNewestFirst(a: AdminBooking, b: AdminBooking): number {
    const bookingNumberDiff = this.bookingNumberValue(b.id) - this.bookingNumberValue(a.id);
    if (bookingNumberDiff !== 0) {
      return bookingNumberDiff;
    }
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  }

  private bookingNumberValue(value: string): number {
    const match = value.match(/\d+/g);
    return match?.length ? Number(match.at(-1)) : 0;
  }

  bookedDays(productName: string): number {
    return this.bookings()
      .filter((booking) => booking.products.includes(productName) && booking.status !== 'Cancelled')
      .reduce((sum, booking) => sum + this.daysBetween(booking.startDate, booking.endDate), 0);
  }

  markProductImageFailed(productId: number): void {
    this.products.update((items) => items.map((item) => item.id === productId ? { ...item, imageLoadFailed: true } : item));
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

  private isOutwardBooking(booking: AdminBooking): boolean {
    return booking.status === 'Upcoming';
  }

  private isInwardBooking(booking: AdminBooking): boolean {
    return (booking.status === 'Active' || booking.status === 'Overdue') && booking.returnStatus !== 'Returned';
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

  initials(value?: string | null): string {
    const parts = (value ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) return 'NA';

    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
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
      stock: product.stock ?? (status === 'Available' ? 1 : 0),
      popularity: 0,
      createdAt: '',
      status,
      maintenanceNote: status === 'Maintenance' ? 'Marked from admin panel' : '',
      imageLabel: this.shortImageName(image),
      imageLoadFailed: !image
    };
  }

  private mapBooking(booking: AdminBookingResponse): AdminBooking {
    const savedNotes = (booking.notes ?? [])
      .map((note) => note.trim())
      .filter(Boolean);
    const currentNote = savedNotes.at(-1) ?? '';

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
      notes: currentNote,
      noteLog: savedNotes.slice(0, -1).reverse(),
      deliveryOtpVerified: booking.deliveryOtpVerified
    };
  }

  private mapCustomer(customer: { id: number; customerNumber?: string; name: string; email: string; phone?: string; verified: boolean; blocked: boolean; city?: string; wishlist: number; activeBookings: number; pastBookings: number }): AdminCustomer {
    return {
      id: customer.id,
      customerNumber: customer.customerNumber ?? `CRE-${new Date().getFullYear().toString().slice(-2)}-${String(1000 + customer.id).padStart(4, '0')}`,
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
      id: payment.paymentNumber ?? String(payment.id),
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

  private mapCoupon(coupon: AdminCouponResponse): AdminCoupon {
    return {
      id: coupon.id,
      code: coupon.code,
      discountPercent: Number(coupon.discountPercent),
      active: coupon.active,
      usageLimit: coupon.usageLimit ?? null,
      usedCount: coupon.usedCount ?? 0,
      validUntil: coupon.validUntil ?? null,
      createdAt: coupon.createdAt
    };
  }

  private mapGalleryImage(image: GalleryImage): AdminGalleryImage {
    return {
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText,
      wide: image.wide,
      tall: image.tall,
      active: image.active,
      displayOrder: image.displayOrder,
      createdAt: image.createdAt
    };
  }

  private mapReview(review: AdminReviewResponse): AdminReview {
    return {
      id: review.id,
      name: review.name,
      role: review.role,
      rating: Number(review.rating),
      quote: review.quote,
      adminReply: review.adminReply ?? '',
      createdAt: review.createdAt
    };
  }

  private mapBlogPostResponse(post: AdminBlogPostResponse): BlogPostAdmin {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      coverImage: post.coverImage ?? '',
      category: post.category ?? '',
      author: post.authorName ?? '',
      status: post.status === 'PUBLISHED' ? 'Published' : 'Draft',
      publishDate: post.publishDate ?? '',
      tags: post.tags ?? '',
      seoTitle: post.seoTitle ?? '',
      metaDescription: post.seoDescription ?? '',
      seoKeywords: post.seoKeywords ?? '',
      content: post.content ?? ''
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
      slug: post.slug ?? '',
      coverImage: post.coverImage ?? '',
      category: post.category ?? '',
      author: post.author ?? '',
      status: post.status === 'PUBLISHED' ? 'Published' : 'Draft',
      publishDate: post.publishDate ?? '',
      tags: post.tags ?? '',
      seoTitle: post.seoTitle ?? '',
      metaDescription: post.metaDescription ?? '',
      seoKeywords: post.seoKeywords ?? '',
      content: post.content ?? ''
    })));
    this.staticContent.set(content.staticContent.map((item) => ({
      key: item.key,
      title: item.title,
      owner: 'Admin',
      status: item.status === 'CURRENT' ? 'Current' : 'Needs review',
      updatedAt: item.updatedAt
    })));
    this.clampAdminPages();
    this.updateContentTabCount();
  }

  private updateContentTabCount(): void {
    this.updateTabCount('content', String(this.blogPosts().length + this.galleryImages().length));
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
      stock: Number(value.stock) || 0,
      availabilityStatus: this.productStatusToApi(value.status),
      images: value.image ? [value.image] : []
    };
  }

  private productRequestFromProduct(product: AdminProduct, status: ProductStatus): AdminProductRequest {
    return {
      name: product.name,
      brand: product.brand,
      category: this.categoryToApi(product.category),
      shortDescription: product.description,
      fullDescription: product.description,
      specs: this.specificationsToText(product.specifications),
      dailyPrice: product.dailyPrice,
      weeklyPrice: product.weeklyPrice,
      warrantyDate: product.warrantyDate || undefined,
      invoiceUrl: product.invoiceUrl || undefined,
      stock: product.stock,
      availabilityStatus: this.productStatusToApi(status),
      images: product.gallery?.length ? product.gallery : product.image ? [product.image] : []
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
      Tripods: 'TRIPODS',
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
      PAYMENT_PENDING: 'Upcoming',
      CONFIRMED: 'Upcoming',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      OVERDUE: 'Overdue'
    };
    return labels[status] ?? 'Upcoming';
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

  private shortImageName(image: string): string {
    if (!image) return 'No img';
    const cleanName = decodeURIComponent(image.split(/[?#]/)[0].split('/').filter(Boolean).pop() ?? image)
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim();
    const initials = cleanName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => part.slice(0, 3))
      .join('-');
    return initials || 'Img';
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private specificationsToText(specifications: Record<string, string>): string {
    return Object.entries(specifications)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
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

  private loadVerifiedCustomerDocumentPreviews(customer: AdminCustomerDetailResponse): void {
    this.documentPreviewError = '';
    this.isLoadingDocuments = customer.documents.length > 0;

    if (!customer.documents.length) {
      return;
    }

    let completed = 0;
    const markComplete = () => {
      completed += 1;
      if (completed === customer.documents.length && this.selectedCustomerDetail?.id === customer.id) {
        this.isLoadingDocuments = false;
      }
    };
    customer.documents.forEach((document) => {
      this.adminService.getVerifiedCustomerDocument(customer.id, document.type).subscribe({
        next: (blob) => {
          if (this.selectedCustomerDetail?.id !== customer.id) {
            return;
          }
          this.documentPreviews = {
            ...this.documentPreviews,
            [document.type]: this.createDocumentPreview(document, blob)
          };
        },
        error: (error) => {
          if (this.selectedCustomerDetail?.id === customer.id) {
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

  private clearGalleryPreview(): void {
    if (this.galleryPreviewUrl) {
      URL.revokeObjectURL(this.galleryPreviewUrl);
      this.galleryPreviewUrl = '';
    }
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

  employeesPageCount(): number {
    return this.pageCount(this.filteredEmployees().length);
  }

  changeEmployeesPage(direction: number): void {
    this.employeesPage = this.nextPage(this.employeesPage, this.filteredEmployees().length, direction);
    this.scrollToSectionTop();
  }

  employeesPageSummary(): string {
    const total = this.filteredEmployees().length;
    if (!total) return 'No employees';
    const start = (this.employeesPage - 1) * this.adminPageSize + 1;
    const end = Math.min(total, this.employeesPage * this.adminPageSize);
    return `${start}-${end} of ${total}`;
  }

  employeeCountByRole(role: string): number {
    return this.employees().filter((employee) => employee.roles.includes(role)).length;
  }

  employeeRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Admin',
      MANAGER: 'Manager',
      INVENTORY_STAFF: 'Inventory Staff',
      CONTENT_EDITOR: 'Content Editor'
    };
    return labels[role] ?? role;
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

  private scrollToSectionTop(): void {
    this.scrollToActiveSection();
  }

  private scrollToActiveSection(preferredSelector?: string): void {
    window.setTimeout(() => {
      const isMobile = window.matchMedia('(max-width: 760px)').matches;
      const preferredTarget = preferredSelector ? document.querySelector(preferredSelector) : null;
      const target = preferredTarget ?? (isMobile
        ? document.querySelector('.admin-workspace') ?? document.querySelector('.admin-page')
        : document.querySelector('.admin-page'));
      if (!target) return;
      if (isMobile) {
        return;
      }
      this.smoothScrollToElement(target, 92, 900);
    });
  }

  private smoothScrollToElement(target: Element, stickyOffset: number, duration: number): void {
    const start = window.scrollY;
    const end = Math.max(0, target.getBoundingClientRect().top + window.scrollY - stickyOffset);
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  private clampAdminPages(): void {
    this.inventoryPage = Math.min(this.pageCount(this.filteredProducts().length), Math.max(1, this.inventoryPage));
    this.bookingsPage = Math.min(this.pageCount(this.filteredBookings().length), Math.max(1, this.bookingsPage));
    this.customersPage = Math.min(this.pageCount(this.filteredCustomers().length), Math.max(1, this.customersPage));
    this.paymentsPage = Math.min(this.pageCount(this.payments().length), Math.max(1, this.paymentsPage));
    this.couponsPage = Math.min(this.pageCount(this.coupons().length), Math.max(1, this.couponsPage));
    this.reviewsPage = Math.min(this.pageCount(this.filteredReviews().length), Math.max(1, this.reviewsPage));
    this.blogPage = Math.min(this.pageCount(this.blogPosts().length), Math.max(1, this.blogPage));
    this.staticContentPage = Math.min(this.pageCount(this.staticContent().length), Math.max(1, this.staticContentPage));
  }

  private openConfirmDialog(title: string, message: string, actionLabel: string, tone: AdminConfirmDialog['tone'], onConfirm: () => void): void {
    this.confirmDialog = { title, message, actionLabel, tone, onConfirm };
    window.setTimeout(() => {
      document.querySelector('.admin-confirm-dialog')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  cancelConfirmDialog(): void {
    this.confirmDialog = undefined;
  }

  acceptConfirmDialog(): void {
    const action = this.confirmDialog?.onConfirm;
    this.confirmDialog = undefined;
    action?.();
  }

  private showTopMessage(message: string, duration: number): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-screen-center']
    });
  }
}





















































