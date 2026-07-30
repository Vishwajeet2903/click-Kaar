import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { productFallbackImage, useProductImageFallback } from '../../services/product.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  template: `
    <article class="product-card">
      <a [routerLink]="['/products', product().id]" class="media-link">
        <img class="product-image" [class.logo-fallback]="isFallbackImage()" [src]="product().image" [alt]="product().name" (error)="useFallback($event)">
      </a>
      @if (canShowCustomerActions()) {
        <button
          type="button"
          class="wishlist-btn"
          [class.active]="wishlist.has(product().id)"
          [attr.aria-label]="wishlist.has(product().id) ? 'Remove from wishlist' : 'Add to wishlist'"
          [attr.aria-pressed]="wishlist.has(product().id)"
          (click)="toggleWishlist()"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20.4s-7.2-4.5-9.4-8.7C.8 8.2 2.8 4.4 6.6 4.1c2.1-.2 3.8.9 5.4 2.8 1.6-1.9 3.3-3 5.4-2.8 3.8.3 5.8 4.1 4 7.6-2.2 4.2-9.4 8.7-9.4 8.7Z" />
          </svg>
        </button>
      }
      <div class="content">
        <p>{{ product().category }}</p>
        <h3><a [routerLink]="['/products', product().id]">{{ product().name }}</a></h3>
        <div class="card-bottom">
          <strong>{{ product().dailyPrice | currency:'INR':'symbol':'1.0-0' }}<small>/day</small></strong>
          <a class="details" [routerLink]="['/products', product().id]">Rent</a>
        </div>
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .product-card { background: #f6f6f4; border: 1px solid rgba(17,17,17,.06); border-radius: 24px; box-shadow: none; display: flex; flex-direction: column; height: 100%; overflow: hidden; padding: .65rem; position: relative; transition: box-shadow .28s ease, transform .28s ease; }
    .product-card:hover { box-shadow: 0 24px 48px rgba(0,0,0,.14); transform: translateY(-8px); }
    .media-link { background: #ececea; border-radius: 19px; display: block; overflow: hidden; position: relative; }
    .wishlist-btn { align-items: center; background: rgba(255,255,255,.94); border: 0; border-radius: 999px; box-shadow: 0 10px 24px rgba(0,0,0,.14); color: #111; display: inline-flex; height: 42px; justify-content: center; padding: 0; position: absolute; right: 1rem; top: 1rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; width: 42px; z-index: 2; }
    .wishlist-btn svg { fill: none; height: 21px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; width: 21px; }
    .wishlist-btn:hover { background: #111; box-shadow: 0 14px 30px rgba(0,0,0,.18); color: #fff; transform: translateY(-2px); }
    .wishlist-btn.active { background: #ff9700; color: #111; }
    .wishlist-btn.active svg { fill: currentColor; }
    img { aspect-ratio: 4/3; display: block; height: auto; object-fit: cover; width: 100%; transition: transform .35s ease; }
    img.logo-fallback { background: #fff; object-fit: contain; padding: clamp(1.4rem, 14%, 3rem); }
    .product-card:hover img { transform: scale(1.06); }
    .product-card:hover img.logo-fallback { transform: scale(1.02); }
    .content { display: flex; flex: 1; flex-direction: column; padding: .9rem .3rem .3rem; }
    .content p { color: #ff9700; font-size: .72rem; font-weight: 900; letter-spacing: .18em; margin: 0 0 .45rem; text-transform: uppercase; }
    h3 { color: #111; font-size: 1.04rem; font-weight: 900; letter-spacing: 0; line-height: 1.15; margin: 0 0 .9rem; min-height: 2.4em; word-spacing: .08em; }
    .card-bottom { align-items: center; display: flex; gap: .6rem; justify-content: space-between; margin-top: auto; min-height: 50px; }
    strong { color: #111; font-size: 1rem; font-weight: 950; word-spacing: .08em; }
    small { color: #777; font-size: .75rem; font-weight: 800; }
    .details { align-items: center; background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; display: inline-flex; font-size: .96rem; font-weight: 800; justify-content: center; min-height: 50px; padding: .85rem 1.25rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; white-space: nowrap; }
    .details:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
  `]
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly wishlist = inject(WishlistService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isFallbackImage(): boolean {
    return this.product().image === productFallbackImage();
  }

  useFallback(event: Event): void {
    useProductImageFallback(event);
    (event.target as HTMLImageElement | null)?.classList.add('logo-fallback');
  }

  canShowCustomerActions(): boolean {
    const user = this.authService.currentUser();
    return !user || this.authService.isCustomer();
  }

  toggleWishlist(): void {
    if (!this.ensureCustomerAccess()) {
      return;
    }
    this.wishlist.toggle(this.product());
  }

  private ensureCustomerAccess(): boolean {
    const user = this.authService.currentUser();
    if (!user) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return false;
    }
    return this.authService.isCustomer();
  }
}
