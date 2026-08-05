import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BookingService, CouponPreviewResponse } from '../services/booking.service';
import { CartService } from '../services/cart.service';
import { PaymentOrderResponse, PaymentService } from '../services/payment.service';
import { AppButtonComponent } from '../shared/components/app-button.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

type PaymentMethod = 'razorpay' | 'cash';

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', callback: () => void): void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CurrencyPipe, MatSnackBarModule, AppButtonComponent, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Checkout" />
    <section class="container checkout-page pb-5">
      @if (success()) {
        <div class="surface success"><h1>Booking confirmed</h1><p class="muted">Your rental order has been placed successfully.</p><a href="/dashboard">Go to dashboard</a></div>
      } @else {
        <h1 class="section-title">Checkout</h1>
        <div class="row g-4">
          <div class="col-lg-7">
            <div class="surface panel">
              <h2>Payment Method</h2>
              <button type="button" class="payment-option" [class.active]="paymentMethod() === 'razorpay'" (click)="paymentMethod.set('razorpay')" [attr.aria-pressed]="paymentMethod() === 'razorpay'">
                <strong>Razorpay secure checkout</strong>
                <span>Pay with UPI, card, net banking, or wallet in the Razorpay popup.</span>
              </button>
              <button type="button" class="payment-option" [class.active]="paymentMethod() === 'cash'" (click)="paymentMethod.set('cash')" [attr.aria-pressed]="paymentMethod() === 'cash'">
                <strong>Pay In Cash</strong>
                <span>Pay At the time of delivery</span>
              </button>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="surface panel">
              <h2>Order Summary</h2>
              @for (item of cart.items(); track cart.itemKey(item)) { <p><span>{{ item.product.name }} x {{ item.quantity }}</span><strong>{{ cart.itemTotal(item) | currency:'INR':'symbol':'1.0-0' }}</strong></p> }
              <p><span>Rental Subtotal</span><strong>{{ cart.subtotal() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
              <p><span>Security Deposit</span><strong>{{ cart.securityDeposit() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
              <div class="coupon-field">
                <label for="checkout-coupon">Coupon Code</label>
                <div class="coupon-control">
                  <input
                    id="checkout-coupon"
                    type="text"
                    autocomplete="off"
                    inputmode="text"
                    placeholder="Enter coupon code"
                    [value]="couponCode()"
                    (input)="updateCouponCode($any($event.target).value)"
                    (keydown.enter)="$event.preventDefault(); applyCoupon()"
                  >
                  <button type="button" class="apply-coupon-btn" [disabled]="isApplyingCoupon() || isPaying() || !couponCode().trim()" (click)="applyCoupon()">
                    {{ isApplyingCoupon() ? 'Applying...' : 'Apply' }}
                  </button>
                </div>
                @if (couponError()) {
                  <small class="coupon-error">{{ couponError() }}</small>
                }
                @if (appliedCoupon()) {
                  <small class="coupon-success">{{ appliedCoupon()?.code }} applied - {{ appliedCoupon()?.discountPercent }}% off</small>
                }
              </div>
              @if (appliedCoupon()) {
                <p class="discount-row"><span>Coupon discount</span><strong>-{{ discountAmount() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
              }
              <p class="grand"><span>Payable Amount</span><strong>{{ payableAmount() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
              <app-button type="button" [disabled]="isPaying() || cart.count() === 0" (click)="placeOrder()">{{ actionLabel() }}</app-button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .checkout-page .section-title { font-size: clamp(1.75rem, 3.4vw, 3rem); letter-spacing: 0; line-height: 1.08; margin-bottom: 1.1rem; text-align: left; }
    .panel, .success { margin-bottom: 1rem; padding: 1.2rem; }
    h2 { color: #111827; font-size: 1.08rem; font-weight: 900; line-height: 1.28; margin: 0 0 .85rem; }
    .payment-option { background: #fff; border: 1px solid rgba(255,151,0,.28); border-radius: 8px; cursor: pointer; display: grid; gap: .4rem; margin-bottom: 1rem; padding: 1rem; text-align: left; transition: border-color .25s ease, box-shadow .25s ease, transform .25s ease; width: 100%; }
    .payment-option:hover, .payment-option.active { border-color: #ff9700; box-shadow: 0 12px 24px rgba(255,151,0,.14); transform: translateY(-1px); }
    .payment-option.active { background: rgba(255,151,0,.08); }
    .payment-option strong { color: #111827; font-size: 1.08rem; font-weight: 900; line-height: 1.28; }
    .payment-option span { color: #555; font-size: .94rem; font-weight: 500; line-height: 1.55; }
    .panel p { border-bottom: 1px solid rgba(148,163,184,.15); color: #555; display: flex; font-size: .94rem; gap: 1rem; justify-content: space-between; margin: 0; padding: .7rem 0; }
    .panel p span { min-width: 0; overflow-wrap: anywhere; }
    .panel p strong { color: #111827; font-size: 1rem; white-space: nowrap; }
    .coupon-field { border-top: 1px solid rgba(148,163,184,.16); display: grid; gap: .55rem; margin-top: 1rem; padding-top: 1rem; }
    .coupon-field label { color: #555; font-size: .94rem; font-weight: 850; line-height: 1.45; }
    .coupon-control { display: grid; gap: .7rem; grid-template-columns: minmax(0, 1fr) auto; }
    .coupon-field input { background: #fff; border: 1px solid rgba(17,17,17,.14); border-radius: 8px; color: #111; font: inherit; font-size: .94rem; font-weight: 800; min-height: 46px; outline: none; padding: .75rem 1rem; text-transform: uppercase; transition: border-color .2s ease, box-shadow .2s ease; width: 100%; }
    .coupon-field input:focus { border-color: #ff9700; box-shadow: 0 0 0 4px rgba(255,151,0,.14); }
    .coupon-field input::placeholder { color: #9a9a9a; font-weight: 700; text-transform: none; }
    .apply-coupon-btn { background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; cursor: pointer; font-size: .9rem; font-weight: 900; min-height: 46px; min-width: 96px; padding: .75rem 1.1rem; transition: background .2s ease, box-shadow .2s ease, color .2s ease, transform .2s ease; }
    .apply-coupon-btn:hover { background: #ff9700; color: #fff; transform: translateY(-1px); }
    .apply-coupon-btn:disabled, .apply-coupon-btn:disabled:hover { background: #111; color: #fff; cursor: not-allowed; opacity: .58; transform: none; }
    .coupon-error, .coupon-success { font-size: .86rem; font-weight: 850; line-height: 1.45; }
    .coupon-error { color: #b42318; }
    .coupon-success { color: #027a48; }
    .discount-row strong { color: #027a48; }
    .grand { border-top: 1px solid rgba(148,163,184,.16); padding-top: 1rem; }
    .grand strong { color: #ff9700; font-size: 1.2rem; }
    .panel app-button { display: block; margin-top: 1rem; }
    .success { margin: 4rem auto; max-width: 680px; text-align: center; }
    .success h1 { font-weight: 950; }
    .success a { color: #ff9700; font-weight: 900; }
    @media (max-width: 575px) { .panel p { flex-direction: column; } .coupon-control { grid-template-columns: 1fr; } }
  `]
})
export class CheckoutPageComponent {
  readonly cart = inject(CartService);
  readonly success = signal(false);
  readonly isPaying = signal(false);
  readonly isApplyingCoupon = signal(false);
  readonly paymentMethod = signal<PaymentMethod>('razorpay');
  readonly couponCode = signal('');
  readonly appliedCoupon = signal<CouponPreviewResponse | null>(null);
  readonly couponError = signal('');
  readonly discountAmount = computed(() => {
    const coupon = this.appliedCoupon();
    if (!coupon) {
      return 0;
    }
    return Math.round(this.cart.grandTotal() * (Number(coupon.discountPercent) / 100));
  });
  readonly payableAmount = computed(() => Math.max(0, this.cart.grandTotal() - this.discountAmount()));
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly paymentService = inject(PaymentService);

  actionLabel(): string {
    if (this.isPaying()) {
      return this.paymentMethod() === 'razorpay' ? 'Opening Razorpay...' : 'Processing...';
    }

    return this.paymentMethod() === 'razorpay' ? 'Pay with Razorpay' : 'Proceed';
  }

  updateCouponCode(value: string): void {
    const code = value.toUpperCase().replace(/\s+/g, '');
    this.couponCode.set(code);
    this.couponError.set('');
    if (this.appliedCoupon()?.code !== code) {
      this.appliedCoupon.set(null);
    }
  }

  applyCoupon(): void {
    const code = this.couponCode().trim();
    this.couponError.set('');
    if (!code) {
      this.couponError.set('Enter a coupon code.');
      return;
    }

    this.isApplyingCoupon.set(true);
    this.bookingService.previewCoupon(code)
      .pipe(finalize(() => {
        this.isApplyingCoupon.set(false);
      }))
      .subscribe({
        next: (coupon) => {
          this.appliedCoupon.set(coupon);
          this.couponCode.set(coupon.code);
          this.showNotification('Coupon applied.', 1800);
        },
        error: (error) => {
          this.appliedCoupon.set(null);
          this.couponError.set(this.authService.getErrorMessage(error));
        }
      });
  }

  placeOrder(): void {
    if (this.isPaying()) {
      return;
    }

    this.cart.removeExpiredItems();
    if (this.cart.count() === 0) {
      this.showNotification('Your cart is empty.', 2400);
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    if (!this.authService.isCustomer()) {
      void this.router.navigateByUrl(this.authService.defaultDashboardUrl());
      return;
    }

    this.isPaying.set(true);
    this.bookingService.createBooking({
      customerId: user.userId,
      rentalStartDate: this.dateInputValue(this.earliestStartDate()),
      rentalEndDate: this.dateInputValue(this.latestEndDate()),
      items: this.cart.items().flatMap((item) => Array.from({ length: item.quantity }, () => ({ productId: item.product.id }))),
      paymentMethod: this.paymentMethod(),
      couponCode: this.appliedCoupon()?.code ?? ''
    }).pipe(finalize(() => {
      if (this.paymentMethod() === 'cash') {
        this.isPaying.set(false);
      }
    })).subscribe({
      next: (booking) => {
        if (this.paymentMethod() === 'cash') {
          this.confirmCashBooking();
          return;
        }

        this.paymentService.createOrder({
          bookingId: booking.id,
          amount: booking.totalAmount,
          type: 'FULL_PAYMENT'
        }).subscribe({
          next: (order) => this.openRazorpay(order, booking.id),
          error: (error) => {
            this.isPaying.set(false);
            this.cancelPendingBooking(booking.id);
            this.showNotification(this.authService.getErrorMessage(error), 3600);
          }
        });
      },
      error: (error) => {
        this.isPaying.set(false);
        this.showNotification(this.authService.getErrorMessage(error), 3600);
      }
    });
  }

  private confirmCashBooking(): void {
    this.cart.clear();
    this.success.set(true);
    this.showNotification('Booking confirmed. Please pay in cash at delivery.', 2600);
    setTimeout(() => void this.router.navigateByUrl('/dashboard'), 1800);
  }

  private openRazorpay(order: PaymentOrderResponse, bookingId: number): void {
    this.loadRazorpayScript().then(() => {
      if (!window.Razorpay) {
        this.isPaying.set(false);
        this.cancelPendingBooking(bookingId);
        this.showNotification('Unable to load Razorpay checkout.', 3200);
        return;
      }

      const user = this.authService.currentUser();
      const razorpay = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: Math.round(Number(order.amount) * 100),
        currency: order.currency,
        name: 'Clickkaar',
        description: 'Equipment rental booking',
        order_id: order.razorpayOrderId,
        prefill: {
          name: user?.fullName ?? '',
          email: user?.email ?? '',
          contact: user?.mobile ?? ''
        },
        theme: {
          color: '#ff9700'
        },
        handler: (response) => this.verifyRazorpayPayment(response),
        modal: {
          ondismiss: () => {
            this.isPaying.set(false);
            this.cancelPendingBooking(bookingId);
          }
        }
      });

      razorpay.on('payment.failed', () => {
        this.isPaying.set(false);
        this.cancelPendingBooking(bookingId);
        this.showNotification('Razorpay payment failed. Please try again.', 3200);
      });
      razorpay.open();
    }).catch(() => {
      this.isPaying.set(false);
      this.cancelPendingBooking(bookingId);
      this.showNotification('Unable to load Razorpay checkout.', 3200);
    });
  }

  private verifyRazorpayPayment(response: RazorpayPaymentResponse): void {
    this.paymentService.verifyPayment({
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature
    }).pipe(finalize(() => {
      this.isPaying.set(false);
    })).subscribe({
      next: () => {
        this.cart.clear();
        this.success.set(true);
        this.showNotification('Payment successful. Booking confirmed.', 2600);
        setTimeout(() => void this.router.navigateByUrl('/dashboard'), 1800);
      },
      error: (error) => {
        this.showNotification(this.authService.getErrorMessage(error), 3600);
      }
    });
  }

  private showNotification(message: string, duration: number): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-screen-center']
    });
  }

  private cancelPendingBooking(bookingId: number): void {
    this.bookingService.cancelPendingBooking(bookingId).subscribe({
      error: () => undefined
    });
  }

  private loadRazorpayScript(): Promise<void> {
    if (window.Razorpay) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Razorpay checkout failed to load')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Razorpay checkout failed to load'));
      document.body.appendChild(script);
    });
  }

  private earliestStartDate(): Date {
    return this.cart.items().reduce((earliest, item) => item.startDate < earliest ? item.startDate : earliest, this.cart.items()[0].startDate);
  }

  private latestEndDate(): Date {
    return this.cart.items().reduce((latest, item) => item.endDate > latest ? item.endDate : latest, this.cart.items()[0].endDate);
  }

  private dateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
