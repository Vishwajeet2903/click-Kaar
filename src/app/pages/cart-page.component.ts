import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
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
    <section class="container pb-5">
      <h1 class="section-title">Booking Cart</h1>
      <div class="row g-4">
        <div class="col-lg-8">
          @for (item of cart.items(); track item.product.id) {
            <article class="surface item">
              <a class="item-media" [routerLink]="['/products', item.product.id]" [attr.aria-label]="'View ' + item.product.name">
                <img [src]="item.product.image" [alt]="item.product.name" (error)="useFallback($event, item.product.category)">
              </a>
              <div>
                <h2><a [routerLink]="['/products', item.product.id]">{{ item.product.name }}</a></h2>
                <p class="muted">{{ item.startDate | date }} - {{ item.endDate | date }} · {{ cart.duration(item) }} days</p>
                <div class="qty"><button (click)="cart.updateQuantity(item.product.id, item.quantity - 1)">-</button><span>{{ item.quantity }}</span><button (click)="cart.updateQuantity(item.product.id, item.quantity + 1)">+</button></div>
              </div>
              <div class="text-end">
                <strong>{{ cart.itemTotal(item) | currency:'INR':'symbol':'1.0-0' }}</strong>
                <button class="remove" (click)="cart.remove(item.product.id)">Remove</button>
              </div>
            </article>
          } @empty {
            <div class="surface empty">Your cart is empty. <a routerLink="/catalogue">Browse equipment</a>.</div>
          }
        </div>
        <aside class="col-lg-4">
          <div class="surface summary">
            <h2>Booking Summary</h2>
            <p><span>Subtotal</span><strong>{{ cart.subtotal() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
            <p><span>Security Deposit</span><strong>{{ cart.securityDeposit() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
            <p><span>GST</span><strong>{{ cart.tax() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
            <p class="grand"><span>Grand Total</span><strong>{{ cart.grandTotal() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
            <app-button type="button" (click)="goToCheckout()">Checkout</app-button>
          </div>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .item { align-items: center; display: grid; gap: 1rem; grid-template-columns: 130px 1fr auto; margin-bottom: 1rem; padding: 1rem; }
    .item-media { border-radius: 2.5%; display: block; overflow: hidden; width: 130px; }
    .item img { aspect-ratio: 1/1; object-fit: cover; transition: transform .25s ease; width: 130px; }
    .item-media:hover img { transform: scale(1.04); }
    h2 { font-size: 1.15rem; font-weight: 900; }
    h2 a:hover { color: #ff9700; }
    .qty { align-items: center; display: flex; gap: .7rem; }
    .qty button, .remove { align-items: center; background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; display: inline-flex; font-weight: 800; justify-content: center; min-height: 50px; min-width: 50px; padding: .85rem 1.25rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; }
    .qty button:hover, .remove:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .remove { display: block; margin-top: .6rem; width: 100%; }
    .summary { padding: 1.25rem; position: sticky; top: 92px; }
    .summary p { border-bottom: 1px solid rgba(148,163,184,.15); display: flex; justify-content: space-between; padding: .7rem 0; }
    .grand strong { color: #ff9700; font-size: 1.2rem; }
    .empty { padding: 2rem; }
    .empty a { color: #ff9700; font-weight: 900; }
    @media (max-width: 575px) { .item { grid-template-columns: 1fr; } .item-media, .item img { width: 100%; } .text-end { text-align: left !important; } }
  `]
})
export class CartPageComponent {
  readonly cart = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  useFallback(event: Event, category: string): void {
    useProductImageFallback(event);
  }

  goToCheckout(): void {
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
