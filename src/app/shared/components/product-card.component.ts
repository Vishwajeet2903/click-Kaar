import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  template: `
    <article class="product-card">
      <a [routerLink]="['/products', product().id]" class="media-link">
        <img class="product-image" [src]="product().image" [alt]="product().name">
      </a>
      <div class="content">
        <div class="d-flex justify-content-between gap-2 align-items-start">
          <div>
            <p class="eyebrow mb-1">{{ product().category }}</p>
            <h3><a [routerLink]="['/products', product().id]">{{ product().name }}</a></h3>
          </div>
          <span class="rating">★ {{ product().rating }}</span>
        </div>
        <p class="muted mb-3">{{ product().brand }} · {{ product().stock }} in stock</p>
        <div class="d-flex justify-content-between align-items-end gap-3">
          <div>
            <strong>{{ product().dailyPrice | currency:'INR':'symbol':'1.0-0' }}</strong>
            <span class="muted"> / day</span>
          </div>
          <a class="details" [routerLink]="['/products', product().id]">View</a>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .product-card { background: #fff; border: 1px solid #ededed; border-radius: 2.5%; box-shadow: 0 8px 22px rgba(0,0,0,.08); height: 100%; overflow: hidden; transition: transform .2s ease, border-color .2s ease; }
    .product-card:hover { border-color: rgba(216,164,59,.7); transform: translateY(-3px); }
    .media-link { display: block; overflow: hidden; }
    img { aspect-ratio: 4/3; height: auto; width: 100%; transition: transform .35s ease; }
    .product-card:hover img { transform: scale(1.04); }
    .content { padding: 1rem; }
    h3 { color: #171717; font-size: 1.02rem; font-weight: 700; line-height: 1.28; margin: 0; }
    strong { color: #171717; font-size: 1.08rem; }
    .rating, .details { color: #ff9700; font-weight: 800; white-space: nowrap; }
  `]
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
}
