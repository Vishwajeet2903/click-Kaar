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
        <p class="eyebrow" appScrollReveal="slide-right">SHOOT-READY GEAR KITS</p>
        <h2 appScrollReveal="slide-right" [revealDelay]="80">Rent complete, event ready camera packages in Pune.</h2>
        <p appScrollReveal="slide-right" [revealDelay]="160">Why piece together your gear? Click-Kaar offers the premier camera rental in Pune with carefully curated event packages. Rent the perfect combination of Mirrorless camera bodies, lenses and lighting with zero friction.</p>
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
    .showcase-section { display: grid; gap: clamp(2rem, 5vw, 3.75rem); grid-template-columns: 1fr; min-height: 650px; padding: clamp(2rem, 6vw, 4.8rem); }
    .showcase-copy { max-width: 920px; }
    h2 { color: #111; font-size: clamp(2.2rem, 4vw, 3.75rem); font-weight: 900; letter-spacing: 0; line-height: 1.08; margin: 0 0 1.35rem; max-width: 880px; word-spacing: 0; }
    p:not(.eyebrow) { color: #242424; font-size: 1.04rem; line-height: 1.72; margin: 0 0 1.7rem; }
    .package-showcase { align-items: start; display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .package-card { background: #f6f6f4; border-radius: 20px; box-shadow: 0 18px 38px rgba(0,0,0,.1); margin: 0; overflow: hidden; padding: .6rem; transition: box-shadow .28s ease, transform .28s ease; }
    .package-card:nth-child(1) { transform: rotate(-2.5deg); }
    .package-card:nth-child(2) { transform: translateY(2.2rem) rotate(2.5deg); }
    .package-card:nth-child(3) { transform: rotate(-1.5deg); }
    .package-card:nth-child(4) { transform: translateY(2.2rem) rotate(1.5deg); }
    .package-card:hover { box-shadow: 0 28px 58px rgba(0,0,0,.16); transform: translateY(-8px) rotate(0); }
    .package-card img { aspect-ratio: 1.22; border-radius: 15px; object-fit: cover; width: 100%; }
    .listing-meta { align-items: center; background: #fff; border-radius: 999px; display: flex; justify-content: space-between; gap: .6rem; margin: .55rem .15rem .1rem; padding: .45rem .6rem; }
    .listing-meta b { color: #111; font-size: .76rem; font-weight: 950; word-spacing: 0; }
    .listing-meta small { color: #ff9700; font-size: .66rem; font-weight: 900; }
    .package-card span { color: #ff9700; display: block; font-size: .64rem; font-weight: 900; letter-spacing: .14em; margin: .7rem .25rem .3rem; text-transform: uppercase; }
    .package-card h3 { color: #111; font-size: clamp(1.28rem, 1.8vw, 1.75rem); font-weight: 900; letter-spacing: 0; line-height: 1.05; margin: 0 .25rem .5rem; word-spacing: .04em; }
    .package-card p { color: #555; font-size: .82rem; line-height: 1.45; margin: 0 .25rem .35rem; }
    @media (max-width: 900px) {
      .package-showcase { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 760px; }
      .package-card:nth-child(2),
      .package-card:nth-child(4) { transform: translateY(0) rotate(2deg); }
    }
    @media (max-width: 560px) {
      .showcase-section { padding: 1.25rem; }
      h2 { font-size: clamp(1.9rem, 9vw, 2.55rem); line-height: 1.12; }
      .showcase-copy { max-width: none; }
      .package-showcase { grid-template-columns: 1fr; }
      .package-card, .package-card:nth-child(1), .package-card:nth-child(2), .package-card:nth-child(3), .package-card:nth-child(4) { border-radius: 18px; transform: none; }
      .listing-meta { align-items: flex-start; border-radius: 14px; flex-direction: column; gap: .2rem; }
      .package-card h3 { font-size: clamp(1.35rem, 8vw, 1.85rem); line-height: 1.08; }
    }
  `]
})
export class ShowcaseSectionComponent {
  readonly showcase = [
    {
      package: 'wedding',
      kicker: 'Wedding Package',
      title: 'Wedding Photography Kit',
      price: 'From Rs. 4,999/day',
      status: 'Event ready',
      text: 'Camera bodies, portrait lenses, lights, flashes, gimbals, tripods, and audio kits for complete wedding coverage.',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80'
    },
    {
      package: 'wildlife',
      kicker: 'Wildlife Package',
      title: 'Wildlife Photography Kit',
      price: 'From Rs. 3,499/day',
      status: 'Field ready',
      text: 'Telephoto lenses, fast camera bodies, monopods, rugged bags, memory kits, and outdoor shooting support.',
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'
    },
    {
      package: 'podcast',
      kicker: 'Podcast Package',
      title: 'Podcast Studio Kit',
      price: 'From Rs. 2,499/day',
      status: 'Studio ready',
      text: 'Microphones, audio interface, headphones, compact lights, stands, and clean recording essentials for podcast shoots.',
      image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=80'
    },
    {
      package: 'youtube',
      kicker: 'YouTube Package',
      title: 'YouTube Creator Kit',
      price: 'From Rs. 2,999/day',
      status: 'Creator ready',
      text: 'Camera body, sharp lens, LED lights, wireless mic, tripod, and creator-friendly accessories for polished video content.',
      image: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=900&q=80'
    }
  ];
}
