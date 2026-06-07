import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { ProductService } from '../services/product.service';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-marketplace-section',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, RouterLink, ScrollRevealDirective],
  template: `
    <section class="landing-card marketplace-section" id="marketplace">
      <div class="section-heading" appScrollReveal="fade-up">
        <div>
          <p class="eyebrow">Marketplace</p>
          <h2>Shop gear, studios, and creator services in one place.</h2>
        </div>
        <a routerLink="/catalogue" class="btn-pill dark">Open catalogue</a>
      </div>

      <div class="shop-toolbar" appScrollReveal="fade-up" [revealDelay]="90">
        <span>Popular today</span>
        <a routerLink="/catalogue" [queryParams]="{ category: 'Cameras' }">Cameras</a>
        <a routerLink="/catalogue" [queryParams]="{ category: 'Lenses' }">Lenses</a>
        <a routerLink="/catalogue" [queryParams]="{ category: 'Lighting' }">Lighting</a>
        <a routerLink="/catalogue" [queryParams]="{ category: 'Audio Equipment' }">Audio</a>
      </div>

      <div class="product-market-grid">
        @for (product of featured$ | async; track product.id; let index = $index) {
          <article class="market-product" appScrollReveal="fade-up" [revealStagger]="index * 95">
            <a [routerLink]="['/products', product.id]" class="product-media">
              <img [src]="product.image" [alt]="product.name">
              <span>{{ product.available ? 'Available now' : 'Waitlist' }}</span>
            </a>
            <div class="product-body">
              <p>{{ product.category }}</p>
              <h3><a [routerLink]="['/products', product.id]">{{ product.name }}</a></h3>
              <div class="commerce-row">
                <strong>{{ product.dailyPrice | currency:'INR':'symbol':'1.0-0' }}<small>/day</small></strong>
                <a [routerLink]="['/products', product.id]">Rent</a>
              </div>
            </div>
          </article>
        }
      </div>

      <div class="feature-grid" aria-label="How the marketplace works">
        @for (feature of features; track feature.title; let index = $index) {
          <article class="feature-card" appScrollReveal="fade-up" [revealStagger]="index * 95">
            <span>{{ feature.number }}</span>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.text }}</p>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    .marketplace-section { padding: clamp(2rem, 6vw, 4.8rem); }
    .section-heading { align-items: end; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 1.25rem; }
    h2 { color: #111; font-size: clamp(2.5rem, 5vw, 4.6rem); font-weight: 900; letter-spacing: -.055em; line-height: .98; margin: 0; }
    .shop-toolbar { align-items: center; background: #f6f6f4; border-radius: 999px; display: flex; flex-wrap: wrap; gap: .55rem; margin-bottom: 1.1rem; padding: .55rem; width: max-content; max-width: 100%; }
    .shop-toolbar span, .shop-toolbar a { border-radius: 999px; color: #111; font-size: .76rem; font-weight: 900; padding: .55rem .78rem; }
    .shop-toolbar span { background: #111; color: #fff; }
    .shop-toolbar a { background: #fff; }
    .product-market-grid { display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 1.2rem; }
    .market-product { background: #f6f6f4; border: 1px solid rgba(17,17,17,.06); border-radius: 24px; overflow: hidden; padding: .65rem; transition: box-shadow .28s ease, transform .28s ease; }
    .market-product:hover { box-shadow: 0 24px 48px rgba(0,0,0,.14); transform: translateY(-8px); }
    .product-media { border-radius: 19px; display: block; overflow: hidden; position: relative; }
    .product-media img { aspect-ratio: 4/3; object-fit: cover; transition: transform .35s ease; width: 100%; }
    .market-product:hover .product-media img { transform: scale(1.06); }
    .product-media span { background: rgba(255,255,255,.93); border-radius: 999px; bottom: .65rem; color: #128172; font-size: .7rem; font-weight: 900; left: .65rem; padding: .42rem .58rem; position: absolute; }
    .product-body { padding: .9rem .3rem .3rem; }
    .product-body p { color: #128172; font-size: .72rem; font-weight: 900; letter-spacing: .18em; margin: 0 0 .45rem; text-transform: uppercase; }
    .product-body h3 { color: #111; font-size: 1.04rem; font-weight: 900; letter-spacing: -.04em; line-height: 1.15; margin: 0 0 .9rem; }
    .commerce-row { align-items: center; display: flex; justify-content: space-between; gap: .6rem; }
    .commerce-row strong { color: #111; font-size: 1rem; font-weight: 950; }
    .commerce-row small { color: #777; font-size: .75rem; font-weight: 800; }
    .commerce-row a { background: #111; border-radius: 999px; color: #fff; font-size: .78rem; font-weight: 900; padding: .55rem .8rem; }
    .feature-grid { display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .feature-card { background: #fff; border: 1px solid rgba(17,17,17,.06); border-radius: 24px; min-height: 220px; padding: 1.4rem; transition: transform .28s ease, box-shadow .28s ease; }
    .feature-card:hover { box-shadow: 0 22px 45px rgba(0,0,0,.12); transform: translateY(-8px); }
    .feature-card span { color: #80bfb6; font-size: .78rem; font-weight: 900; letter-spacing: .22em; }
    .feature-card h3 { color: #111; font-size: 1.45rem; font-weight: 900; letter-spacing: -.04em; line-height: 1.05; margin: 1.2rem 0 .8rem; }
    .feature-card p { color: #5e5e5a; line-height: 1.55; margin: 0; }
    @media (max-width: 980px) {
      .section-heading { align-items: flex-start; flex-direction: column; }
      .product-market-grid, .feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .marketplace-section { padding: 1.25rem; }
      .product-market-grid, .feature-grid { grid-template-columns: 1fr; }
      .shop-toolbar { border-radius: 22px; width: 100%; }
      .feature-card { min-height: 220px; }
    }
  `]
})
export class MarketplaceSectionComponent {
  readonly featured$: Observable<Product[]> = inject(ProductService).getFeatured();
  readonly features = [
    { number: '01', title: 'Choose dates', text: 'Pick rental days and see stock before you commit.' },
    { number: '02', title: 'Build your cart', text: 'Add cameras, lenses, lights, audio, studios, or people.' },
    { number: '03', title: 'Confirm booking', text: 'Transparent daily pricing and availability on every listing.' },
    { number: '04', title: 'Shoot with support', text: 'Get production help for pickup, setup, and creative teams.' }
  ];
}
