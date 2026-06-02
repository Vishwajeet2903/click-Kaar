import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../services/wishlist.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';
import { ProductCardComponent } from '../shared/components/product-card.component';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [RouterLink, BreadcrumbComponent, ProductCardComponent],
  template: `
    <app-breadcrumb label="Wishlist" />
    <section class="container pb-5">
      <h1 class="section-title">Wishlist</h1>
      <div class="row g-4">
        @for (product of wishlist.products(); track product.id) {
          <div class="col-sm-6 col-lg-3"><app-product-card [product]="product" /></div>
        } @empty {
          <div class="col-12"><div class="surface empty">No saved gear yet. <a routerLink="/catalogue">Explore catalogue</a>.</div></div>
        }
      </div>
    </section>
  `,
  styles: [`.empty { padding: 2rem; } a { color: #ff9700; font-weight: 900; }`]
})
export class WishlistPageComponent {
  readonly wishlist = inject(WishlistService);
}
