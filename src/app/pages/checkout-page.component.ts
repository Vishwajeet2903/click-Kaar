import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { finalize, map, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { CartService } from '../services/cart.service';
import { PaymentOrderResponse, PaymentService } from '../services/payment.service';
import { AppButtonComponent } from '../shared/components/app-button.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

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
  imports: [CurrencyPipe, ReactiveFormsModule, MatSnackBarModule, AppButtonComponent, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Checkout" />
    <section class="container pb-5">
      @if (success()) {
        <div class="surface success"><h1>Booking confirmed</h1><p class="muted">Your mock rental order has been placed successfully.</p><a href="/dashboard">Go to dashboard</a></div>
      } @else {
        <h1 class="section-title">Checkout</h1>
        <form class="row g-4" [formGroup]="form" (ngSubmit)="placeOrder()">
          <div class="col-lg-7">
            <div class="surface panel">
              <h2>Customer Information</h2>
              <div class="row g-3">
                <div class="col-md-6"><input class="form-control" placeholder="Name" formControlName="name"></div>
                <div class="col-md-6"><input class="form-control" placeholder="Email" formControlName="email"></div>
                <div class="col-md-6"><input class="form-control" placeholder="Mobile" formControlName="mobile"></div>
                <div class="col-md-6"><input class="form-control" placeholder="Address" formControlName="address"></div>
              </div>
            </div>
            <div class="surface panel">
              <h2>Payment Method</h2>
              <div class="razorpay-box">
                <strong>Razorpay secure checkout</strong>
                <span>Pay with UPI, card, net banking, or wallet in the Razorpay popup.</span>
              </div>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="surface panel">
              <h2>Order Summary</h2>
              @for (item of cart.items(); track item.product.id) { <p><span>{{ item.product.name }} x {{ item.quantity }}</span><strong>{{ cart.itemTotal(item) | currency:'INR':'symbol':'1.0-0' }}</strong></p> }
              <p class="grand"><span>Total</span><strong>{{ cart.grandTotal() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
              <app-button type="submit" [disabled]="isPaying() || cart.count() === 0">{{ isPaying() ? 'Opening Razorpay...' : 'Pay with Razorpay' }}</app-button>
            </div>
          </div>
        </form>
      }
    </section>
  `,
  styles: [`
    .panel, .success { padding: 1.25rem; margin-bottom: 1rem; }
    .form-control::placeholder { color: #8a8a86; opacity: 1; }
    h2 { font-size: 1.2rem; font-weight: 900; margin-bottom: 1rem; }
    .razorpay-box { background: #fff; border: 1px solid rgba(255,151,0,.28); border-radius: 18px; display: grid; gap: .35rem; padding: 1rem; }
    .razorpay-box strong { color: #111; font-size: 1.02rem; }
    .razorpay-box span { color: #777; line-height: 1.45; }
    .panel p { display: flex; justify-content: space-between; gap: 1rem; }
    .grand { border-top: 1px solid rgba(148,163,184,.16); padding-top: 1rem; }
    .grand strong { color: #ff9700; }
    .success { margin: 4rem auto; max-width: 680px; text-align: center; }
    .success h1 { font-weight: 950; }
    .success a { color: #ff9700; font-weight: 900; }
    @media (max-width: 575px) { .panel p { flex-direction: column; } }
  `]
})
export class CheckoutPageComponent {
  readonly cart = inject(CartService);
  readonly success = signal(false);
  readonly isPaying = signal(false);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly paymentService = inject(PaymentService);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.minLength(10)]],
    address: ['', Validators.required]
  });

  placeOrder(): void {
    if (this.form.invalid || this.isPaying()) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please complete the required checkout fields', 'Close', { duration: 2400 });
      return;
    }

    if (this.cart.count() === 0) {
      this.snackBar.open('Your cart is empty.', 'Close', { duration: 2400 });
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    this.isPaying.set(true);
    this.bookingService.createBooking({
      customerId: user.userId,
      rentalStartDate: this.dateInputValue(this.earliestStartDate()),
      rentalEndDate: this.dateInputValue(this.latestEndDate()),
      items: this.cart.items().flatMap((item) => Array.from({ length: item.quantity }, () => ({ productId: item.product.id })))
    }).pipe(
      switchMap((booking) => this.paymentService.createOrder({
        bookingId: booking.id,
        amount: this.cart.grandTotal(),
        type: 'FULL_PAYMENT'
      }).pipe(map((order) => ({ booking, order }))))
    ).subscribe({
      next: ({ order }) => this.openRazorpay(order),
      error: (error) => {
        this.isPaying.set(false);
        this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 });
      }
    });
  }

  private openRazorpay(order: PaymentOrderResponse): void {
    this.loadRazorpayScript().then(() => {
      if (!window.Razorpay) {
        this.isPaying.set(false);
        this.snackBar.open('Unable to load Razorpay checkout.', 'Close', { duration: 3200 });
        return;
      }

      const value = this.form.getRawValue();
      const razorpay = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: 'Clickkaar',
        description: 'Equipment rental booking',
        order_id: order.razorpayOrderId,
        prefill: {
          name: value.name,
          email: value.email,
          contact: value.mobile
        },
        theme: {
          color: '#ff9700'
        },
        handler: (response) => this.verifyRazorpayPayment(response),
        modal: {
          ondismiss: () => {
            this.isPaying.set(false);
          }
        }
      });

      razorpay.on('payment.failed', () => {
        this.isPaying.set(false);
        this.snackBar.open('Razorpay payment failed. Please try again.', 'Close', { duration: 3200 });
      });
      razorpay.open();
    }).catch(() => {
      this.isPaying.set(false);
      this.snackBar.open('Unable to load Razorpay checkout.', 'Close', { duration: 3200 });
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
        this.snackBar.open('Payment successful. Booking confirmed.', 'Close', { duration: 2600 });
        setTimeout(() => void this.router.navigateByUrl('/dashboard'), 1800);
      },
      error: (error) => {
        this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 });
      }
    });
  }

  private loadRazorpayScript(): Promise<void> {
    if (window.Razorpay) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
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
