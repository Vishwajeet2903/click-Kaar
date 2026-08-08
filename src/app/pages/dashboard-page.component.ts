import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BookingService, CustomerDashboardBooking, CustomerDashboardPayment, CustomerDashboardResponse } from '../services/booking.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

type DashboardSection = 'profile' | 'active' | 'past' | 'returns' | 'wishlist' | 'security';
type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,64}$/;

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, ReactiveFormsModule, RouterLink, MatSnackBarModule, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Dashboard" />
    <section class="container dashboard-page pb-5">
      @if (currentUser(); as user) {
        <h1 class="section-title">Customer Dashboard</h1>
        <div class="dashboard">
          <aside class="surface sidebar">
            <div class="sidebar-head">
              <span>Account</span>
              <strong>{{ user.fullName || user.email }}</strong>
            </div>
            @for (item of nav; track item.id) {
              <button type="button" class="menu-btn" [class.active-menu]="activeSection() === item.id" (click)="setSection(item.id)">
                {{ item.label }}
              </button>
            }
          </aside>

          <div class="content">
            @if (dashboard$ | async; as dashboard) {
              <div class="surface profile">
                <div>
                  <p class="eyebrow">Profile</p>
                  <h2>{{ dashboard.profile.fullName || user.fullName }}</h2>
                  <p class="muted">
                    {{ dashboard.profile.email || user.email }}
                    @if (dashboard.profile.mobile || user.mobile) {
                      <span> - {{ dashboard.profile.mobile || user.mobile }}</span>
                    }
                  </p>
                </div>

                <div class="profile-meta">
                  <span>{{ dashboard.profile.customerNumber || ('CRE-' + (dashboard.profile.id || user.userId)) }}</span>
                  @for (role of dashboard.profile.roles; track role) {
                    <strong>{{ role }}</strong>
                  }
                  <small>{{ dashboard.profile.mobileVerified ? 'Mobile verified' : 'Mobile verification pending' }}</small>
                </div>
              </div>

              <div class="summary-grid">
                <article class="surface stat">
                  <span>Active</span>
                  <strong>{{ dashboard.summary.activeBookings }}</strong>
                </article>
                <article class="surface stat">
                  <span>Past</span>
                  <strong>{{ dashboard.summary.pastBookings }}</strong>
                </article>
                <article class="surface stat">
                  <span>Returns</span>
                  <strong>{{ dashboard.summary.upcomingReturns }}</strong>
                </article>
                <article class="surface stat">
                  <span>Wishlist</span>
                  <strong>{{ dashboard.summary.wishlistCount }}</strong>
                </article>
              </div>

              @if (activeSection() === 'security') {
                <div class="surface password-panel">
                  <h2>Change password</h2>
                  <p class="muted">Update your password using your current password for verification.</p>

                  @if (passwordError) {
                    <p class="form-alert" role="alert">{{ passwordError }}</p>
                  }

                  <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
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
                </div>
              } @else if (activeSection() === 'wishlist') {
                <div class="surface empty-panel">
                  <h2>Wishlist</h2>
                  <p class="muted">You have {{ dashboard.summary.wishlistCount }} item{{ dashboard.summary.wishlistCount === 1 ? '' : 's' }} saved for later.</p>
                  <a routerLink="/wishlist">Open wishlist</a>
                </div>
              } @else {
                <div class="section-head">
                  <h2>{{ bookingsTitle() }}</h2>
                  <span>{{ bookingsFor(dashboard).length }} total</span>
                </div>

                @if (bookingsFor(dashboard).length) {
                  <div class="booking-list">
                    @for (booking of pagedBookingsFor(dashboard); track booking.id) {
                      <article class="surface booking item">
                        <div class="booking-badge" [class]="booking.group.toLowerCase()">
                          <strong>{{ booking.group }}</strong>
                          <span>{{ booking.rentalDays }} days</span>
                        </div>
                        <div class="item-copy">
                          <p class="category">{{ booking.bookingNumber }}</p>
                          <h3>{{ booking.productName }}</h3>
                          <p class="muted">{{ booking.dateRange }}</p>
                          <p class="stock-note">{{ formatReturnStatus(booking.returnStatus) }}</p>
                        </div>
                        <div class="item-actions text-end">
                          <strong>{{ booking.total | currency:'INR':'symbol':'1.0-0' }}</strong>
                          <span [class]="booking.status.toLowerCase()">{{ booking.status }}</span>
                        </div>
                      </article>
                    }
                  </div>
                  @if (pageCount(bookingsFor(dashboard).length, bookingPageSize) > 1) {
                    <div class="pagination-bar">
                      <span>{{ pageSummary(bookingsFor(dashboard).length, bookingPage(), bookingPageSize) }}</span>
                      <div>
                        <button type="button" [disabled]="bookingPage() === 1" (click)="changeBookingPage(-1)">Previous</button>
                        <strong>Page {{ bookingPage() }} of {{ pageCount(bookingsFor(dashboard).length, bookingPageSize) }}</strong>
                        <button type="button" [disabled]="bookingPage() === pageCount(bookingsFor(dashboard).length, bookingPageSize)" (click)="changeBookingPage(1)">Next</button>
                      </div>
                    </div>
                  }
                } @else {
                  <div class="surface empty-panel">
                    <h2>No {{ emptyBookingLabel() }} found</h2>
                    <p class="muted">Your matching rental bookings will appear here after checkout.</p>
                    <a routerLink="/catalogue">Browse gear</a>
                  </div>
                }
              }

              @if (activeSection() === 'profile') {
                <div class="section-head">
                  <h2>Recent Payments</h2>
                  <span>{{ dashboard.payments.length }} total</span>
                </div>

                @if (dashboard.payments.length) {
                  <div class="payment-list">
                    @for (payment of pagedPayments(dashboard.payments); track payment.id) {
                      <article class="surface item payment-row">
                        <div>
                          <strong>{{ payment.paymentNumber || payment.bookingNumber }}</strong>
                          <span>{{ payment.bookingNumber }} - {{ formatPaymentType(payment.type) }}</span>
                        </div>
                        <span [class]="payment.status.toLowerCase()">{{ payment.status }}</span>
                        <strong>{{ payment.amount | currency:'INR':'symbol':'1.0-0' }}</strong>
                      </article>
                    }
                  </div>
                  @if (pageCount(dashboard.payments.length, paymentPageSize) > 1) {
                    <div class="pagination-bar">
                      <span>{{ pageSummary(dashboard.payments.length, paymentPage(), paymentPageSize) }}</span>
                      <div>
                        <button type="button" [disabled]="paymentPage() === 1" (click)="changePaymentPage(-1)">Previous</button>
                        <strong>Page {{ paymentPage() }} of {{ pageCount(dashboard.payments.length, paymentPageSize) }}</strong>
                        <button type="button" [disabled]="paymentPage() === pageCount(dashboard.payments.length, paymentPageSize)" (click)="changePaymentPage(1)">Next</button>
                      </div>
                    </div>
                  }
                } @else {
                  <div class="surface empty-panel compact">
                    <h2>No payments yet</h2>
                    <p class="muted">Completed and pending payments will appear here.</p>
                  </div>
                }
              }
            } @else {
              <div class="surface empty-panel">
                <h2>Loading your dashboard</h2>
                <p class="muted">Fetching your latest bookings and payments.</p>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="surface empty-state">
          <p class="eyebrow">Account required</p>
          <h1>Please log in to view your dashboard.</h1>
          <a routerLink="/login">Go to login</a>
        </div>
      }
    </section>
  `,
  styles: [`
    .dashboard-page .section-title { font-size: clamp(1.75rem, 3.4vw, 3rem); letter-spacing: 0; line-height: 1.08; margin-bottom: 1.1rem; text-align: left; }
    .dashboard { display: grid; gap: 1.2rem; grid-template-columns: 260px minmax(0, 1fr); }
    .sidebar, .profile, .stat, .empty-panel, .password-panel { padding: 1.2rem; }
    .sidebar { align-self: start; position: sticky; top: 92px; }
    .sidebar-head { border-bottom: 1px solid rgba(148,163,184,.15); display: grid; gap: .35rem; margin-bottom: .8rem; padding-bottom: .9rem; }
    .sidebar-head span, .category, .stat span, .section-head span, .payment-list span { color: #777; font-size: .78rem; font-weight: 900; text-transform: uppercase; }
    .sidebar-head strong { color: #111827; font-size: 1rem; font-weight: 900; line-height: 1.25; overflow-wrap: anywhere; }
    .menu-btn { background: transparent; border: 0; border-radius: 8px; color: #555; display: block; font-weight: 850; min-height: 46px; padding: .75rem; text-align: left; transition: background .2s ease, color .2s ease, transform .2s ease; width: 100%; }
    .menu-btn:hover, .menu-btn.active-menu { background: rgba(255,151,0,.1); color: #ff9700; transform: translateX(2px); }
    .empty-state a, .empty-panel a, .save-btn { align-items: center; background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; display: inline-flex; font-size: .96rem; font-weight: 800; justify-content: center; min-height: 50px; padding: .85rem 1.25rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; }
    .empty-state a:hover, .empty-panel a:hover, .save-btn:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #fff; transform: translateY(-2px); }
    .profile { align-items: center; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 1rem; }
    .profile h2 { color: #111827; font-size: 1.2rem; font-weight: 900; line-height: 1.25; margin-bottom: .35rem; }
    .profile-meta { align-items: flex-end; display: flex; flex-direction: column; gap: .55rem; text-align: right; }
    .profile-meta span { color: #777; font-size: .85rem; font-weight: 800; }
    .profile-meta strong { background: rgba(255,151,0,.14); border-radius: 999px; color: #d77d00; font-size: .75rem; padding: .35rem .65rem; }
    .profile-meta small { color: #777; font-weight: 800; }
    .summary-grid { display: grid; gap: .85rem; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 1.2rem; }
    .stat { display: grid; gap: .35rem; min-height: 104px; }
    .stat strong { color: #111827; font-size: clamp(1.1rem, 2vw, 1.75rem); font-weight: 950; line-height: 1; overflow-wrap: anywhere; }
    .section-head { align-items: center; display: flex; justify-content: space-between; margin: 1.25rem 0 .75rem; }
    .section-head h2 { color: #111827; font-size: 1.15rem; font-weight: 900; line-height: 1.28; margin: 0; }
    .item { align-items: center; display: grid; gap: 1rem; grid-template-columns: 124px minmax(0, 1fr) auto; margin-bottom: 1rem; padding: 1rem; }
    .booking-badge { align-content: center; border-radius: 8px; display: grid; gap: .2rem; min-height: 104px; padding: .85rem; text-align: center; }
    .booking-badge strong { font-size: .92rem; font-weight: 950; line-height: 1.15; }
    .booking-badge span { color: inherit; font-size: .78rem; font-weight: 850; opacity: .82; text-transform: none; }
    .item-copy { min-width: 0; }
    .category { color: #d77d00; letter-spacing: .08em; line-height: 1.35; margin: 0 0 .35rem; }
    h2, h3 { font-weight: 900; }
    .booking h3 { color: #111827; font-size: 1.08rem; line-height: 1.28; margin: 0 0 .5rem; overflow-wrap: anywhere; }
    .muted { color: #555; font-size: .94rem; font-weight: 500; line-height: 1.55; margin-bottom: .4rem; }
    .stock-note { color: #027a48; font-size: .86rem; font-weight: 850; line-height: 1.45; margin: 0; text-transform: capitalize; }
    .item-actions { min-width: 132px; }
    .item-actions strong { color: #111827; display: block; font-size: 1.08rem; font-weight: 900; line-height: 1.2; }
    .item-actions > span { border-radius: 999px; display: inline-block; font-size: .75rem; font-weight: 900; margin-top: .65rem; padding: .25rem .55rem; text-transform: uppercase; }
    .empty-state { margin: 0 auto; max-width: 680px; padding: 2rem; text-align: center; }
    .empty-panel h2 { color: #111827; font-size: 1.15rem; margin: 0 0 .35rem; }
    .empty-panel a { margin-top: 1rem; text-decoration: none; }
    .empty-panel.compact { margin-bottom: 0; }
    .password-panel { max-width: 680px; }
    .password-panel h2 { color: #111827; font-size: 1.15rem; margin: 0 0 .35rem; }
    .password-panel form { display: grid; gap: 1rem; margin-top: 1.1rem; }
    .password-panel label { color: #111; display: block; font-size: .82rem; font-weight: 800; }
    .password-panel label span { display: block; margin-bottom: .55rem; }
    .password-panel input { background: #fff; border: 1px solid rgba(17,17,17,.14); border-radius: 8px; color: #111; display: block; font: inherit; font-weight: 600; min-height: 46px; outline: 0; padding: .75rem 1rem; transition: border-color .25s ease, box-shadow .25s ease; width: 100%; }
    .password-panel input:focus { border-color: rgba(255,151,0,.95); box-shadow: 0 0 0 4px rgba(255,151,0,.18); }
    .password-panel input.ng-invalid.ng-touched, .password-mismatch input { background: #fff4f2; border-color: rgba(180,35,24,.72); box-shadow: 0 0 0 4px rgba(180,35,24,.12); }
    .password-panel label:has(input.ng-invalid.ng-touched) span, .password-mismatch span { color: #b42318; }
    .field-error { color: #b42318; display: block; font-size: .78rem; font-weight: 850; line-height: 1.35; margin-top: .45rem; }
    .form-alert { background: #fff4f2; border: 1px solid rgba(180,35,24,.24); border-radius: 14px; color: #b42318; font-size: .9rem; font-weight: 800 !important; line-height: 1.45; margin: 1rem 0 0; padding: .85rem 1rem; }
    .save-btn { cursor: pointer; width: min(220px, 100%); }
    .save-btn:disabled, .save-btn:disabled:hover { background: #111; color: #fff; cursor: not-allowed; opacity: .68; transform: none; }
    .active { background: rgba(39,174,96,.12); color: #18864b; }
    .past { background: rgba(0,0,0,.06); color: #555; }
    .upcoming { background: rgba(255,151,0,.14); color: #d99411; }
    .pending { background: rgba(255,151,0,.14); color: #d99411; }
    .paid { background: rgba(39,174,96,.12); color: #18864b; }
    .refunded, .cancelled { background: rgba(0,0,0,.06); color: #555; }
    .failed, .overdue { background: rgba(231,76,60,.12); color: #c0392b; }
    .payment-list { display: grid; gap: .4rem; }
    .payment-row { grid-template-columns: minmax(0, 1fr) auto auto; min-height: 74px; }
    .payment-list article div { display: grid; gap: .2rem; }
    .payment-list article > span { border-radius: 999px; justify-self: end; padding: .25rem .55rem; }
    .pagination-bar { align-items: center; display: flex; gap: 1rem; justify-content: space-between; margin-top: .25rem; }
    .pagination-bar > span { color: #777; font-size: .82rem; font-weight: 850; }
    .pagination-bar div { align-items: center; display: flex; flex-wrap: wrap; gap: .7rem; justify-content: flex-end; }
    .pagination-bar strong { color: #111827; font-size: .86rem; font-weight: 900; }
    .pagination-bar button { align-items: center; background: #fff; border: 1px solid rgba(17,17,17,.12); border-radius: 999px; color: #111; display: inline-flex; font-size: .86rem; font-weight: 850; justify-content: center; min-height: 42px; min-width: 92px; padding: .65rem 1rem; transition: transform .25s ease, background .25s ease, color .25s ease, border-color .25s ease; }
    .pagination-bar button:hover { background: #111; border-color: #111; color: #fff; transform: translateY(-2px); }
    .pagination-bar button:disabled, .pagination-bar button:disabled:hover { background: #fff; border-color: rgba(17,17,17,.12); color: #777; cursor: not-allowed; opacity: .55; transform: none; }
    @media (max-width: 767px) {
      .dashboard-page, .dashboard-page * { box-sizing: border-box; }
      .dashboard-page :where(.surface, .sidebar, .profile, .stat, .empty-panel, .password-panel, .item, .booking-badge) { max-width: 100%; min-width: 0; }
      .dashboard-page :where(.dashboard, .content, .summary-grid, .booking-list, .payment-list) { min-width: 0; width: 100%; }
      .dashboard-page :where(h2, h3, strong, span, small, p, button, a) { overflow-wrap: anywhere; }
      .dashboard { grid-template-columns: 1fr; }
      .sidebar { position: static; }
      .profile { align-items: flex-start; flex-direction: column; }
      .profile-meta { align-items: flex-start; text-align: left; }
      .summary-grid { gap: .7rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .item { align-items: start; gap: .75rem; grid-template-columns: 96px minmax(0, 1fr); padding: .85rem; }
      .booking-badge { min-height: 86px; padding: .7rem; }
      .item-actions { grid-column: 1 / -1; min-width: 0; text-align: left !important; }
      .payment-row { grid-template-columns: 1fr; }
      .payment-list article > span { justify-self: start; }
      .pagination-bar { align-items: stretch; flex-direction: column; }
      .pagination-bar div { justify-content: flex-start; width: 100%; }
      .pagination-bar button { flex: 1; min-width: 0; }
    }
    @media (min-width: 768px) and (max-width: 1199px) {
      .summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
  `]
})
export class DashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly dashboard$: Observable<CustomerDashboardResponse> = this.bookingService.getCustomerDashboard();
  readonly currentUser = this.authService.currentUser;
  readonly activeSection = signal<DashboardSection>('profile');
  readonly bookingPage = signal(1);
  readonly paymentPage = signal(1);
  readonly bookingPageSize = 4;
  readonly paymentPageSize = 5;
  isChangingPassword = false;
  passwordSubmitted = false;
  passwordError = '';
  readonly nav: { id: DashboardSection; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'active', label: 'Active Bookings' },
    { id: 'past', label: 'Past Bookings' },
    { id: 'returns', label: 'Upcoming Returns' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'security', label: 'Settings' }
  ];

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.pattern(passwordPattern)]],
    confirmPassword: ['', [Validators.required]]
  });

  setSection(section: DashboardSection): void {
    this.activeSection.set(section);
    this.bookingPage.set(1);
    this.paymentPage.set(1);
    this.scrollToActiveSection();
  }

  bookingsFor(dashboard: CustomerDashboardResponse): CustomerDashboardBooking[] {
    const section = this.activeSection();
    if (section === 'active') {
      return dashboard.bookings.filter((booking) => booking.group === 'Active');
    }
    if (section === 'past') {
      return dashboard.bookings.filter((booking) => booking.group === 'Past');
    }
    if (section === 'returns') {
      return dashboard.bookings.filter((booking) => booking.group !== 'Past' && booking.returnStatus !== 'RETURNED');
    }
    return dashboard.bookings;
  }

  pagedBookingsFor(dashboard: CustomerDashboardResponse): CustomerDashboardBooking[] {
    return this.paginate(this.bookingsFor(dashboard), this.bookingPage(), this.bookingPageSize);
  }

  pagedPayments(payments: CustomerDashboardPayment[]): CustomerDashboardPayment[] {
    return this.paginate(payments, this.paymentPage(), this.paymentPageSize);
  }

  changeBookingPage(direction: number): void {
    this.bookingPage.update((page) => Math.max(1, page + direction));
  }

  changePaymentPage(direction: number): void {
    this.paymentPage.update((page) => Math.max(1, page + direction));
  }

  pageCount(total: number, pageSize: number): number {
    return Math.max(1, Math.ceil(total / pageSize));
  }

  pageSummary(total: number, page: number, pageSize: number): string {
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(total, page * pageSize);
    return `${start}-${end} of ${total}`;
  }

  bookingsTitle(): string {
    return this.nav.find((item) => item.id === this.activeSection())?.label ?? 'Bookings';
  }

  emptyBookingLabel(): string {
    return this.bookingsTitle().toLowerCase();
  }

  formatPaymentType(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ');
  }

  formatReturnStatus(value: string): string {
    return value.toLowerCase().replaceAll('_', ' ');
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

  private passwordFieldLabel(field: PasswordField): string {
    return field === 'newPassword' ? 'New password' : 'Confirm password';
  }

  private paginate<T>(items: T[], page: number, pageSize: number): T[] {
    const safePage = Math.min(this.pageCount(items.length, pageSize), Math.max(1, page));
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }

  private scrollToActiveSection(): void {
    window.setTimeout(() => {
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      const target = isMobile
        ? document.querySelector('.dashboard-page .content') ?? document.querySelector('.dashboard-page')
        : document.querySelector('.dashboard-page');
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

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}






