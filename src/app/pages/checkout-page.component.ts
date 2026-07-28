import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
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
    <section class="container pb-5">
      @if (success()) {
        <div class="surface success"><h1>Booking confirmed</h1><p class="muted">Your mock rental order has been placed successfully.</p><a href="/dashboard">Go to dashboard</a></div>
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
              @for (item of cart.items(); track item.product.id) { <p><span>{{ item.product.name }} x {{ item.quantity }}</span><strong>{{ cart.itemTotal(item) | currency:'INR':'symbol':'1.0-0' }}</strong></p> }
              <p class="grand"><span>Total</span><strong>{{ cart.grandTotal() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
              <app-button type="button" [disabled]="isPaying() || cart.count() === 0" (click)="placeOrder()">{{ actionLabel() }}</app-button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .panel, .success { padding: 1.25rem; margin-bottom: 1rem; }
    h2 { font-size: 1.2rem; font-weight: 900; margin-bottom: 1rem; }
    .payment-option { background: #fff; border: 1px solid rgba(255,151,0,.28); border-radius: 18px; cursor: pointer; display: grid; gap: .35rem; margin-bottom: .85rem; padding: 1rem; text-align: left; transition: border-color .25s ease, box-shadow .25s ease, transform .25s ease; width: 100%; }
    .payment-option:hover, .payment-option.active { border-color: #ff9700; box-shadow: 0 12px 24px rgba(255,151,0,.14); transform: translateY(-1px); }
    .payment-option.active { background: rgba(255,151,0,.08); }
    .payment-option strong { color: #111; font-size: 1.02rem; }
    .payment-option span { color: #777; line-height: 1.45; }
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
  readonly paymentMethod = signal<PaymentMethod>('razorpay');
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

  placeOrder(): void {
    if (this.isPaying()) {
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
          next: (order) => this.openRazorpay(order),
          error: (error) => {
            this.isPaying.set(false);
            this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 });
          }
        });
      },
      error: (error) => {
        this.isPaying.set(false);
        this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 });
      }
    });
  }

  private confirmCashBooking(): void {
    this.cart.clear();
    this.success.set(true);
    this.snackBar.open('Booking confirmed. Please pay in cash at delivery.', 'Close', {
      duration: 2600,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-success-top']
    });
    setTimeout(() => void this.router.navigateByUrl('/dashboard'), 1800);
  }

  private openRazorpay(order: PaymentOrderResponse): void {
    this.loadRazorpayScript().then(() => {
      if (!window.Razorpay) {
        this.isPaying.set(false);
        this.snackBar.open('Unable to load Razorpay checkout.', 'Close', { duration: 3200 });
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
        this.snackBar.open('Payment successful. Booking confirmed.', 'Close', {
          duration: 2600,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snackbar-success-top']
        });
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
