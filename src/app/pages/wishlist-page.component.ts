import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { useProductImageFallback } from '../services/product.service';
import { WishlistService } from '../services/wishlist.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Wishlist" />
    <section class="container wishlist-page pb-5">
      <h1 class="section-title">Your Wishlist</h1>
      <div class="row g-4">
        <div class="col-lg-8">
          @for (product of wishlist.products(); track product.id) {
            <article class="surface item">
              <a class="item-media" [routerLink]="['/products', product.id]" [attr.aria-label]="'View ' + product.name">
                <img [src]="product.image" [alt]="product.name" (error)="useFallback($event)">
              </a>
              <div class="item-copy">
                <p class="category">{{ product.category }}</p>
                <h2><a [routerLink]="['/products', product.id]">{{ product.name }}</a></h2>
                <p class="muted">{{ product.description }}</p>
                <p class="stock-note" [class.unavailable]="!product.available">{{ product.available ? availableText(product.stock) : 'Currently unavailable' }}</p>
              </div>
              <div class="item-actions text-end">
                <strong>{{ product.dailyPrice | currency:'INR':'symbol':'1.0-0' }}<small>/day</small></strong>
                <a class="rent" [routerLink]="['/products', product.id]">Rent</a>
                <button class="remove" type="button" (click)="wishlist.toggle(product)">Remove</button>
              </div>
            </article>
          } @empty {
            <div class="surface empty">Your wishlist is empty. <a routerLink="/catalogue">Browse equipment</a>.</div>
          }
        </div>
        <aside class="col-lg-4">
          <div class="surface summary">
            <h2>Wishlist Summary</h2>
            <p><span>Saved Items</span><strong>{{ count() }}</strong></p>
            <p><span>Available Now</span><strong>{{ availableCount() }}</strong></p>
            <p class="grand"><span>Daily Total</span><strong>{{ totalDaily() | currency:'INR':'symbol':'1.0-0' }}</strong></p>
            <a routerLink="/catalogue" class="summary-action">Add more</a>
            @if (count() > 0) {
              <button type="button" class="clear-btn" (click)="wishlist.clear()">Clear wishlist</button>
            }
          </div>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .wishlist-page .section-title { font-size: clamp(1.75rem, 3.4vw, 3rem); letter-spacing: 0; line-height: 1.08; margin-bottom: 1.1rem; text-align: left; }
    .item { align-items: center; display: grid; gap: 1rem; grid-template-columns: 124px minmax(0, 1fr) auto; margin-bottom: 1rem; padding: 1rem; }
    .item-media { border-radius: 8px; display: block; overflow: hidden; width: 124px; }
    .item img { aspect-ratio: 1/1; object-fit: cover; transition: transform .25s ease; width: 124px; }
    .item-media:hover img { transform: scale(1.04); }
    .item-copy { min-width: 0; }
    .category { color: #d77d00; font-size: .76rem; font-weight: 900; letter-spacing: .08em; line-height: 1.35; margin: 0 0 .35rem; text-transform: uppercase; }
    h2 { font-size: 1.08rem; font-weight: 900; line-height: 1.28; margin: 0 0 .5rem; }
    h2 a { color: #111827; overflow-wrap: anywhere; text-decoration: none; }
    h2 a:hover { color: #ff9700; }
    .muted { color: #555; display: -webkit-box; font-size: .94rem; font-weight: 500; line-height: 1.55; margin-bottom: .4rem; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
    .stock-note { color: #027a48; font-size: .86rem; font-weight: 850; line-height: 1.45; margin: 0; }
    .stock-note.unavailable { color: #b42318; }
    .item-actions { min-width: 132px; }
    .item-actions strong { color: #111827; display: block; font-size: 1.08rem; font-weight: 900; line-height: 1.2; }
    .item-actions small { color: #666; font-size: .78rem; font-weight: 600; }
    .rent, .remove, .summary-action, .clear-btn { align-items: center; border-radius: 999px; display: inline-flex; font-size: .9rem; font-weight: 800; justify-content: center; min-height: 46px; padding: .75rem 1.1rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease, border-color .25s ease; }
    .rent, .summary-action { background: #111; border: 0; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; margin-top: .65rem; text-decoration: none; width: 100%; }
    .rent:hover, .summary-action:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #fff; transform: translateY(-2px); }
    .remove, .clear-btn { background: #fff; border: 1px solid rgba(17,17,17,.12); color: #111; margin-top: .55rem; width: 100%; }
    .remove:hover, .clear-btn:hover { background: #111; border-color: #111; color: #fff; transform: translateY(-2px); }
    .summary { padding: 1.2rem; position: sticky; top: 92px; }
    .summary h2 { font-size: 1.08rem; margin-bottom: .5rem; }
    .summary p { border-bottom: 1px solid rgba(148,163,184,.15); color: #555; display: flex; font-size: .94rem; gap: 1rem; justify-content: space-between; margin: 0; padding: .7rem 0; }
    .summary p strong { color: #111827; font-size: 1rem; white-space: nowrap; }
    .grand strong { color: #ff9700; font-size: 1.2rem; }
    .empty { padding: 2rem; }
    .empty a { color: #ff9700; font-weight: 900; }
    @media (max-width: 575px) {
      .item { align-items: start; grid-template-columns: 104px minmax(0, 1fr); }
      .item-media, .item img { width: 104px; }
      .item-actions { grid-column: 1 / -1; min-width: 0; text-align: left !important; }
      .rent, .remove { width: auto; }
    }
  `]
})
export class WishlistPageComponent {
  readonly wishlist = inject(WishlistService);
  readonly count = computed(() => this.wishlist.products().length);
  readonly availableCount = computed(() => this.wishlist.products().filter((product) => product.available).length);
  readonly totalDaily = computed(() => this.wishlist.products().reduce((sum, product) => sum + product.dailyPrice, 0));

  useFallback(event: Event): void {
    useProductImageFallback(event);
  }

  availableText(stock?: number): string {
    return `${stock ?? 1} units available`;
  }
}
