import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  template: `
    <article class="product-card">
      <a [routerLink]="['/products', product().id]" class="media-link">
        <img class="product-image" [src]="product().image" [alt]="product().name">
        <span class="stock-chip">{{ product().stock }} available</span>
      </a>
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
      <div class="content">
        <div class="title-row">
          <div>
            <p class="eyebrow mb-1">{{ product().category }}</p>
            <h3><a [routerLink]="['/products', product().id]">{{ product().name }}</a></h3>
          </div>
          <span class="rating">{{ product().rating }}</span>
        </div>
        <p class="muted meta">{{ product().brand }} / {{ product().dailyPrice | currency:'INR':'symbol':'1.0-0' }} per day</p>
        <div class="card-bottom">
          <strong>{{ product().weeklyPrice | currency:'INR':'symbol':'1.0-0' }} weekly</strong>
          <a class="details" [routerLink]="['/products', product().id]">View</a>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .product-card { background: #f7f7f5; border: 1px solid rgba(17,17,17,.08); border-radius: 20px; box-shadow: none; height: 100%; overflow: hidden; position: relative; transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
    .product-card:hover { border-color: rgba(17,17,17,.18); box-shadow: 0 20px 42px rgba(0,0,0,.12); transform: translateY(-5px) rotate(-.4deg); }
    .media-link { background: #ececea; border-radius: 18px; display: block; margin: .55rem; overflow: hidden; position: relative; }
    .wishlist-btn { align-items: center; background: rgba(255,255,255,.94); border: 0; border-radius: 999px; box-shadow: 0 10px 24px rgba(0,0,0,.14); color: #111; display: inline-flex; height: 42px; justify-content: center; padding: 0; position: absolute; right: 1rem; top: 1rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; width: 42px; z-index: 2; }
    .wishlist-btn svg { fill: none; height: 21px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; width: 21px; }
    .wishlist-btn:hover { background: #111; box-shadow: 0 14px 30px rgba(0,0,0,.18); color: #fff; transform: translateY(-2px); }
    .wishlist-btn.active { background: #ff9700; color: #111; }
    .wishlist-btn.active svg { fill: currentColor; }
    img { aspect-ratio: 4/3; height: auto; object-fit: cover; width: 100%; transition: transform .35s ease; }
    .product-card:hover img { transform: scale(1.04); }
    .stock-chip { background: rgba(17,17,17,.88); border-radius: 999px; bottom: .7rem; color: #fff; font-size: .68rem; font-weight: 900; left: .7rem; padding: .45rem .65rem; position: absolute; text-transform: uppercase; }
    .content { padding: 1rem; }
    .title-row { align-items: flex-start; display: flex; gap: .85rem; justify-content: space-between; }
    h3 { color: #111; font-size: 1.04rem; font-weight: 900; letter-spacing: -.035em; line-height: 1.16; margin: 0; }
    .meta { font-size: .86rem; margin: .7rem 0 1rem; }
    .card-bottom { align-items: center; display: flex; gap: .85rem; justify-content: space-between; }
    strong { color: #171717; font-size: .96rem; }
    .rating { align-items: center; background: rgba(255,151,0,.14); border-radius: 999px; color: #ff9700; display: inline-flex; flex: 0 0 auto; font-size: .82rem; font-weight: 950; min-height: 32px; padding: .3rem .6rem; }
    .details { align-items: center; background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; display: inline-flex; font-size: .96rem; font-weight: 800; justify-content: center; min-height: 50px; padding: .85rem 1.25rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; white-space: nowrap; }
    .details:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
  `]
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly wishlist = inject(WishlistService);

  toggleWishlist(): void {
    this.wishlist.toggle(this.product());
  }
}
