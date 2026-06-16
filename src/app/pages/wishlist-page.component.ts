import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../services/wishlist.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';
import { ProductCardComponent } from '../shared/components/product-card.component';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, BreadcrumbComponent, ProductCardComponent],
  template: `
    <app-breadcrumb label="Wishlist" />
    <section class="container wishlist-page pb-5">
      <div class="wishlist-hero">
        <div class="hero-copy">
          <p class="eyebrow">Saved gear</p>
          <h1 class="section-title">Your wishlist</h1>
          <p class="muted intro">Keep your favourite cameras, lenses, lights, and accessories ready for the next booking.</p>
        </div>
        <div class="surface wishlist-summary">
          <span>{{ count() }} saved</span>
          <strong>{{ totalDaily() | currency:'INR':'symbol':'1.0-0' }}</strong>
          <small>Estimated daily rental total</small>
        </div>
      </div>

      @if (count() > 0) {
        <div class="wishlist-toolbar">
          <p>{{ availableCount() }} available now</p>
          <div class="toolbar-actions">
            <a routerLink="/catalogue" class="btn-pill light">Add more</a>
            <button type="button" class="clear-btn" (click)="wishlist.clear()">Clear wishlist</button>
          </div>
        </div>

        <div class="row g-4 wishlist-grid">
          @for (product of wishlist.products(); track product.id) {
            <div class="col-sm-6 col-xl-3">
              <app-product-card [product]="product" />
            </div>
          }
        </div>
      } @else {
        <div class="surface empty-state">
          <div class="empty-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 20.4s-7.2-4.5-9.4-8.7C.8 8.2 2.8 4.4 6.6 4.1c2.1-.2 3.8.9 5.4 2.8 1.6-1.9 3.3-3 5.4-2.8 3.8.3 5.8 4.1 4 7.6-2.2 4.2-9.4 8.7-9.4 8.7Z" />
            </svg>
          </div>
          <h2>No saved gear yet</h2>
          <p class="muted">Browse the catalogue and tap the heart on any product tile to build your shortlist.</p>
          <a routerLink="/catalogue" class="btn-pill">Explore catalogue</a>
        </div>
      }
    </section>
  `,
  styles: [`
    .wishlist-page { display: grid; gap: clamp(1.5rem, 3vw, 2.5rem); }
    .wishlist-hero { align-items: stretch; display: grid; gap: 1.25rem; grid-template-columns: minmax(0, 1fr) minmax(230px, 300px); }
    .hero-copy { align-self: end; max-width: 720px; }
    .section-title { margin-bottom: .8rem; text-align: left; }
    .intro { font-size: clamp(1rem, 1.8vw, 1.18rem); margin: 0; max-width: 620px; }
    .wishlist-summary { align-content: center; display: grid; gap: .35rem; min-height: 180px; padding: 1.4rem; }
    .wishlist-summary span { color: #ff9700; font-size: .78rem; font-weight: 950; letter-spacing: .16em; text-transform: uppercase; }
    .wishlist-summary strong { color: #111; font-size: clamp(2rem, 4vw, 3.2rem); letter-spacing: 0; line-height: .95; }
    .wishlist-summary small { color: #777; font-weight: 700; }
    .wishlist-toolbar { align-items: center; border-bottom: 1px solid rgba(17,17,17,.08); display: flex; gap: 1rem; justify-content: space-between; padding-bottom: 1.1rem; }
    .wishlist-toolbar p { color: #171717; font-weight: 900; margin: 0; }
    .toolbar-actions { align-items: center; display: flex; flex-wrap: wrap; gap: .75rem; justify-content: flex-end; }
    .clear-btn { background: #fff; border: 1px solid rgba(17,17,17,.12); border-radius: 999px; color: #111; font-size: .96rem; font-weight: 800; min-height: 50px; padding: .85rem 1.25rem; transition: transform .25s ease, border-color .25s ease, background .25s ease, color .25s ease; }
    .clear-btn:hover { background: #111; border-color: #111; color: #fff; transform: translateY(-2px); }
    .wishlist-grid { align-items: stretch; }
    .empty-state { align-items: center; display: grid; justify-items: center; min-height: 420px; padding: clamp(2rem, 6vw, 4rem); text-align: center; }
    .empty-mark { align-items: center; background: #111; border-radius: 999px; color: #ff9700; display: inline-flex; height: 78px; justify-content: center; margin-bottom: 1.15rem; width: 78px; }
    .empty-mark svg { fill: none; height: 36px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; width: 36px; }
    .empty-state h2 { color: #111; font-size: clamp(1.7rem, 4vw, 3rem); line-height: 1; margin: 0 0 .75rem; }
    .empty-state p { margin: 0 0 1.35rem; max-width: 420px; }
    @media (max-width: 767px) {
      .wishlist-hero { grid-template-columns: 1fr; }
      .wishlist-summary { min-height: 150px; }
      .wishlist-toolbar { align-items: stretch; flex-direction: column; }
      .toolbar-actions { justify-content: flex-start; }
      .toolbar-actions .btn-pill,
      .clear-btn { width: 100%; }
    }
  `]
})
export class WishlistPageComponent {
  readonly wishlist = inject(WishlistService);
  readonly count = computed(() => this.wishlist.products().length);
  readonly availableCount = computed(() => this.wishlist.products().filter((product) => product.available).length);
  readonly totalDaily = computed(() => this.wishlist.products().reduce((sum, product) => sum + product.dailyPrice, 0));
}
