import { CurrencyPipe, DatePipe } from '@angular/common';
import { AfterViewInit, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { useProductImageFallback } from '../services/product.service';
import { AppButtonComponent } from '../shared/components/app-button.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, AppButtonComponent, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Booking Cart" />
    <section class="container cart-page pb-5">
      <h1 class="section-title">Booking Cart</h1>
      <div class="row g-4">
        <div class="col-lg-8">
          @for (item of cart.items(); track cart.itemKey(item)) {
            <article class="surface item">
              <a class="item-media" [routerLink]="['/products', item.product.id]" [attr.aria-label]="'View ' + item.product.name">
                <img [src]="item.product.image" [alt]="item.product.name" (error)="useFallback($event, item.product.category)">
              </a>
              <div class="item-copy">
                <h2><a [routerLink]="['/products', item.product.id]">{{ item.product.name }}</a></h2>
                <p class="muted">{{ item.startDate | date }} - {{ item.endDate | date }} | {{ cart.duration(item) }} days</p>
                <p class="stock-note">{{ cart.availableStock(item.product) }} units available</p>
                <div class="qty">
                  <button type="button" [disabled]="item.quantity <= 1" (click)="cart.updateQuantity(item.product.id, item.startDate, item.endDate, item.quantity - 1)">-</button>
                  <span>{{ item.quantity }}</span>
                  <button type="button" [disabled]="item.quantity >= cart.availableStock(item.product)" (click)="cart.updateQuantity(item.product.id, item.startDate, item.endDate, item.quantity + 1)">+</button>
                </div>
              </div>
              <div class="item-actions text-end">
                <strong>{{ cart.itemTotal(item) | currency:'INR':'symbol':'1.0-0' }}</strong>
                @if (cart.itemDiscountPercent(item)) {
                  <small>{{ cart.itemDiscountPercent(item) }}% duration discount</small>
                }
                <button class="remove" (click)="cart.removeItem(item.product.id, item.startDate, item.endDate)">Remove</button>
              </div>
            </article>
          } @empty {
            <div class="surface empty">Your cart is empty. <a routerLink="/catalogue">Browse equipment</a>.</div>
          }
        </div>
        <aside class="col-lg-4">
          <div class="surface summary">
            <h2>Booking Summary</h2>
            <p><span>Subtotal</span><strong>{{ cart.baseSubtotal() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
            @if (cart.durationDiscountAmount()) {
              <p class="discount-row"><span>Duration discount</span><strong>-{{ cart.durationDiscountAmount() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
            }
            <p><span>Security Deposit</span><strong>{{ cart.securityDeposit() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
            <p class="grand"><span>Grand Total</span><strong>{{ cart.grandTotal() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
            <app-button type="button" (click)="goToCheckout()">Checkout</app-button>
          </div>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .cart-page .section-title { font-size: clamp(1.75rem, 3.4vw, 3rem); letter-spacing: 0; line-height: 1.08; margin-bottom: 1.1rem; text-align: left; }
    .item { align-items: center; display: grid; gap: 1rem; grid-template-columns: 124px minmax(0, 1fr) auto; margin-bottom: 1rem; padding: 1rem; }
    .item-media { border-radius: 8px; display: block; overflow: hidden; width: 124px; }
    .item img { aspect-ratio: 1/1; object-fit: cover; transition: transform .25s ease; width: 124px; }
    .item-media:hover img { transform: scale(1.04); }
    .item-copy { min-width: 0; }
    h2 { font-size: 1.08rem; font-weight: 900; line-height: 1.28; margin: 0 0 .5rem; }
    h2 a { color: #111827; overflow-wrap: anywhere; text-decoration: none; }
    h2 a:hover { color: #ff9700; }
    .muted { color: #555; font-size: .94rem; font-weight: 500; line-height: 1.55; margin-bottom: .4rem; }
    .qty { align-items: center; display: flex; gap: .7rem; }
    .qty span { color: #111827; font-size: 1rem; font-weight: 900; min-width: 1.7rem; text-align: center; }
    .qty button, .remove { align-items: center; background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; display: inline-flex; font-size: .9rem; font-weight: 800; justify-content: center; min-height: 46px; min-width: 46px; padding: .75rem 1.1rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; }
    .qty button:hover, .remove:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #fff; transform: translateY(-2px); }
    .qty button:disabled, .qty button:disabled:hover { background: #111; box-shadow: none; color: #fff; cursor: not-allowed; opacity: .45; transform: none; }
    .stock-note { color: #027a48; font-size: .86rem; font-weight: 850; line-height: 1.45; margin: 0 0 .75rem; }
    .item-actions { min-width: 132px; }
    .item-actions strong { color: #111827; display: block; font-size: 1.08rem; font-weight: 900; line-height: 1.2; }
    .item-actions small { color: #027a48; display: block; font-size: .78rem; font-weight: 900; line-height: 1.35; margin-top: .25rem; }
    .remove { margin-top: .65rem; width: 100%; }
    .summary { padding: 1.2rem; position: sticky; top: 92px; }
    .summary h2 { font-size: 1.08rem; margin-bottom: .5rem; }
    .summary p { border-bottom: 1px solid rgba(148,163,184,.15); color: #555; display: flex; font-size: .94rem; gap: 1rem; justify-content: space-between; margin: 0; padding: .7rem 0; }
    .summary p strong { color: #111827; font-size: 1rem; white-space: nowrap; }
    .discount-row span, .discount-row strong { color: #027a48 !important; }
    .grand strong { color: #ff9700; font-size: 1.2rem; }
    .summary app-button { display: block; margin-top: 1rem; }
    .empty { padding: 2rem; }
    .empty a { color: #ff9700; font-weight: 900; }
    @media (max-width: 575px) { .item { align-items: start; grid-template-columns: 104px minmax(0, 1fr); } .item-media, .item img { width: 104px; } .item-actions { grid-column: 1 / -1; min-width: 0; text-align: left !important; } .remove { width: auto; } }
  `]
})
export class CartPageComponent implements AfterViewInit {
  readonly cart = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngAfterViewInit(): void {
    window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }), 0);
    window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }), 120);
  }

  useFallback(event: Event, category: string): void {
    useProductImageFallback(event);
  }

  goToCheckout(): void {
    this.cart.removeExpiredItems();
    if (this.cart.count() === 0) {
      void this.router.navigateByUrl('/catalogue');
      return;
    }
    if (!this.authService.currentUser()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    void this.router.navigateByUrl(this.authService.isCustomer() ? '/checkout' : this.authService.defaultDashboardUrl());
  }
}


