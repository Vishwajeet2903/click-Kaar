import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { ProductService } from '../services/product.service';
import { ProductCardComponent } from '../shared/components/product-card.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [AsyncPipe, RouterLink, ProductCardComponent],
  template: `
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <h1>ONE SPOT STOP<span>!</span></h1>
          <h2><span>for</span> Photographers</h2>
          <p>We helping to find perfect requirements for you...</p>
          <a routerLink="/catalogue" class="start">Get Started</a>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="orange-blob"></div>
          <div class="photographer-shape"></div>
        </div>
      </div>
    </section>

    <section class="requirement container">
      <div class="requirement-top">
        <h2>Find Your Requirement Here!</h2>
        <form routerLink="/catalogue" class="requirement-search">
          <input placeholder="Requirements">
          <input placeholder="Location">
          <button type="button">Search</button>
        </form>
      </div>
      <div class="service-strip">
        @for (service of services; track service.title) {
          <a [routerLink]="service.link" class="service-tile">
            <span [class]="service.icon"></span>
            <strong>{{ service.title }}</strong>
          </a>
        }
      </div>
    </section>

    <section class="listing-section container">
      <h2>Studios Near You!</h2>
      <div class="carousel-row">
        <button class="arrow left" aria-label="Previous">‹</button>
        @for (studio of studios; track studio.title) {
          <article class="market-card">
            <img [src]="studio.image" [alt]="studio.title">
            <div>
              <h3>{{ studio.title }}</h3>
              <p><span>4.9</span> (31) Sangam, Pune</p>
              <strong>From ₹500 Per Day</strong>
            </div>
          </article>
        }
        <button class="arrow right" aria-label="Next">›</button>
      </div>
      <a routerLink="/catalogue" class="view-more">View More</a>
    </section>

    <section class="listing-section container">
      <h2>Equipment's For Rent</h2>
      <div class="equipment-grid">
        @for (product of featured$ | async; track product.id) {
          <app-product-card [product]="product" />
        }
      </div>
      <a routerLink="/catalogue" class="view-more">View More</a>
    </section>

    <section class="listing-section container">
      <h2>Editors</h2>
      <div class="carousel-row">
        <button class="arrow left" aria-label="Previous">‹</button>
        @for (editor of editors; track editor.name) {
          <article class="market-card editor">
            <img [src]="editor.image" [alt]="editor.name">
            <div>
              <h3>{{ editor.name }}</h3>
              <p><span>4.9</span> (31) Sangam, Pune</p>
              <strong>From ₹500 Per Hour</strong>
            </div>
          </article>
        }
        <button class="arrow right" aria-label="Next">›</button>
      </div>
      <a routerLink="/contact" class="view-more">View More</a>
    </section>
  `,
  styles: [`
    .hero { padding: 1rem 0 2rem; }
    .hero-grid { align-items: center; display: grid; gap: 2rem; grid-template-columns: 1fr 1fr; min-height: 560px; }
    .hero-copy { padding-top: 2rem; }
    h1 { color: #090909; font-size: clamp(2.8rem, 5vw, 4.6rem); font-weight: 900; letter-spacing: .02em; line-height: 1; margin: 0 0 .6rem; }
    h1 span, .hero-copy h2 span { color: #ff9700; }
    .hero-copy h2 { color: #171717; font-size: clamp(2rem, 4vw, 3.4rem); font-weight: 400; margin: 0 0 1rem; }
    .hero-copy p { color: #5f5f5f; font-size: 1.15rem; line-height: 1.35; max-width: 330px; }
    .start { background: linear-gradient(90deg, #ff9700, #ffc46f); box-shadow: 0 10px 22px rgba(255,151,0,.18); color: #fff; display: inline-block; font-weight: 700; margin-top: 2rem; padding: 1rem 1.7rem; }
    .hero-art { min-height: 520px; position: relative; }
    .orange-blob { background: #ff9700; border-radius: 46% 28% 32% 42%; height: 420px; position: absolute; right: 0; top: 30px; transform: rotate(7deg); width: 420px; }
    .photographer-shape { background: #050505; bottom: 38px; clip-path: polygon(43% 4%, 51% 2%, 58% 8%, 62% 18%, 57% 31%, 61% 48%, 70% 70%, 68% 96%, 58% 96%, 53% 68%, 48% 96%, 38% 96%, 39% 65%, 31% 55%, 18% 50%, 14% 39%, 22% 34%, 36% 34%, 39% 22%); height: 450px; position: absolute; right: 95px; width: 290px; }
    .photographer-shape::before { background: #050505; clip-path: polygon(0 33%, 78% 0, 100% 26%, 68% 100%, 0 76%); content: ""; height: 72px; left: -95px; position: absolute; top: 78px; width: 150px; }
    .requirement { border: 1px solid #d8a43b; margin-bottom: 4rem; }
    .requirement-top { padding: 4.2rem 1rem 3rem; text-align: center; }
    .requirement-top h2, .listing-section h2 { color: #252525; font-size: clamp(2rem, 4vw, 2.9rem); font-weight: 400; margin-bottom: 2.2rem; text-align: center; }
    .requirement-search { display: grid; grid-template-columns: 1fr 1fr 140px; margin: 0 auto; max-width: 650px; }
    .requirement-search input { border: 1px solid #777; border-right: 0; font-size: .9rem; min-height: 42px; padding: 0 1rem; }
    .requirement-search button { background: #ff9700; border: 1px solid #ff9700; color: #fff; font-size: 1.05rem; font-weight: 700; }
    .service-strip { background: #ff9700; display: grid; gap: 3rem; grid-template-columns: repeat(5, 1fr); padding: 1.8rem 4rem; }
    .service-tile { align-items: center; background: #fff; box-shadow: 0 8px 18px rgba(0,0,0,.16); display: grid; gap: .65rem; justify-items: center; min-height: 130px; padding: 1rem; }
    .service-tile strong { color: #d99411; font-size: .9rem; font-weight: 500; }
    .service-tile span { background: #050505; display: block; height: 56px; width: 56px; }
    .team { clip-path: polygon(10% 10%, 25% 10%, 25% 72%, 38% 72%, 38% 85%, 8% 85%, 8% 72%, 18% 72%, 18% 22%, 10% 22%, 68% 22%, 68% 10%, 84% 10%, 84% 72%, 95% 72%, 95% 85%, 66% 85%, 66% 72%, 76% 72%, 76% 22%, 68% 22%); }
    .editor-icon { clip-path: polygon(40% 5%, 55% 5%, 55% 24%, 45% 24%, 45% 38%, 72% 38%, 78% 51%, 55% 51%, 55% 90%, 42% 90%, 42% 51%, 20% 51%, 26% 38%, 40% 38%); }
    .camera-icon { clip-path: polygon(8% 35%, 42% 35%, 50% 25%, 66% 25%, 73% 35%, 92% 35%, 92% 78%, 8% 78%); }
    .studio-icon { clip-path: polygon(8% 25%, 28% 25%, 28% 75%, 8% 75%, 8% 65%, 18% 65%, 18% 35%, 8% 35%, 55% 18%, 92% 18%, 92% 82%, 55% 82%); }
    .cart-icon { clip-path: polygon(6% 18%, 20% 18%, 26% 58%, 78% 58%, 90% 28%, 25% 28%, 29% 68%, 80% 68%, 80% 78%, 30% 78%, 30% 68%, 22% 28%, 6% 28%); }
    .listing-section { margin-bottom: 4rem; position: relative; }
    .carousel-row { display: grid; gap: 2rem; grid-template-columns: repeat(3, 1fr); margin: 0 auto; max-width: 980px; position: relative; }
    .market-card { background: #fff; box-shadow: 0 7px 18px rgba(0,0,0,.12); overflow: hidden; }
    .market-card img { aspect-ratio: 4/3; object-fit: cover; width: 100%; }
    .market-card div { padding: .8rem .9rem 1rem; }
    .market-card h3 { color: #171717; font-size: 1.1rem; font-weight: 700; margin: 0 0 .25rem; }
    .market-card p { color: #777; font-size: .78rem; margin: 0; }
    .market-card p span { color: #ff9700; font-weight: 700; }
    .market-card strong { color: #171717; display: block; font-size: .78rem; margin-top: .2rem; }
    .equipment-grid { display: grid; gap: 2rem; grid-template-columns: repeat(4, 1fr); margin: 0 auto; max-width: 1180px; }
    .view-more { border: 2px solid #d8a43b; color: #171717; display: block; font-weight: 500; margin: 2rem auto 0; max-width: 170px; padding: .75rem 1rem; text-align: center; }
    .view-more:hover { background: #ff9700; border-color: #ff9700; color: #fff; }
    .arrow { align-items: center; background: rgba(255,151,0,.22); border: 0; border-radius: 50%; color: #fff; display: flex; font-size: 2rem; height: 34px; justify-content: center; position: absolute; top: 42%; width: 34px; z-index: 2; }
    .left { left: -17px; }
    .right { right: -17px; }
    @media (max-width: 991px) {
      .hero-grid { grid-template-columns: 1fr; min-height: auto; }
      .hero-art { min-height: 380px; }
      .orange-blob { height: 320px; width: 320px; }
      .photographer-shape { height: 345px; right: 70px; width: 230px; }
      .service-strip { gap: 1rem; grid-template-columns: repeat(2, 1fr); padding: 1.5rem; }
      .carousel-row, .equipment-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 575px) {
      .hero-art { display: none; }
      .requirement-search, .carousel-row, .equipment-grid { grid-template-columns: 1fr; }
      .requirement-search input { border-right: 1px solid #777; }
      .service-strip { grid-template-columns: 1fr; }
    }
  `]
})
export class HomePageComponent {
  readonly featured$: Observable<Product[]> = inject(ProductService).getFeatured();
  readonly services = [
    { title: 'Get Team', icon: 'team', link: '/contact' },
    { title: 'Get Editor', icon: 'editor-icon', link: '/contact' },
    { title: 'Rent Equipment', icon: 'camera-icon', link: '/catalogue' },
    { title: 'Rent Studio', icon: 'studio-icon', link: '/catalogue' },
    { title: 'Buy Equipment', icon: 'cart-icon', link: '/catalogue' }
  ];
  readonly studios = [
    { title: 'Photo Studio', image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80' },
    { title: 'Photo Studio', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80' },
    { title: 'Photo Studio', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80' }
  ];
  readonly editors = [
    { name: 'Yuvraj', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80' },
    { name: 'Rita', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80' },
    { name: 'Shree', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80' }
  ];
}
