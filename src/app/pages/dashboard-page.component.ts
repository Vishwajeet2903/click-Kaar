import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BookingService, CustomerDashboardBooking, CustomerDashboardResponse } from '../services/booking.service';
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
    <section class="container pb-5">
      @if (currentUser(); as user) {
        <h1 class="section-title">Customer Dashboard</h1>
        <div class="dashboard">
          <aside class="surface sidebar">
            @for (item of nav; track item.id) {
              <button type="button" class="menu-btn" [class.active-menu]="activeSection() === item.id" (click)="setSection(item.id)">
                {{ item.label }}
              </button>
            }
            <button type="button" class="logout-btn" (click)="logout()">Log out</button>
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
                  <span>Customer ID #{{ dashboard.profile.id || user.userId }}</span>
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
                <article class="surface stat">
                  <span>Pending payments</span>
                  <strong>{{ dashboard.summary.pendingPayments }}</strong>
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
                  <div class="row g-3">
                    @for (booking of bookingsFor(dashboard); track booking.id) {
                      <div class="col-md-4">
                        <article class="surface booking">
                          <span [class]="booking.group.toLowerCase()">{{ booking.group }}</span>
                          <h3>{{ booking.productName }}</h3>
                          <p class="muted">{{ booking.dateRange }}</p>
                          <dl>
                            <div><dt>Booking</dt><dd>{{ booking.bookingNumber }}</dd></div>
                            <div><dt>Status</dt><dd>{{ booking.status }}</dd></div>
                            <div><dt>Return</dt><dd>{{ formatReturnStatus(booking.returnStatus) }}</dd></div>
                          </dl>
                          <strong>{{ booking.total | currency:'INR':'symbol':'1.0-0' }}</strong>
                        </article>
                      </div>
                    }
                  </div>
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
                  <div class="surface payment-list">
                    @for (payment of dashboard.payments; track payment.id) {
                      <article>
                        <div>
                          <strong>{{ payment.bookingNumber }}</strong>
                          <span>{{ formatPaymentType(payment.type) }}</span>
                        </div>
                        <span [class]="payment.status.toLowerCase()">{{ payment.status }}</span>
                        <strong>{{ payment.amount | currency:'INR':'symbol':'1.0-0' }}</strong>
                      </article>
                    }
                  </div>
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
    .dashboard { display: grid; gap: 1.2rem; grid-template-columns: 240px 1fr; }
    .sidebar, .profile, .booking, .stat, .payment-list, .empty-panel, .password-panel { padding: 1.2rem; }
    .menu-btn { background: transparent; border: 0; border-radius: 8px; color: #555; display: block; font-weight: 800; padding: .75rem; text-align: left; width: 100%; }
    .menu-btn:hover, .menu-btn.active-menu { background: rgba(255,151,0,.1); color: #ff9700; }
    .logout-btn { background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; font-size: .96rem; font-weight: 800; margin-top: .8rem; min-height: 50px; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; width: 100%; }
    .logout-btn:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .profile { align-items: center; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 1rem; }
    .profile h2 { margin-bottom: .35rem; }
    .profile-meta { align-items: flex-end; display: flex; flex-direction: column; gap: .55rem; text-align: right; }
    .profile-meta span { color: #777; font-size: .85rem; font-weight: 800; }
    .profile-meta strong { background: rgba(255,151,0,.2); border-radius: 999px; color: #ff9700; font-size: .75rem; padding: .35rem .65rem; }
    .profile-meta small { color: #777; font-weight: 800; }
    .summary-grid { display: grid; gap: .85rem; grid-template-columns: repeat(5, minmax(0, 1fr)); margin-bottom: 1.2rem; }
    .stat { display: grid; gap: .35rem; min-height: 104px; }
    .stat span, .section-head span, .payment-list span { color: #777; font-size: .78rem; font-weight: 900; text-transform: uppercase; }
    .stat strong { color: #111; font-size: clamp(1.1rem, 2vw, 1.75rem); font-weight: 950; line-height: 1; overflow-wrap: anywhere; }
    .section-head { align-items: center; display: flex; justify-content: space-between; margin: 1.25rem 0 .75rem; }
    .section-head h2 { font-size: 1.15rem; margin: 0; }
    .empty-state { margin: 0 auto; max-width: 680px; padding: 2rem; text-align: center; }
    .empty-state a, .empty-panel a { align-items: center; background: #111; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; display: inline-flex; font-size: .96rem; font-weight: 800; justify-content: center; margin-top: 1rem; min-height: 50px; padding: .85rem 1.25rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; }
    .empty-state a:hover, .empty-panel a:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .empty-panel h2 { font-size: 1.15rem; margin: 0 0 .35rem; }
    .empty-panel.compact { margin-bottom: 0; }
    .password-panel { max-width: 620px; }
    .password-panel h2 { font-size: 1.15rem; margin: 0 0 .35rem; }
    .password-panel form { display: grid; gap: 1rem; margin-top: 1.1rem; }
    .password-panel label { color: #111; display: block; font-size: .82rem; font-weight: 800; }
    .password-panel label span { display: block; margin-bottom: .55rem; }
    .password-panel input { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 16px; color: #111; display: block; font: inherit; font-weight: 600; outline: 0; padding: .95rem 1rem; transition: border-color .25s ease, box-shadow .25s ease; width: 100%; }
    .password-panel input:focus { border-color: rgba(255,151,0,.95); box-shadow: 0 0 0 4px rgba(255,151,0,.18); }
    .password-panel input.ng-invalid.ng-touched, .password-mismatch input { background: #fff4f2; border-color: rgba(180,35,24,.72); box-shadow: 0 0 0 4px rgba(180,35,24,.12); }
    .password-panel label:has(input.ng-invalid.ng-touched) span, .password-mismatch span { color: #b42318; }
    .field-error { color: #b42318; display: block; font-size: .78rem; font-weight: 850; line-height: 1.35; margin-top: .45rem; }
    .form-alert { background: #fff4f2; border: 1px solid rgba(180,35,24,.24); border-radius: 14px; color: #b42318; font-size: .9rem; font-weight: 800 !important; line-height: 1.45; margin: 1rem 0 0; padding: .85rem 1rem; }
    .save-btn { align-items: center; background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; cursor: pointer; display: inline-flex; font-size: .96rem; font-weight: 800; justify-content: center; min-height: 50px; padding: .85rem 1.25rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; width: min(220px, 100%); }
    .save-btn:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .save-btn:disabled, .save-btn:disabled:hover { background: #111; color: #fff; cursor: not-allowed; opacity: .68; transform: none; }
    h2, h3 { font-weight: 900; }
    .booking { height: 100%; }
    .booking span { border-radius: 999px; display: inline-block; font-size: .75rem; font-weight: 900; margin-bottom: .8rem; padding: .25rem .55rem; }
    .booking h3 { font-size: 1.05rem; line-height: 1.25; min-height: 2.6rem; }
    .booking dl { display: grid; gap: .45rem; margin: .9rem 0; }
    .booking dl div { align-items: center; display: flex; justify-content: space-between; gap: .75rem; }
    .booking dt { color: #777; font-size: .74rem; font-weight: 900; text-transform: uppercase; }
    .booking dd { color: #222; font-size: .82rem; font-weight: 850; margin: 0; text-align: right; }
    .active { background: rgba(39,174,96,.12); color: #18864b; }
    .past { background: rgba(0,0,0,.06); color: #555; }
    .upcoming { background: rgba(255,151,0,.14); color: #d99411; }
    .pending { background: rgba(255,151,0,.14); color: #d99411; }
    .paid { background: rgba(39,174,96,.12); color: #18864b; }
    .refunded, .cancelled { background: rgba(0,0,0,.06); color: #555; }
    .failed, .overdue { background: rgba(231,76,60,.12); color: #c0392b; }
    .payment-list { display: grid; gap: .4rem; }
    .payment-list article { align-items: center; border-bottom: 1px solid rgba(0,0,0,.07); display: grid; gap: .75rem; grid-template-columns: 1fr auto auto; min-height: 58px; padding: .45rem 0; }
    .payment-list article:last-child { border-bottom: 0; }
    .payment-list article div { display: grid; gap: .2rem; }
    .payment-list article > span { border-radius: 999px; justify-self: end; padding: .25rem .55rem; }
    @media (max-width: 767px) {
      .dashboard { grid-template-columns: 1fr; }
      .profile { align-items: flex-start; flex-direction: column; }
      .profile-meta { align-items: flex-start; text-align: left; }
      .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .payment-list article { grid-template-columns: 1fr; }
      .payment-list article > span { justify-self: start; }
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
  isChangingPassword = false;
  passwordSubmitted = false;
  passwordError = '';
  readonly nav: { id: DashboardSection; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'active', label: 'Active Bookings' },
    { id: 'past', label: 'Past Bookings' },
    { id: 'returns', label: 'Upcoming Returns' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'security', label: 'Security' }
  ];

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.pattern(passwordPattern)]],
    confirmPassword: ['', [Validators.required]]
  });

  setSection(section: DashboardSection): void {
    this.activeSection.set(section);
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
            panelClass: ['snackbar-success-top']
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

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
