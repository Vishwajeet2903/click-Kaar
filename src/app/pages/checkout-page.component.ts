import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { AppButtonComponent } from '../shared/components/app-button.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

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
              <div class="pay-grid">
                @for (method of ['UPI', 'Card', 'Net Banking']; track method) {
                  <label [class.active]="form.value.payment === method"><input type="radio" formControlName="payment" [value]="method"> {{ method }}</label>
                }
              </div>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="surface panel">
              <h2>Order Summary</h2>
              @for (item of cart.items(); track item.product.id) { <p><span>{{ item.product.name }} x {{ item.quantity }}</span><strong>{{ cart.itemTotal(item) | currency:'INR':'symbol':'1.0-0' }}</strong></p> }
              <p class="grand"><span>Total</span><strong>{{ cart.grandTotal() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
              <app-button type="submit">Place Mock Order</app-button>
            </div>
          </div>
        </form>
      }
    </section>
  `,
  styles: [`
    .panel, .success { padding: 1.25rem; margin-bottom: 1rem; }
    h2 { font-size: 1.2rem; font-weight: 900; margin-bottom: 1rem; }
    .pay-grid { display: grid; gap: .8rem; grid-template-columns: repeat(3, 1fr); }
    .pay-grid label { border: 1px solid rgba(148,163,184,.2); border-radius: 8px; cursor: pointer; font-weight: 900; padding: 1rem; text-align: center; }
    .pay-grid label.active { background: rgba(255,151,0,.14); border-color: #ff9700; }
    .panel p { display: flex; justify-content: space-between; gap: 1rem; }
    .grand { border-top: 1px solid rgba(148,163,184,.16); padding-top: 1rem; }
    .grand strong { color: #ff9700; }
    .success { margin: 4rem auto; max-width: 680px; text-align: center; }
    .success h1 { font-weight: 950; }
    .success a { color: #ff9700; font-weight: 900; }
    @media (max-width: 575px) { .pay-grid { grid-template-columns: 1fr; } }
  `]
})
export class CheckoutPageComponent {
  readonly cart = inject(CartService);
  readonly success = signal(false);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.minLength(10)]],
    address: ['', Validators.required],
    payment: ['UPI', Validators.required]
  });

  placeOrder(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please complete the required checkout fields', 'Close', { duration: 2400 });
      return;
    }
    this.cart.clear();
    this.success.set(true);
    setTimeout(() => void this.router.navigateByUrl('/dashboard'), 1800);
  }
}
