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
        <span class="stock-chip">{{ product().stock }} available</span>
      </a>
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
    .product-card { background: #f7f7f5; border: 1px solid rgba(17,17,17,.08); border-radius: 20px; box-shadow: none; height: 100%; overflow: hidden; transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; }
    .product-card:hover { border-color: rgba(17,17,17,.18); box-shadow: 0 20px 42px rgba(0,0,0,.12); transform: translateY(-5px) rotate(-.4deg); }
    .media-link { background: #ececea; border-radius: 18px; display: block; margin: .55rem; overflow: hidden; position: relative; }
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
    .details { background: #fff; border: 1px solid rgba(17,17,17,.1); border-radius: 999px; color: #171717; font-size: .84rem; font-weight: 900; padding: .45rem .8rem; white-space: nowrap; }
    .details:hover { background: #151515; color: #fff; }
  `]
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
}
