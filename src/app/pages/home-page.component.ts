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
      <img src="/home-hero-banner.png" alt="Photography studio equipment available for rent" class="hero-banner">
      <h1 class="hero-title">One Spot Stop !</h1>
    </section>

    <section class="package-section container">
      <a routerLink="/catalogue" class="package-tile wedding-package">
        <span>Wedding Package</span>
        <h2>Wedding Photography Equipments</h2>
        <p>Camera bodies, portrait lenses, lights, tripods, gimbals, flashes, and audio gear for full event coverage.</p>
        <strong>Explore Package</strong>
      </a>
      <a routerLink="/catalogue" class="package-tile wildlife-package">
        <span>Wildlife Package</span>
        <h2>Wildlife Photography Equipments</h2>
        <p>Telephoto lenses, fast cameras, monopods, rugged bags, memory kits, and field-ready supports for outdoor shoots.</p>
        <strong>Explore Package</strong>
      </a>
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

    <section class="why-section container">
      <div class="why-intro">
        <p class="why-kicker">Why Choose us</p>
        <h2>We listen, we understand, and we deliver what you need.</h2>
        <p>No complications just good work, done with care</p>
      </div>
      <div class="why-grid">
        <article class="why-card">
          <span class="why-icon handpicked" aria-hidden="true"></span>
          <h3>Handpicked Creators</h3>
          <p>Lorem ipsum dolor sit amet consectetur. Ut tellus any that suspendisse nulla aliquam.</p>
        </article>
        <article class="why-card">
          <span class="why-icon turnaround" aria-hidden="true"></span>
          <h3>Fast Turnarround</h3>
          <p>Lorem ipsum dolor sit amet consectetur. Ut tellus any that suspendisse nulla aliquam.</p>
        </article>
        <article class="why-card">
          <span class="why-icon control" aria-hidden="true"></span>
          <h3>Creative Control</h3>
          <p>Lorem ipsum dolor sit amet consectetur. Ut tellus any that suspendisse nulla aliquam.</p>
        </article>
        <article class="why-card">
          <span class="why-icon more" aria-hidden="true"></span>
          <h3>Many More</h3>
          <p>Lorem ipsum dolor sit amet consectetur. Ut tellus any that suspendisse nulla aliquam.</p>
        </article>
      </div>
    </section>

    <section class="join-section container">
      <h2>Join Us</h2>
      <div class="join-grid">
        <article class="join-tile">
          <img src="/photographer.png" alt="Join as photographer">
          <div>
            <h3>Join as Photographer</h3>
            <p>Bring your camera skills to clients looking for reliable creators.</p>
            <a routerLink="/contact">Join Now</a>
          </div>
        </article>
        <article class="join-tile">
          <img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80" alt="Editor working at a creative desk">
          <div>
            <h3>Join as Editor</h3>
            <p>Offer editing, retouching, and post-production support for real projects.</p>
            <a routerLink="/contact">Join Now</a>
          </div>
        </article>
        <article class="join-tile">
          <img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80" alt="Photography studio interior">
          <div>
            <h3>Join as Studio</h3>
            <p>List your studio space and make it easier for creators to book shoots.</p>
            <a routerLink="/contact">Join Now</a>
          </div>
        </article>
      </div>
    </section>

    <section class="feedback-section container">
      <div class="feedback-heading">
        <p>Customer Feedback</p>
        <h2>What our customers say</h2>
      </div>
      <div class="feedback-grid">
        <article class="feedback-card">
          <div class="feedback-rating" aria-label="5 star rating">★★★★★</div>
          <p>"ClickKar made it easy to rent the right camera and lights for our wedding shoot. Everything arrived clean, packed, and ready."</p>
          <div class="feedback-author">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80" alt="Customer portrait of Aditi Sharma">
            <div>
              <h3>Aditi Sharma</h3>
              <span>Wedding Photographer</span>
            </div>
          </div>
        </article>
        <article class="feedback-card featured">
          <div class="feedback-rating" aria-label="5 star rating">★★★★★</div>
          <p>"The equipment package saved us hours of planning. Good quality gear, quick support, and no last-minute confusion."</p>
          <div class="feedback-author">
            <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80" alt="Customer portrait of Rohan Mehta">
            <div>
              <h3>Rohan Mehta</h3>
              <span>Studio Owner</span>
            </div>
          </div>
        </article>
        <article class="feedback-card">
          <div class="feedback-rating" aria-label="5 star rating">★★★★★</div>
          <p>"I booked lenses for a wildlife trip and the whole process was smooth. The team understood exactly what I needed."</p>
          <div class="feedback-author">
            <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80" alt="Customer portrait of Neha Patil">
            <div>
              <h3>Neha Patil</h3>
              <span>Wildlife Creator</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    
  `,
  styles: [`
    .hero { background: #fff; overflow: hidden; padding: 1rem 0; position: relative; text-align: center; }
    .hero-banner { display: block; height: 680px; margin: 0 auto; max-width: 1180px; object-fit: contain; object-position: center; transition: filter .35s ease, opacity .35s ease; width: 100%; }
    .hero-title { -webkit-text-fill-color: transparent; -webkit-text-stroke: 3px rgba(255,151,0,.42); color: transparent; font-size: clamp(4rem, 9vw, 8rem); font-weight: 900; left: 50%; line-height: 1; margin: 0; opacity: .55; position: absolute; text-shadow: 0 4px 18px rgba(0,0,0,.12); text-transform: uppercase; top: 50%; transform: translate(-50%, -50%); transition: color .35s ease, opacity .35s ease, text-shadow .35s ease, transform .35s ease, -webkit-text-fill-color .35s ease, -webkit-text-stroke-color .35s ease; white-space: nowrap; }
    .hero:has(.hero-title:hover) .hero-banner { filter: blur(5px); opacity: .5; }
    .hero-title:hover { -webkit-text-fill-color: #ff9700; -webkit-text-stroke-color: #ff9700; color: #ff9700; opacity: 1; text-shadow: 0 6px 22px rgba(0,0,0,.3); transform: translate(-50%, -50%) scale(1.06); }
    .package-section { display: grid; gap: 2rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 4rem; margin-top: 1rem; }
    .package-tile { border-radius: 2.5%; color: #fff; display: flex; flex-direction: column; justify-content: flex-end; min-height: 360px; overflow: hidden; padding: 2rem; position: relative; transition: transform .25s ease, box-shadow .25s ease; }
    .package-tile::before { background: linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.78)); content: ""; inset: 0; position: absolute; z-index: 0; }
    .package-tile::after { background-position: center; background-size: cover; content: ""; inset: 0; position: absolute; transform: scale(1.02); transition: transform .35s ease; z-index: -1; }
    .package-tile:hover { box-shadow: 0 16px 34px rgba(0,0,0,.18); transform: translateY(-4px); }
    .package-tile:hover::after { transform: scale(1.08); }
    .wedding-package::after { background-image: url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1100&q=80'); }
    .wildlife-package::after { background-image: url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=80'); }
    .package-tile span, .package-tile h2, .package-tile p, .package-tile strong { position: relative; z-index: 1; }
    .package-tile span { color: #ff9700; font-size: .82rem; font-weight: 800; letter-spacing: .08em; margin-bottom: .7rem; text-transform: uppercase; }
    .package-tile h2 { color: #fff; font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 800; line-height: 1.08; margin: 0 0 .75rem; }
    .package-tile p { color: rgba(255,255,255,.86); font-size: .98rem; line-height: 1.5; margin: 0 0 1.2rem; max-width: 520px; }
    .package-tile strong { border: 2px solid rgba(255,255,255,.72); border-radius: 5%; color: #fff; display: inline-block; font-size: .92rem; padding: .65rem 1rem; width: max-content; }
    .requirement { border: 1px solid #d8a43b; margin-bottom: 4rem; }
    .requirement-top { padding: 4.2rem 1rem 3rem; text-align: center; }
    .requirement-top h2, .listing-section h2, .why-kicker, .join-section h2, .feedback-heading h2 { font-size: clamp(2.4rem, 4.5vw, 3.4rem); }
    .requirement-top h2, .listing-section h2 { color: #ff9700; font-weight: 800; margin-bottom: 2.2rem; text-align: center; }
    .requirement-search { display: grid; grid-template-columns: 1fr 1fr 140px; margin: 0 auto; max-width: 650px; }
    .requirement-search input { border: 1px solid #777; border-right: 0; font-size: .9rem; min-height: 42px; padding: 0 1rem; }
    .requirement-search button { background: #ff9700; border: 1px solid #ff9700; border-radius: 5%; color: #fff; font-size: 1.05rem; font-weight: 700; }
    .service-strip { background: #ff9700; display: grid; gap: 3rem; grid-template-columns: repeat(5, 1fr); padding: 1.8rem 4rem; }
    .service-tile { align-items: center; background: #fff; border-radius: 2.5%; box-shadow: 0 8px 18px rgba(0,0,0,.16); display: grid; gap: .65rem; justify-items: center; min-height: 130px; padding: 1rem; }
    .service-tile strong { color: #d99411; font-size: .9rem; font-weight: 500; }
    .service-tile span { background: #050505; display: block; height: 56px; width: 56px; }
    .team { clip-path: polygon(10% 10%, 25% 10%, 25% 72%, 38% 72%, 38% 85%, 8% 85%, 8% 72%, 18% 72%, 18% 22%, 10% 22%, 68% 22%, 68% 10%, 84% 10%, 84% 72%, 95% 72%, 95% 85%, 66% 85%, 66% 72%, 76% 72%, 76% 22%, 68% 22%); }
    .editor-icon { clip-path: polygon(40% 5%, 55% 5%, 55% 24%, 45% 24%, 45% 38%, 72% 38%, 78% 51%, 55% 51%, 55% 90%, 42% 90%, 42% 51%, 20% 51%, 26% 38%, 40% 38%); }
    .camera-icon { clip-path: polygon(8% 35%, 42% 35%, 50% 25%, 66% 25%, 73% 35%, 92% 35%, 92% 78%, 8% 78%); }
    .studio-icon { clip-path: polygon(8% 25%, 28% 25%, 28% 75%, 8% 75%, 8% 65%, 18% 65%, 18% 35%, 8% 35%, 55% 18%, 92% 18%, 92% 82%, 55% 82%); }
    .cart-icon { clip-path: polygon(6% 18%, 20% 18%, 26% 58%, 78% 58%, 90% 28%, 25% 28%, 29% 68%, 80% 68%, 80% 78%, 30% 78%, 30% 68%, 22% 28%, 6% 28%); }
    .listing-section { margin-bottom: 4rem; position: relative; }
    .carousel-row { display: grid; gap: 2rem; grid-template-columns: repeat(3, 1fr); margin: 0 auto; max-width: 980px; position: relative; }
    .market-card { background: #fff; border-radius: 2.5%; box-shadow: 0 7px 18px rgba(0,0,0,.12); overflow: hidden; }
    .market-card img { aspect-ratio: 4/3; object-fit: cover; width: 100%; }
    .market-card div { padding: .8rem .9rem 1rem; }
    .market-card h3 { color: #171717; font-size: 1.1rem; font-weight: 700; margin: 0 0 .25rem; }
    .market-card p { color: #777; font-size: .78rem; margin: 0; }
    .market-card p span { color: #ff9700; font-weight: 700; }
    .market-card strong { color: #171717; display: block; font-size: .78rem; margin-top: .2rem; }
    .equipment-grid { display: grid; gap: 2rem; grid-template-columns: repeat(4, 1fr); margin: 0 auto; max-width: 1180px; }
    .view-more { border: 2px solid #d8a43b; border-radius: 5%; color: #171717; display: block; font-weight: 500; margin: 2rem auto 0; max-width: 170px; padding: .75rem 1rem; text-align: center; }
    .view-more:hover { background: #ff9700; border-color: #ff9700; color: #fff; }
    .why-section { margin-bottom: 4.5rem; }
    .why-intro { margin: 0 auto 2.2rem; max-width: 720px; text-align: center; }
    .why-kicker { color: #ff9700; font-weight: 900; letter-spacing: .04em; margin-bottom: .85rem; text-transform: uppercase; }
    .why-intro h2 { color: #252525; font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; line-height: 1.12; margin: 0 0 .85rem; }
    .why-intro p:not(.why-kicker) { color: #666; font-size: 1.05rem; line-height: 1.55; margin: 0 auto; max-width: 560px; }
    .why-grid { display: grid; gap: 1.4rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .why-card { background: #fff; border: 1px solid rgba(216,164,59,.28); border-radius: 2.5%; box-shadow: 0 8px 22px rgba(0,0,0,.07); padding: 1.35rem; transition: border-color .2s ease, transform .2s ease; }
    .why-card:hover { border-color: rgba(255,151,0,.7); transform: translateY(-3px); }
    .why-icon { align-items: center; background: rgba(255,151,0,.14); border: 1px solid rgba(255,151,0,.35); border-radius: 18px; display: inline-flex; height: 58px; justify-content: center; margin-bottom: 1rem; width: 58px; }
    .why-icon::before { background: #ff9700; content: ""; display: block; height: 28px; width: 28px; }
    .handpicked::before { clip-path: polygon(50% 3%, 62% 34%, 96% 35%, 69% 56%, 79% 90%, 50% 70%, 21% 90%, 31% 56%, 4% 35%, 38% 34%); }
    .turnaround::before { clip-path: polygon(51% 0, 88% 0, 68% 29%, 100% 29%, 43% 100%, 54% 50%, 20% 50%); }
    .control::before { clip-path: polygon(9% 24%, 91% 24%, 91% 38%, 9% 38%, 9% 62%, 91% 62%, 91% 76%, 9% 76%); }
    .more::before { clip-path: circle(16% at 18% 50%); box-shadow: 11px 0 0 #ff9700, 22px 0 0 #ff9700; height: 16px; width: 16px; }
    .why-card h3 { color: #171717; font-size: 1.12rem; font-weight: 900; margin: 0 0 .55rem; }
    .why-card p { color: #777; font-size: .92rem; line-height: 1.5; margin: 0; }
    .join-section { margin-bottom: 4.5rem; }
    .join-section h2 { color: #ff9700; font-weight: 900; margin: 0 0 2rem; text-align: center; }
    .join-grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .join-tile { border-radius: 2.5%; box-shadow: 0 10px 28px rgba(0,0,0,.12); min-height: 430px; overflow: hidden; position: relative; transition: transform .25s ease, box-shadow .25s ease; }
    .join-tile::after { background: linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.28) 58%, rgba(0,0,0,.08)); content: ""; inset: 0; position: absolute; z-index: 1; }
    .join-tile:hover { box-shadow: 0 18px 38px rgba(0,0,0,.2); transform: translateY(-4px); }
    .join-tile img { height: 100%; inset: 0; object-fit: cover; position: absolute; transition: transform .4s ease; width: 100%; }
    .join-tile:hover img { transform: scale(1.06); }
    .join-tile div { bottom: 1.5rem; left: 1.5rem; max-width: calc(100% - 3rem); position: absolute; right: 1.5rem; z-index: 2; }
    .join-tile h3 { color: #fff; font-size: clamp(1.85rem, 3vw, 2.8rem); font-style: italic; font-weight: 950; letter-spacing: .02em; line-height: .95; margin: 0 0 .8rem; text-shadow: 0 4px 18px rgba(0,0,0,.35); text-transform: uppercase; }
    .join-tile p { color: rgba(255,255,255,.88); font-size: .95rem; line-height: 1.45; margin: 0 0 1.1rem; max-width: 320px; }
    .join-tile a { background: #ff9700; border-radius: 5%; color: #fff; display: inline-block; font-weight: 900; padding: .75rem 1.1rem; text-align: center; width: max-content; }
    .feedback-section { margin-bottom: 4.5rem; }
    .feedback-heading { margin: 0 auto 2rem; max-width: 720px; text-align: center; }
    .feedback-heading p { color: #ff9700; font-size: .9rem; font-weight: 900; letter-spacing: .08em; margin: 0 0 .5rem; text-transform: uppercase; }
    .feedback-heading h2 { color: #252525; font-weight: 900; margin: 0; }
    .feedback-grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .feedback-card { background: #fff; border: 1px solid rgba(216,164,59,.28); border-radius: 2.5%; box-shadow: 0 8px 22px rgba(0,0,0,.07); padding: 1.5rem; transition: border-color .2s ease, transform .2s ease; }
    .feedback-card:hover { border-color: rgba(255,151,0,.7); transform: translateY(-3px); }
    .feedback-card.featured { background: #171717; border-color: #171717; color: #fff; }
    .feedback-rating { color: #ff9700; font-size: 1rem; letter-spacing: .12em; margin-bottom: 1rem; }
    .feedback-card > p { color: #666; font-size: 1rem; line-height: 1.65; margin: 0 0 1.5rem; }
    .feedback-card.featured > p { color: rgba(255,255,255,.82); }
    .feedback-author { align-items: center; display: flex; gap: .9rem; }
    .feedback-author img { border-radius: 50%; height: 54px; object-fit: cover; width: 54px; }
    .feedback-author h3 { color: #171717; font-size: 1rem; font-weight: 900; margin: 0; }
    .feedback-card.featured h3 { color: #fff; }
    .feedback-author span { color: #777; font-size: .82rem; font-weight: 700; }
    .feedback-card.featured span { color: rgba(255,255,255,.62); }
    .arrow { align-items: center; background: rgba(255,151,0,.22); border: 0; border-radius: 50%; color: #fff; display: flex; font-size: 2rem; height: 34px; justify-content: center; position: absolute; top: 42%; width: 34px; z-index: 2; }
    .left { left: -17px; }
    .right { right: -17px; }
    @media (max-width: 991px) {
      .hero-banner { height: 220px; max-width: 92%; }
      .hero-title { -webkit-text-stroke-width: 2px; font-size: clamp(2.8rem, 9vw, 5rem); }
      .service-strip { gap: 1rem; grid-template-columns: repeat(2, 1fr); padding: 1.5rem; }
      .carousel-row, .equipment-grid, .package-section, .why-grid, .join-grid, .feedback-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 575px) {
      .hero { padding: .75rem 0; }
      .hero-banner { height: 450px; max-width: 94%; }
      .hero-title { -webkit-text-stroke-width: 1.4px; font-size: 2.3rem; max-width: 92%; white-space: normal; }
      .package-section { gap: 1rem; margin-bottom: 3rem; }
      .package-tile { min-height: 312px; padding: 1.35rem; }
      .why-intro { text-align: left; }
      .why-grid { gap: 1rem; }
      .join-grid { gap: 1rem; }
      .join-tile { min-height: 360px; }
      .feedback-heading { text-align: left; }
      .feedback-grid { gap: 1rem; }
      .requirement-search, .carousel-row, .equipment-grid, .package-section, .why-grid, .join-grid, .feedback-grid { grid-template-columns: 1fr; }
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
