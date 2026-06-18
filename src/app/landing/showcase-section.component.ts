import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-showcase-section',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  template: `
    <section class="landing-card showcase-section" id="showcase">
      <div class="showcase-copy">
        <p class="eyebrow" appScrollReveal="slide-right">Showcase</p>
        <h2 appScrollReveal="slide-right" [revealDelay]="80">Create, rent, and present work with a gallery-first flow.</h2>
        <p appScrollReveal="slide-right" [revealDelay]="160">ClickKar helps creators turn equipment planning into a refined, visual production experience.</p>
        <a routerLink="/catalogue" class="btn-pill dark" appScrollReveal="fade-up" [revealDelay]="220">Browse catalogue</a>
      </div>

      <div class="package-showcase">
        @for (item of showcase; track item.title; let index = $index) {
          <a routerLink="/catalogue" [queryParams]="{ package: item.package }" class="package-card" appScrollReveal="slide-left" [revealStagger]="index * 120">
            <img [src]="item.image" [alt]="item.title">
            <div class="listing-meta">
              <b>{{ item.price }}</b>
              <small>{{ item.status }}</small>
            </div>
            <span>{{ item.kicker }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </a>
        }
      </div>
    </section>
  `,
  styles: [`
    .showcase-section { display: grid; gap: clamp(2rem, 6vw, 5rem); grid-template-columns: .8fr 1.2fr; min-height: 650px; padding: clamp(2rem, 6vw, 4.8rem); }
    .showcase-copy { align-self: center; max-width: 430px; }
    h2 { color: #111; font-size: clamp(2.7rem, 5.8vw, 5.2rem); font-weight: 900; letter-spacing: 0; line-height: .96; margin: 0 0 1.5rem; word-spacing: .08em; }
    p:not(.eyebrow) { color: #3a3a37; line-height: 1.6; margin: 0 0 1.7rem; }
    .package-showcase { align-items: center; display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .package-card { background: #f6f6f4; border-radius: 24px; box-shadow: 0 24px 50px rgba(0,0,0,.1); margin: 0; overflow: hidden; padding: .75rem; transition: box-shadow .28s ease, transform .28s ease; }
    .package-card:nth-child(1) { transform: rotate(-2.5deg); }
    .package-card:nth-child(2) { transform: translateY(2.2rem) rotate(2.5deg); }
    .package-card:hover { box-shadow: 0 28px 58px rgba(0,0,0,.16); transform: translateY(-8px) rotate(0); }
    .package-card img { aspect-ratio: 1.1; border-radius: 19px; object-fit: cover; width: 100%; }
    .listing-meta { align-items: center; background: #fff; border-radius: 999px; display: flex; justify-content: space-between; gap: .7rem; margin: .7rem .2rem .1rem; padding: .55rem .7rem; }
    .listing-meta b { color: #111; font-size: .8rem; font-weight: 950; word-spacing: .08em; }
    .listing-meta small { color: #ff9700; font-size: .72rem; font-weight: 900; }
    .package-card span { color: #ff9700; display: block; font-size: .72rem; font-weight: 900; letter-spacing: .16em; margin: .9rem .3rem .35rem; text-transform: uppercase; }
    .package-card h3 { color: #111; font-size: clamp(1.6rem, 2.4vw, 2.35rem); font-weight: 900; letter-spacing: 0; line-height: 1; margin: 0 .3rem .65rem; word-spacing: .08em; }
    .package-card p { color: #555; font-size: .92rem; line-height: 1.5; margin: 0 .3rem .5rem; }
    @media (max-width: 900px) {
      .showcase-section { grid-template-columns: 1fr; }
      .package-card:nth-child(2) { transform: translateY(0) rotate(2deg); }
    }
    @media (max-width: 560px) {
      .showcase-section { padding: 1.25rem; }
      .package-showcase { grid-template-columns: 1fr; }
      .package-card, .package-card:nth-child(1), .package-card:nth-child(2) { transform: none; }
    }
  `]
})
export class ShowcaseSectionComponent {
  readonly showcase = [
    {
      package: 'wedding',
      kicker: 'Wedding Package',
      title: 'Wedding Photography Kit',
      price: 'From ₹4,999/day',
      status: 'Event ready',
      text: 'Camera bodies, portrait lenses, lights, flashes, gimbals, tripods, and audio kits for complete wedding coverage.',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80'
    },
    {
      package: 'wildlife',
      kicker: 'Wildlife Package',
      title: 'Wildlife Photography Kit',
      price: 'From ₹3,499/day',
      status: 'Field ready',
      text: 'Telephoto lenses, fast camera bodies, monopods, rugged bags, memory kits, and outdoor shooting support.',
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'
    }
  ];
}
