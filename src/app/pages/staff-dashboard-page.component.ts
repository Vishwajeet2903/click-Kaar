import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminBookingResponse,
  AdminContentResponse,
  AdminCustomerResponse,
  AdminPaymentResponse,
  AdminProductResponse,
  AdminBlogPostRequest,
  AdminBlogPostResponse,
  AdminService
} from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { GalleryImage, GalleryService } from '../services/gallery.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

interface StaffGalleryImage {
  id: number;
  imageUrl: string;
  altText: string;
  wide: boolean;
  tall: boolean;
  active: boolean;
  displayOrder: number;
  createdAt: string;
}

interface StaffBlogPost {
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
type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,64}$/;

@Component({
  selector: 'app-staff-dashboard-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, FormsModule, ReactiveFormsModule, MatSnackBarModule, BreadcrumbComponent],
  template: `
    <app-breadcrumb [label]="dashboardTitle()" />
    <section class="container staff-dashboard">
      <h1 class="section-title">{{ dashboardTitle() }}</h1>
      <header class="surface profile-panel">
        <div class="hero-copy">
          <p class="eyebrow">{{ roleLabel() }}</p>
          <h2>{{ dashboardTitle() }}</h2>
          <p>{{ dashboardIntro() }}</p>
        </div>
        <div class="profile-actions">
          <button type="button" class="settings-btn" [class.active-settings]="showSettings()" (click)="toggleSettings()">Settings</button>
        </div>
      </header>

      <div class="metric-grid">
        @for (metric of metrics(); track metric.label) {
          <article class="surface metric-card">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <small>{{ metric.note }}</small>
          </article>
        }
      </div>

      @if (showSettings()) {
        <section class="surface panel password-panel">
          <div class="panel-head"><h2>Change password</h2><span>Settings</span></div>
          <p class="muted">Update your password using your current password for verification.</p>
          @if (passwordError) {
            <p class="form-alert" role="alert">{{ passwordError }}</p>
          }
          <form class="password-form" [formGroup]="passwordForm" (ngSubmit)="changePassword()">
            <label>
              <span>Current password</span>
              <input type="password" placeholder="Enter current password" formControlName="currentPassword">
              @if (passwordFieldError('currentPassword')) {
                <small class="field-error">{{ passwordFieldError('currentPassword') }}</small>
              }
            </label>
            <label>
              <span>New password</span>
              <input type="password" placeholder="8+ chars with A-z, 0-9, symbol" formControlName="newPassword">
              @if (passwordFieldError('newPassword')) {
                <small class="field-error">{{ passwordFieldError('newPassword') }}</small>
              }
            </label>
            <label [class.password-mismatch]="passwordSubmitted && !passwordsMatch()">
              <span>Confirm password</span>
              <input type="password" placeholder="Re-enter new password" formControlName="confirmPassword">
              @if (passwordFieldError('confirmPassword') || passwordMismatchError()) {
                <small class="field-error">{{ passwordFieldError('confirmPassword') || passwordMismatchError() }}</small>
              }
            </label>
            <button class="save-btn" type="submit" [disabled]="isChangingPassword">
              {{ isChangingPassword ? 'Updating...' : 'Update password' }}
            </button>
          </form>
        </section>
      }

      @if (canUseInventory()) {
        <section class="surface panel">
          <div class="panel-head">
            <h2>Inventory</h2>
            @if (canEditInventory()) {
              <a routerLink="/admin/inventory/new">Add product</a>
            }
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Category</th><th>Daily price</th><th>Status</th>@if (canEditInventory()) { <th>Actions</th> }</tr></thead>
              <tbody>
                @for (product of pagedInventory(); track product.id) {
                  <tr>
                    <td><strong>{{ product.name }}</strong><span>{{ product.brand }}</span></td>
                    <td>{{ product.category }}</td>
                    <td>{{ product.dailyPrice | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td>{{ product.availabilityStatus }}</td>
                    @if (canEditInventory()) {
                      <td><a class="table-action" [routerLink]="['/admin/inventory/edit', product.id]">Edit</a></td>
                    }
                  </tr>
                }
                @if (!inventory().length) {
                  <tr><td [attr.colspan]="canEditInventory() ? 5 : 4" class="empty-cell">No inventory items found.</td></tr>
                }
              </tbody>
            </table>
          </div>
          @if (inventory().length > inventoryPageSize) {
            <div class="pager">
              <span>{{ inventoryPageSummary() }}</span>
              <div>
                <button type="button" [disabled]="inventoryPage() === 1" (click)="changeInventoryPage(-1)">Previous</button>
                <button type="button" [disabled]="inventoryPage() === inventoryPageCount()" (click)="changeInventoryPage(1)">Next</button>
              </div>
            </div>
          }
        </section>
      }

      @if (canUseInwardOutward()) {
        <section class="surface panel movement-panel">
          <div class="panel-head"><h2>Inward & Outward</h2><span>{{ outwardBookings().length + inwardBookings().length }} active tasks</span></div>
          <div class="movement-grid">
            <section class="movement-column">
              <div class="panel-head compact-head"><h2>Outward deliveries</h2><span>{{ outwardBookings().length }} to give</span></div>
              <div class="list-grid single-list">
                @for (booking of outwardBookings(); track booking.id) {
                  <button type="button" class="list-row movement-row clickable-movement" [class.selected-movement]="selectedOutwardBooking?.id === booking.id" (click)="openOutwardDetails(booking)">
                    <strong>{{ booking.bookingNumber }}</strong>
                    <span>{{ booking.customer }}{{ booking.phone ? ' - ' + booking.phone : '' }}</span>
                    <small>{{ booking.products.join(', ') }}</small>
                    <b>Deliver on {{ booking.startDate | date:'mediumDate' }} - {{ formatReturnStatus(booking.paymentStatus) }}</b>
                  </button>
                } @empty {
                  <p class="muted">No outward deliveries are pending.</p>
                }
              </div>
            </section>

            <section class="movement-column">
              <div class="panel-head compact-head"><h2>Inward returns</h2><span>{{ inwardBookings().length }} to collect</span></div>
              <div class="list-grid single-list">
                @for (booking of inwardBookings(); track booking.id) {
                  <button type="button" class="list-row movement-row clickable-movement" [class.selected-movement]="selectedOutwardBooking?.id === booking.id" (click)="openOutwardDetails(booking)">
                    <strong>{{ booking.bookingNumber }}</strong>
                    <span>{{ booking.customer }}{{ booking.phone ? ' - ' + booking.phone : '' }}</span>
                    <small>{{ booking.products.join(', ') }}</small>
                    <b>Return by {{ booking.endDate | date:'mediumDate' }} - {{ formatReturnStatus(booking.returnStatus) }}</b>
                  </button>
                } @empty {
                  <p class="muted">No equipment returns are pending.</p>
                }
              </div>
            </section>
          </div>

          @if (selectedOutwardBooking) {
            <section class="outward-detail-panel">
              <div class="outward-detail-top">
                <div>
                  <p class="eyebrow">Order details</p>
                  <h2>{{ selectedOutwardBooking.bookingNumber }}</h2>
                </div>
                <b class="payment-status" [class]="paymentStatusClass(selectedOutwardBooking.paymentStatus)">{{ formatReturnStatus(selectedOutwardBooking.paymentStatus) }}</b>
              </div>
              <dl class="outward-detail-grid">
                <div><dt>Customer</dt><dd>{{ selectedOutwardBooking.customer }}</dd></div>
                <div><dt>Phone</dt><dd>{{ selectedOutwardBooking.phone || '-' }}</dd></div>
                <div><dt>Delivery date</dt><dd>{{ selectedOutwardBooking.startDate | date:'mediumDate' }}</dd></div>
                <div><dt>Return date</dt><dd>{{ selectedOutwardBooking.endDate | date:'mediumDate' }}</dd></div>
                <div><dt>Payment status</dt><dd>{{ formatReturnStatus(selectedOutwardBooking.paymentStatus) }}</dd></div>
                <div><dt>Booking status</dt><dd>{{ formatReturnStatus(selectedOutwardBooking.status) }}</dd></div>
                <div><dt>Delivery OTP</dt><dd>{{ selectedOutwardBooking.deliveryOtpVerified ? 'Verified' : 'Pending verification' }}</dd></div>
                <div class="wide-detail"><dt>Equipment</dt><dd>{{ selectedOutwardBooking.products.join(', ') }}</dd></div>
              </dl>
              <div class="otp-panel">
                <label>Delivery OTP<input inputmode="numeric" maxlength="6" placeholder="Enter customer OTP" [ngModel]="deliveryOtpDraft" (ngModelChange)="deliveryOtpDraft = $event"></label>
                <button type="button" class="save-btn" [disabled]="selectedOutwardBooking.deliveryOtpVerified" (click)="confirmDeliveryOtp()">{{ selectedOutwardBooking.deliveryOtpVerified ? 'OTP verified' : 'Confirm OTP' }}</button>
                <button type="button" class="ghost-mini" (click)="closeOutwardDetails()">Close</button>
              </div>
            </section>
          }
        </section>
      }
      @if (canUseBookings()) {
        <section class="surface panel">
          <div class="panel-head"><h2>Bookings</h2><span>{{ bookings().length }} total</span></div>
          <div class="list-grid">
            @for (booking of bookings().slice(0, 4); track booking.id) {
              <article class="list-row">
                <strong>{{ booking.bookingNumber }}</strong>
                <span>{{ booking.customer }} - {{ booking.products.join(', ') }}</span>
                <small>{{ booking.startDate | date:'mediumDate' }} to {{ booking.endDate | date:'mediumDate' }}</small>
              </article>
            }
          </div>
        </section>
      }

      @if (canUseCustomers()) {
        <section class="surface panel">
          <div class="panel-head"><h2>Customers</h2><span>{{ customers().length }} listed</span></div>
          <div class="list-grid compact">
            @for (customer of customers().slice(0, 6); track customer.id) {
              <article class="list-row">
                <strong>{{ customer.name }}</strong>
                <span>{{ customer.email }}</span>
                <small>{{ customer.city || 'City not added' }}</small>
              </article>
            }
          </div>
        </section>
      }

      @if (canUsePayments()) {
        <section class="surface panel">
          <div class="panel-head"><h2>Payments</h2><span>{{ payments().length }} records</span></div>
          <div class="list-grid compact">
            @for (payment of payments().slice(0, 6); track payment.id) {
              <article class="list-row">
                <strong>{{ payment.amount | currency:'INR':'symbol':'1.0-0' }}</strong>
                <span>{{ payment.customer }} - {{ payment.bookingId }}</span>
                <small>{{ payment.status }}</small>
              </article>
            }
          </div>
        </section>
      }

      @if (canUseContent()) {
        <section class="surface panel content-workbench">
          <div class="panel-head"><h2>Content</h2><span>{{ contentCount() }} items</span></div>
          <div class="content-switcher">
            <button type="button" [class.active-content]="activeContentSection() === 'blog'" (click)="setContentSection('blog')">Blog</button>
            <button type="button" [class.active-content]="activeContentSection() === 'gallery'" (click)="setContentSection('gallery')">Gallery</button>
          </div>

          @if (activeContentSection() === 'blog') {
            <div class="content-grid">
              <section class="content-list">
                <div class="panel-head"><h2>Blog posts</h2><button type="button" class="mini-btn" (click)="startNewBlogPost()">New post</button></div>
                <div class="list-grid blog-list">
                  @for (post of blogPosts(); track post.id) {
                    <article class="list-row clickable-row" [class.active-row]="editingBlogPostId === post.id" (click)="editBlogPost(post)" tabindex="0" role="button" [attr.aria-label]="'Edit blog post ' + post.title" (keydown.enter)="editBlogPost(post)" (keydown.space)="editBlogPost(post)">
                      <strong>{{ post.title }}</strong>
                      <span>{{ post.category || 'Blog' }} - {{ post.author || 'Clickkaar Team' }}</span>
                      <small>{{ post.status }}{{ post.publishDate ? ' - ' + (post.publishDate | date:'mediumDate') : '' }}</small>
                    </article>
                  } @empty {
                    <p class="muted">No blog posts yet.</p>
                  }
                </div>
              </section>

              <form class="content-editor-form" [formGroup]="blogForm" (ngSubmit)="submitBlogPost()">
                <div class="panel-head">
                  <h2>{{ editingBlogPostId ? 'Edit blog post' : 'Create blog post' }}</h2>
                  @if (editingBlogPostId) {
                    <button type="button" class="ghost-mini" (click)="startNewBlogPost()">Cancel edit</button>
                  }
                </div>
                @if (blogFormError) {
                  <p class="form-alert" role="alert">{{ blogFormError }}</p>
                }
                <div class="editor-grid">
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
                <div class="form-actions">
                  @if (editingBlogPostId) {
                    <button type="button" class="danger-btn" [disabled]="isSubmittingBlog" (click)="deleteBlogPost()">Delete</button>
                  }
                  <button type="submit" class="save-btn" [disabled]="isSubmittingBlog">{{ isSubmittingBlog ? 'Saving...' : editingBlogPostId ? 'Update post' : 'Create post' }}</button>
                </div>
              </form>
            </div>
          }

          @if (activeContentSection() === 'gallery') {
            <div class="content-grid">
              <form class="content-editor-form" [formGroup]="galleryForm" (ngSubmit)="submitGalleryImage()">
                <div class="panel-head"><h2>Add gallery image</h2><span>Gallery</span></div>
                @if (galleryFormError) {
                  <p class="form-alert" role="alert">{{ galleryFormError }}</p>
                }
                <div class="gallery-upload-flow">
                  <label class="gallery-upload-box" [class.has-preview]="galleryPreviewUrl">
                    <input type="file" accept="image/*" (change)="setGalleryFile($event)">
                    @if (galleryPreviewUrl) {
                      <img [src]="galleryPreviewUrl" [alt]="galleryForm.controls.altText.value || 'Selected gallery image preview'">
                    } @else {
                      <b>Choose image</b>
                      <small>JPG, PNG, or WebP up to 10MB</small>
                    }
                  </label>
                  <div class="editor-grid single-column">
                    <label>Alt text<input formControlName="altText" placeholder="Describe the image"></label>
                    <label>Display order<input type="number" formControlName="displayOrder" min="1"></label>
                    <label class="checkbox-label"><input type="checkbox" formControlName="wide"><span>Wide tile</span></label>
                    <label class="checkbox-label"><input type="checkbox" formControlName="tall"><span>Tall tile</span></label>
                    <label class="checkbox-label"><input type="checkbox" formControlName="active"><span>Show on site</span></label>
                    @if (galleryFileName) {
                      <div class="selected-file"><span>{{ galleryFileName }}</span><button type="button" class="ghost-mini" (click)="clearGalleryFile()">Remove</button></div>
                    }
                    <button type="submit" class="save-btn" [disabled]="isSubmittingGallery">{{ isSubmittingGallery ? 'Adding...' : 'Add image' }}</button>
                  </div>
                </div>
              </form>

              <section class="content-list">
                <div class="panel-head"><h2>Gallery images</h2><button type="button" class="ghost-mini" (click)="loadGalleryImages()">Refresh</button></div>
                <div class="gallery-admin-grid">
                  @for (image of galleryImages(); track image.id) {
                    <article>
                      <img [src]="image.imageUrl" [alt]="image.altText">
                      <div><strong>{{ image.altText }}</strong><span>Order {{ image.displayOrder }} - {{ image.active ? 'Live' : 'Hidden' }}</span></div>
                      <button type="button" class="danger-btn" (click)="deleteGalleryImage(image)">Delete</button>
                    </article>
                  } @empty {
                    <p class="muted">No gallery images have been added yet.</p>
                  }
                </div>
              </section>
            </div>
          }
        </section>
      }
    </section>
  `,
  styles: [`
    .staff-dashboard { display: grid; gap: 1rem; max-width: 95vw !important; padding-bottom: 2rem; }
    .staff-dashboard .section-title { font-size: clamp(1.75rem, 3.4vw, 3rem); letter-spacing: 0; line-height: 1.08; margin-bottom: .1rem; text-align: left; }
    .surface { background: #fff; border: 1px solid rgba(17,17,17,.09); border-radius: 8px; box-shadow: 0 18px 45px rgba(17,17,17,.06); }
    .profile-panel { align-items: center; display: flex; gap: 1rem; justify-content: space-between; padding: 1.2rem; }
    .hero-copy { min-width: 0; }
    h2 { color: #111827; font-size: 1.2rem; font-weight: 900; letter-spacing: 0; line-height: 1.25; margin: 0 0 .35rem; }
    .profile-panel p:not(.eyebrow) { color: #555; font-size: .94rem; font-weight: 500; line-height: 1.55; margin: 0; }
    .profile-actions { align-items: center; display: flex; flex: 0 0 auto; flex-wrap: wrap; gap: .6rem; justify-content: flex-end; }
    .settings-btn, .panel-head a, .pager button, .save-btn { align-items: center; border: 0; border-radius: 999px; cursor: pointer; display: inline-flex; font-weight: 850; justify-content: center; min-height: 46px; padding: .75rem 1.1rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease, border-color .25s ease; }
    .settings-btn { background: #fff; border: 1px solid rgba(17,17,17,.12); color: #111; flex: 0 0 auto; font-size: .9rem; }
    .settings-btn:hover, .settings-btn.active-settings { background: #111; border-color: #111; color: #fff; transform: translateY(-2px); }
    .metric-grid { display: grid; gap: .85rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .metric-card { display: grid; gap: .35rem; min-height: 104px; padding: 1.2rem; }
    .metric-card span, .panel-head span, small { color: #777; font-size: .78rem; font-weight: 900; text-transform: uppercase; }
    .metric-card strong { color: #111827; font-size: clamp(1.1rem, 2vw, 1.75rem); font-weight: 950; line-height: 1; overflow-wrap: anywhere; }
    .metric-card small { line-height: 1.35; text-transform: none; }
    .panel { display: grid; gap: 1rem; padding: 1.2rem; }
    .panel-head { align-items: center; display: flex; gap: 1rem; justify-content: space-between; }
    .panel-head h2 { font-size: 1.08rem; margin: 0; }
    .panel-head a { background: #111; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; font-size: .9rem; text-decoration: none; }
    .table-action { color: #ff9700; font-size: .82rem; font-weight: 900; text-decoration: none; }
    .table-action:hover { color: #111; text-decoration: underline; }
    .panel-head a:hover, .pager button:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #fff; transform: translateY(-2px); }
    .table-wrap { overflow-x: auto; }
    table { border-collapse: collapse; min-width: 720px; width: 100%; }
    th, td { border-bottom: 1px solid rgba(17,17,17,.08); padding: .8rem; text-align: left; vertical-align: top; }
    th { color: #777; font-size: .72rem; font-weight: 900; text-transform: uppercase; }
    td strong, article strong { color: #111; display: block; font-weight: 900; }
    td span, article span { color: #555; display: block; font-size: .9rem; margin-top: .2rem; }
    .empty-cell { color: #777; font-weight: 800; text-align: center; }
    .pager { align-items: center; display: flex; gap: 1rem; justify-content: space-between; }
    .pager span { color: #777; font-size: .82rem; font-weight: 850; }
    .pager div { display: flex; gap: .5rem; }
    .pager button { background: #fff; border: 1px solid rgba(17,17,17,.12); color: #111; font-size: .86rem; min-height: 42px; min-width: 92px; padding: .65rem 1rem; }
    .pager button:disabled, .pager button:disabled:hover { background: #fff; border-color: rgba(17,17,17,.12); box-shadow: none; color: #777; cursor: not-allowed; opacity: .55; transform: none; }
    .list-grid { display: grid; gap: .75rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .list-grid.compact { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .list-row { background: #fff; border: 1px solid rgba(17,17,17,.09); border-radius: 8px; box-shadow: 0 18px 45px rgba(17,17,17,.06); padding: 1rem; }
    .movement-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .movement-column { background: #fff; border: 1px solid rgba(17,17,17,.09); border-radius: 8px; display: grid; gap: .85rem; min-width: 0; padding: 1rem; }
    .compact-head { align-items: flex-start; border-bottom: 1px solid rgba(17,17,17,.08); padding-bottom: .75rem; }
    .single-list { grid-template-columns: 1fr; }
    .movement-row { display: grid; gap: .35rem; }
    .movement-row b { color: #027a48; font-size: .82rem; font-weight: 900; line-height: 1.35; }
    .clickable-movement { cursor: pointer; text-align: left; width: 100%; }
    .clickable-movement:hover, .selected-movement { background: #fffaf2; border-color: rgba(255,151,0,.42); transform: translateY(-1px); }
    .outward-detail-panel { background: #fff; border: 1px solid rgba(17,17,17,.09); border-radius: 8px; display: grid; gap: 1rem; padding: 1rem; }
    .outward-detail-top { align-items: center; border-bottom: 1px solid rgba(17,17,17,.08); display: flex; gap: 1rem; justify-content: space-between; padding-bottom: .85rem; }
    .payment-status { border-radius: 999px; font-size: .8rem; font-weight: 950; padding: .42rem .72rem; text-transform: uppercase; }
    .status-paid { background: rgba(39,174,96,.13); color: #18864b; }
    .status-pending { background: rgba(255,151,0,.16); color: #c66f00; }
    .status-failed { background: rgba(180,35,24,.12); color: #b42318; }
    .status-refunded, .status-neutral { background: rgba(17,17,17,.07); color: #555; }
    .outward-detail-grid { display: grid; gap: .75rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; }
    .outward-detail-grid div { background: #f8f8f6; border: 1px solid rgba(17,17,17,.07); border-radius: 8px; padding: .8rem; }
    .outward-detail-grid dt { color: #777; font-size: .72rem; font-weight: 950; margin-bottom: .3rem; text-transform: uppercase; }
    .outward-detail-grid dd { color: #111; font-weight: 850; line-height: 1.35; margin: 0; overflow-wrap: anywhere; }
    .wide-detail { grid-column: 1 / -1; }
    .otp-panel { align-items: end; display: grid; gap: .75rem; grid-template-columns: minmax(180px, 1fr) auto auto; }
    .otp-panel label { color: #111; font-size: .82rem; font-weight: 900; }
    .otp-panel input { background: #fff; border: 1px solid rgba(17,17,17,.14); border-radius: 8px; color: #111; display: block; font: inherit; font-weight: 700; min-height: 44px; margin-top: .45rem; padding: .65rem .8rem; width: 100%; }
    .password-panel { max-width: 720px; }
    .password-form { display: grid; gap: 1rem; margin-top: .25rem; }
    .password-form label { color: #111; display: block; font-size: .82rem; font-weight: 800; }
    .password-form label span { display: block; margin-bottom: .55rem; }
    .password-form input { background: #fff; border: 1px solid rgba(17,17,17,.14); border-radius: 8px; color: #111; display: block; font: inherit; font-weight: 600; min-height: 46px; outline: 0; padding: .75rem 1rem; transition: border-color .25s ease, box-shadow .25s ease; width: 100%; }
    .password-form input:focus { border-color: rgba(255,151,0,.95); box-shadow: 0 0 0 4px rgba(255,151,0,.18); }
    .password-form input.ng-invalid.ng-touched, .password-mismatch input { background: #fff4f2; border-color: rgba(180,35,24,.72); box-shadow: 0 0 0 4px rgba(180,35,24,.12); }
    .password-form label:has(input.ng-invalid.ng-touched) span, .password-mismatch span { color: #b42318; }
    .field-error { color: #b42318; display: block; font-size: .78rem; font-weight: 850; line-height: 1.35; margin-top: .45rem; }
    .form-alert { background: #fff4f2; border: 1px solid rgba(180,35,24,.24); border-radius: 8px; color: #b42318; font-size: .9rem; font-weight: 800; line-height: 1.45; margin: 0; padding: .85rem 1rem; }
    .save-btn { background: #111; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; width: min(220px, 100%); }
    .save-btn:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #fff; transform: translateY(-2px); }
    .save-btn:disabled, .save-btn:disabled:hover { background: #111; box-shadow: none; color: #fff; cursor: not-allowed; opacity: .68; transform: none; }
    .content-workbench { align-content: start; }
    .content-switcher { align-items: center; display: inline-flex; gap: .45rem; justify-self: start; padding: .35rem; }
    .content-switcher button, .mini-btn, .ghost-mini, .danger-btn { align-items: center; border: 0; border-radius: 999px; cursor: pointer; display: inline-flex; font-size: .82rem; font-weight: 900; justify-content: center; min-height: 36px; padding: .5rem .85rem; transition: transform .2s ease, background .2s ease, color .2s ease, border-color .2s ease, box-shadow .2s ease; }
    .content-switcher button { background: transparent; color: #555; }
    .content-switcher button:hover, .content-switcher button.active-content { background: #111; color: #fff; }
    .mini-btn { background: #111; box-shadow: 0 10px 22px rgba(0,0,0,.14); color: #fff; }
    .ghost-mini { background: #fff; border: 1px solid rgba(17,17,17,.12); color: #111; }
    .danger-btn { background: #fff1f1; border: 1px solid rgba(180,35,24,.16); color: #b42318; }
    .mini-btn:hover, .ghost-mini:hover { background: #ff9700; color: #fff; transform: translateY(-1px); }
    .danger-btn:hover { background: #b42318; color: #fff; transform: translateY(-1px); }
    .content-grid { align-items: start; display: grid; gap: 1rem; grid-template-columns: minmax(280px, .8fr) minmax(0, 1.2fr); }
    .content-list, .content-editor-form { background: #fff; border: 1px solid rgba(17,17,17,.09); border-radius: 8px; display: grid; gap: 1rem; padding: 1rem; }
    .blog-list { grid-template-columns: 1fr; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover, .active-row { background: #fffaf2; border-color: rgba(255,151,0,.42); }
    .editor-grid { display: grid; gap: .85rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .editor-grid.single-column { grid-template-columns: 1fr; }
    .editor-grid .wide-field { grid-column: 1 / -1; }
    .editor-grid label, .file-field, .checkbox-label { color: #111; display: block; font-size: .82rem; font-weight: 850; min-width: 0; }
    .editor-grid label > span, .file-field > span { display: block; margin-top: .35rem; }
    .editor-grid input, .editor-grid select, .editor-grid textarea { background: #fff; border: 1px solid rgba(17,17,17,.14); border-radius: 8px; color: #111; display: block; font: inherit; font-size: .92rem; font-weight: 600; min-height: 42px; outline: 0; padding: .68rem .8rem; width: 100%; }
    .editor-grid textarea { resize: vertical; }
    .file-field input { margin-top: .55rem; }
    .checkbox-label { align-items: center; display: flex; gap: .55rem; }
    .checkbox-label input { min-height: auto; width: auto; }
    .form-actions { align-items: center; display: flex; flex-wrap: wrap; gap: .7rem; justify-content: flex-end; }
    .gallery-upload-flow { display: grid; gap: 1rem; }
    .gallery-upload-box { align-items: center; background: #f7f7f4; border: 1px dashed rgba(17,17,17,.24); border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; justify-content: center; min-height: 180px; overflow: hidden; padding: .75rem; text-align: center; }
    .gallery-upload-box input { display: none; }
    .gallery-upload-box img { height: 100%; max-height: 260px; object-fit: contain; width: 100%; }
    .gallery-upload-box b { color: #111; }
    .selected-file { align-items: center; background: #f7f7f4; border: 1px solid rgba(17,17,17,.09); border-radius: 8px; display: flex; gap: .6rem; justify-content: space-between; padding: .55rem .65rem; }
    .gallery-admin-grid { display: grid; gap: .75rem; }
    .gallery-admin-grid article { align-items: center; border: 1px solid rgba(17,17,17,.09); border-radius: 8px; display: grid; gap: .7rem; grid-template-columns: 76px minmax(0, 1fr) auto; padding: .65rem; }
    .gallery-admin-grid img { aspect-ratio: 1; border-radius: 6px; object-fit: cover; width: 76px; }
    @media (max-width: 900px) {
      .metric-grid, .list-grid.compact, .content-grid, .movement-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .list-grid, .editor-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 560px) {
      .staff-dashboard, .staff-dashboard * { box-sizing: border-box; }
      .staff-dashboard :where(.surface, .profile-panel, .metric-card, .panel, .list-row, .content-list, .content-editor-form, .gallery-admin-grid article, .movement-column) { max-width: 100%; min-width: 0; }
      .staff-dashboard :where(.metric-grid, .list-grid, .content-grid, .editor-grid, .gallery-admin-grid, .profile-actions, .movement-grid) { min-width: 0; width: 100%; }
      .staff-dashboard :where(h2, strong, span, small, p, button, a, label) { overflow-wrap: anywhere; }
      .staff-dashboard { max-width: calc(100vw - 18px) !important; }
      .profile-panel { align-items: stretch; flex-direction: column; }
      .profile-actions, .settings-btn { width: 100%; }
      .metric-grid, .list-grid.compact, .content-grid, .movement-grid, .outward-detail-grid, .otp-panel { gap: .75rem; grid-template-columns: 1fr; }
      .metric-card, .panel, .list-row, .content-list, .content-editor-form, .movement-column { padding: .85rem; }
      .gallery-admin-grid article { grid-template-columns: 64px minmax(0, 1fr); }
      .gallery-admin-grid article .danger-btn { grid-column: 1 / -1; width: 100%; }
      .gallery-admin-grid img { width: 64px; }
      .form-actions { align-items: stretch; flex-direction: column; }
      .form-actions button, .content-switcher, .content-switcher button, .save-btn { width: 100%; }
      .pager { align-items: stretch; flex-direction: column; }
      .pager div { width: 100%; }
      .pager button { flex: 1; }
    }
  `]
})
export class StaffDashboardPageComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly galleryService = inject(GalleryService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly inventory = signal<AdminProductResponse[]>([]);
  readonly bookings = signal<AdminBookingResponse[]>([]);
  readonly customers = signal<AdminCustomerResponse[]>([]);
  readonly payments = signal<AdminPaymentResponse[]>([]);
  readonly content = signal<AdminContentResponse | null>(null);
  readonly blogPosts = signal<StaffBlogPost[]>([]);
  readonly galleryImages = signal<StaffGalleryImage[]>([]);
  readonly inventoryPage = signal(1);
  readonly showSettings = signal(false);
  readonly activeContentSection = signal<'blog' | 'gallery'>('blog');
  readonly inventoryPageSize = 10;
  isChangingPassword = false;
  passwordSubmitted = false;
  passwordError = '';
  blogFormError = '';
  galleryFormError = '';
  blogCoverFileName = '';
  galleryFileName = '';
  galleryPreviewUrl = '';
  editingBlogPostId?: number;
  selectedOutwardBooking?: AdminBookingResponse;
  deliveryOtpDraft = '';
  isSubmittingBlog = false;
  isSubmittingGallery = false;
  private selectedBlogCoverFile?: File;
  private selectedGalleryFile?: File;

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.pattern(passwordPattern)]],
    confirmPassword: ['', [Validators.required]]
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

  readonly galleryForm = this.fb.nonNullable.group({
    altText: ['', Validators.required],
    displayOrder: [1, [Validators.required, Validators.min(1)]],
    wide: [false],
    tall: [false],
    active: [true]
  });

  readonly roleLabel = computed(() => {
    if (this.authService.hasRole('MANAGER')) return 'Manager';
    if (this.authService.hasRole('INVENTORY_STAFF')) return 'Inventory Staff';
    if (this.authService.hasRole('CONTENT_EDITOR')) return 'Content Editor';
    return 'Staff';
  });

  readonly dashboardTitle = computed(() => `${this.roleLabel()} Dashboard`);
  readonly dashboardIntro = computed(() => {
    if (this.authService.hasRole('MANAGER')) return 'Manage bookings, customers, inventory, payments and operational review from one workspace.';
    if (this.authService.hasRole('INVENTORY_STAFF')) return 'Keep stock, returns and maintenance workflows moving with inventory and booking visibility.';
    return 'Manage blog, SEO, and gallery content from one focused workspace.';
  });

  readonly contentCount = computed(() => this.blogPosts().length + this.galleryImages().length);
  readonly inventoryPageCount = computed(() => Math.max(1, Math.ceil(this.inventory().length / this.inventoryPageSize)));
  readonly pagedInventory = computed(() => {
    const safePage = Math.min(this.inventoryPageCount(), Math.max(1, this.inventoryPage()));
    const start = (safePage - 1) * this.inventoryPageSize;
    return this.inventory().slice(start, start + this.inventoryPageSize);
  });
  readonly outwardBookings = computed(() => this.bookings().filter((booking) => this.isOutwardBooking(booking)));
  readonly inwardBookings = computed(() => this.bookings().filter((booking) => this.isInwardBooking(booking)));
  readonly metrics = computed(() => {
    const items: Array<{ label: string; value: string; note: string }> = [];
    if (this.canUseInventory()) items.push({ label: 'Inventory', value: String(this.inventory().length), note: 'Catalogue items' });
    if (this.canUseBookings()) items.push({ label: 'Bookings', value: String(this.bookings().length), note: 'Visible orders' });
    if (this.canUseInwardOutward()) items.push({ label: 'Inward & Outward', value: String(this.outwardBookings().length + this.inwardBookings().length), note: 'Delivery and return tasks' });
    if (this.canUseCustomers()) items.push({ label: 'Customers', value: String(this.customers().length), note: 'Customer records' });
    if (this.canUseContent()) items.push({ label: 'Content', value: String(this.contentCount()), note: 'Blog and gallery' });
    return items;
  });

  ngOnInit(): void {
    if (this.canUseInventory()) {
      this.adminService.getInventory().subscribe({
        next: (items) => {
          this.inventory.set(items);
          this.inventoryPage.set(Math.min(this.inventoryPageCount(), Math.max(1, this.inventoryPage())));
        },
        error: () => this.inventory.set([])
      });
    }
    if (this.canUseBookings()) {
      this.adminService.getBookings().subscribe({ next: (items) => this.bookings.set(items), error: () => this.bookings.set([]) });
    }
    if (this.canUseCustomers()) {
      this.adminService.getCustomers().subscribe({ next: (items) => this.customers.set(items), error: () => this.customers.set([]) });
    }
    if (this.canUsePayments()) {
      this.adminService.getPayments().subscribe({ next: (items) => this.payments.set(items), error: () => this.payments.set([]) });
    }
    if (this.canUseContent()) {
      this.loadContent();
      this.loadGalleryImages();
    }
  }

  canUseInventory(): boolean {
    return this.authService.hasRole('MANAGER') || this.authService.hasRole('INVENTORY_STAFF');
  }

  canEditInventory(): boolean {
    return this.authService.hasRole('MANAGER') || this.authService.hasRole('INVENTORY_STAFF');
  }

  canUseBookings(): boolean {
    return this.authService.hasRole('MANAGER') || this.authService.hasRole('INVENTORY_STAFF');
  }

  canUseInwardOutward(): boolean {
    return this.authService.hasRole('MANAGER');
  }

  canUseCustomers(): boolean {
    return this.authService.hasRole('MANAGER') || this.authService.hasRole('INVENTORY_STAFF');
  }

  canUsePayments(): boolean {
    return this.authService.hasRole('MANAGER');
  }

  canUseContent(): boolean {
    return this.authService.hasRole('MANAGER') || this.authService.hasRole('CONTENT_EDITOR');
  }

  loadContent(): void {
    this.adminService.getContent().subscribe({
      next: (items) => {
        this.content.set(items);
        this.blogPosts.set(items.blogPosts.map((post) => this.mapBlogPostFromContent(post)));
      },
      error: () => {
        this.content.set(null);
        this.blogPosts.set([]);
      }
    });
  }

  loadGalleryImages(): void {
    this.galleryService.getAdminGallery().subscribe({
      next: (images) => this.galleryImages.set(images.map((image) => this.mapGalleryImage(image))),
      error: () => this.galleryImages.set([])
    });
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

  editBlogPost(post: StaffBlogPost): void {
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
    if (this.editingBlogPostId || this.blogForm.controls.slug.value.trim()) return;
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

  deleteBlogPost(): void {
    if (!this.editingBlogPostId || this.isSubmittingBlog) return;
    const postId = this.editingBlogPostId;
    this.isSubmittingBlog = true;
    this.adminService.deleteBlogPost(postId)
      .pipe(finalize(() => {
        this.isSubmittingBlog = false;
      }))
      .subscribe({
        next: () => {
          this.blogPosts.update((items) => items.filter((item) => item.id !== postId));
          this.startNewBlogPost();
          this.showMessage('Blog post deleted.', 2200);
        },
        error: (error) => {
          this.blogFormError = this.authService.getErrorMessage(error);
        }
      });
  }

  setGalleryFile(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    this.clearGalleryPreview();
    this.selectedGalleryFile = file;
    this.galleryFileName = file?.name ?? '';
    if (file) this.galleryPreviewUrl = URL.createObjectURL(file);
  }

  clearGalleryFile(): void {
    this.selectedGalleryFile = undefined;
    this.galleryFileName = '';
    this.clearGalleryPreview();
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
          const nextImages = [...this.galleryImages(), this.mapGalleryImage(image)].sort((a, b) => a.displayOrder - b.displayOrder || b.id - a.id);
          this.galleryImages.set(nextImages);
          this.galleryForm.reset({ altText: '', displayOrder: nextImages.length + 1, wide: false, tall: false, active: true });
          this.clearGalleryFile();
          this.showMessage('Gallery image added.', 2200);
        },
        error: (error) => {
          this.galleryFormError = this.authService.getErrorMessage(error);
        }
      });
  }

  deleteGalleryImage(image: StaffGalleryImage): void {
    this.galleryService.deleteGalleryImage(image.id).subscribe({
      next: () => {
        this.galleryImages.update((items) => items.filter((item) => item.id !== image.id));
        this.showMessage('Gallery image deleted.', 2200);
      },
      error: (error) => this.showMessage(this.authService.getErrorMessage(error), 3200)
    });
  }
  toggleSettings(): void {
    this.showSettings.update((value) => !value);
    this.scrollToActiveSection(this.showSettings() ? '.staff-dashboard .password-panel' : undefined);
  }

  setContentSection(section: 'blog' | 'gallery'): void {
    this.activeContentSection.set(section);
    this.scrollToActiveSection();
  }

  passwordFieldError(field: PasswordField): string {
    const control = this.passwordForm.controls[field];
    if (!control || (!control.touched && !this.passwordSubmitted) || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return field === 'currentPassword' ? 'Current password is required.' : `${this.passwordFieldLabel(field)} is required.`;
    }

    if (control.hasError('pattern')) {
      return 'Password must be 8-64 characters and include uppercase, lowercase, number, and special character.';
    }

    return '';
  }

  passwordsMatch(): boolean {
    return this.passwordForm.controls.newPassword.value === this.passwordForm.controls.confirmPassword.value;
  }

  passwordMismatchError(): string {
    return this.passwordSubmitted && this.passwordForm.controls.confirmPassword.valid && !this.passwordsMatch()
      ? 'Passwords must match.'
      : '';
  }

  changePassword(): void {
    this.passwordSubmitted = true;
    this.passwordError = '';
    const values = this.passwordForm.getRawValue();
    const passwordsMatch = values.newPassword === values.confirmPassword;
    if (this.passwordForm.invalid || !passwordsMatch || this.isChangingPassword) {
      this.passwordForm.markAllAsTouched();
      this.passwordError = passwordsMatch ? 'Please enter your current password and a valid new password.' : 'New password and confirm password must match.';
      return;
    }

    this.isChangingPassword = true;
    this.authService.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      .pipe(finalize(() => {
        this.isChangingPassword = false;
      }))
      .subscribe({
        next: (message) => {
          this.passwordForm.reset();
          this.passwordSubmitted = false;
          this.snackBar.open(message, 'Close', {
            duration: 2600,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['snackbar-screen-center']
          });
        },
        error: (error) => {
          const message = this.authService.getErrorMessage(error);
          this.passwordError = message;
          this.snackBar.open(message, 'Close', {
            duration: 3400,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['snackbar-screen-center']
          });
        }
      });
  }


  openOutwardDetails(booking: AdminBookingResponse): void {
    this.selectedOutwardBooking = booking;
    this.deliveryOtpDraft = '';
    this.scrollToActiveSection('.staff-dashboard .outward-detail-panel');
  }

  closeOutwardDetails(): void {
    this.selectedOutwardBooking = undefined;
    this.deliveryOtpDraft = '';
  }

  confirmDeliveryOtp(): void {
    const otp = this.deliveryOtpDraft.trim();
    const booking = this.selectedOutwardBooking;
    if (!booking || otp.length < 4) {
      this.showMessage('Enter a valid delivery OTP.', 2600);
      return;
    }
    this.adminService.verifyDeliveryOtp(booking.id, otp).subscribe({
      next: (updatedBooking) => {
        this.bookings.update((items) => items.map((item) => item.id === updatedBooking.id ? updatedBooking : item));
        this.selectedOutwardBooking = updatedBooking;
        this.deliveryOtpDraft = '';
        this.showMessage('Delivery OTP verified. Booking marked active.', 2600);
      },
      error: (error) => this.showMessage(this.authService.getErrorMessage(error), 3600)
    });
  }

  paymentStatusClass(status: string): string {
    const normalized = this.normalizedStatus(status);
    if (normalized === 'PAID') return 'status-paid';
    if (normalized === 'PENDING') return 'status-pending';
    if (normalized === 'FAILED') return 'status-failed';
    if (normalized === 'REFUNDED') return 'status-refunded';
    return 'status-neutral';
  }

  formatReturnStatus(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ');
  }

  private isOutwardBooking(booking: AdminBookingResponse): boolean {
    return this.normalizedStatus(booking.status) === 'UPCOMING';
  }

  private isInwardBooking(booking: AdminBookingResponse): boolean {
    const status = this.normalizedStatus(booking.status);
    return (status === 'ACTIVE' || status === 'OVERDUE') && this.normalizedStatus(booking.returnStatus) !== 'RETURNED';
  }

  private normalizedStatus(value: string): string {
    return value.trim().toUpperCase().replace(/\s+/g, '_');
  }
  private passwordFieldLabel(field: PasswordField): string {
    return field === 'newPassword' ? 'New password' : 'Confirm password';
  }
  changeInventoryPage(direction: number): void {
    this.inventoryPage.set(Math.min(this.inventoryPageCount(), Math.max(1, this.inventoryPage() + direction)));
    this.scrollToSectionTop();
  }

  private submitBlogPostRequest(): void {
    const request: AdminBlogPostRequest = this.blogForm.getRawValue();
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
          this.showMessage('Blog post updated.', 2200);
        } else {
          this.blogPosts.update((items) => [mappedPost, ...items]);
          this.showMessage('Blog post created.', 2200);
        }
        this.startNewBlogPost();
      },
      error: (error) => {
        this.blogFormError = this.authService.getErrorMessage(error);
      }
    });
  }

  private mapGalleryImage(image: GalleryImage): StaffGalleryImage {
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

  private mapBlogPostResponse(post: AdminBlogPostResponse): StaffBlogPost {
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

  private mapBlogPostFromContent(post: AdminContentResponse['blogPosts'][number]): StaffBlogPost {
    return {
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
    };
  }

  private clearGalleryPreview(): void {
    if (this.galleryPreviewUrl) URL.revokeObjectURL(this.galleryPreviewUrl);
    this.galleryPreviewUrl = '';
  }

  private slugify(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private showMessage(message: string, duration: number): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-screen-center']
    });
  }
  private scrollToSectionTop(): void {
    this.scrollToActiveSection();
  }

  private scrollToActiveSection(preferredSelector?: string): void {
    window.setTimeout(() => {
      const isMobile = window.matchMedia('(max-width: 560px)').matches;
      const preferredTarget = preferredSelector ? document.querySelector(preferredSelector) : null;
      const target = preferredTarget ?? (isMobile
        ? document.querySelector('.staff-dashboard .content-workbench') ?? document.querySelector('.staff-dashboard .password-panel') ?? document.querySelector('.staff-dashboard')
        : document.querySelector('.staff-dashboard'));
      if (!target) return;
      const stickyOffset = isMobile ? 88 : 92;
      const start = window.scrollY;
      const end = Math.max(0, target.getBoundingClientRect().top + window.scrollY - stickyOffset);
      const duration = isMobile ? 700 : 900;
      const startTime = performance.now();
      const animate = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, start + (end - start) * eased);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    });
  }

  inventoryPageSummary(): string {
    const total = this.inventory().length;
    if (!total) return 'No inventory items';
    const safePage = Math.min(this.inventoryPageCount(), Math.max(1, this.inventoryPage()));
    const start = (safePage - 1) * this.inventoryPageSize + 1;
    const end = Math.min(total, safePage * this.inventoryPageSize);
    return `Showing ${start}-${end} of ${total}`;
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}





















