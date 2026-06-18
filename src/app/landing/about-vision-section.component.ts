import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-about-vision-section',
  standalone: true,
  imports: [ScrollRevealDirective],
  template: `
    <section class="landing-card why-us-section" id="why-us">
      <div class="why-heading" appScrollReveal="slide-right">
        <p class="eyebrow">Why Us</p>
        <h2>Rental marketplace built for real shoot days.</h2>
        <p>ClickKar keeps equipment discovery, pricing, availability, and booking support clear from the first search to final pickup.</p>
      </div>

      <div class="why-grid">
        @for (item of benefits; track item.title; let index = $index) {
          <article class="why-card" appScrollReveal="fade-up" [revealStagger]="index * 100">
            <span>{{ item.number }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    .why-us-section { display: grid; gap: clamp(1.5rem, 4vw, 3rem); grid-template-columns: .9fr 1.35fr; padding: clamp(2rem, 6vw, 4.8rem); }
    .why-heading { align-self: center; }
    h2 { color: #111; font-size: clamp(2.8rem, 5.8vw, 5.5rem); font-weight: 900; letter-spacing: 0; line-height: .94; margin: 0 0 1.2rem; max-width: 600px; word-spacing: .08em; }
    .why-heading p:not(.eyebrow) { color: #444; font-size: 1.05rem; line-height: 1.65; margin: 0; max-width: 420px; }
    .why-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .why-card { background: #f6f6f4; border: 1px solid rgba(17,17,17,.06); border-radius: 24px; min-height: 250px; padding: 1.4rem; transition: box-shadow .28s ease, transform .28s ease; }
    .why-card:hover { box-shadow: 0 22px 45px rgba(0,0,0,.12); transform: translateY(-8px); }
    .why-card span { color: #ff9700; font-size: .78rem; font-weight: 900; letter-spacing: .22em; }
    .why-card h3 { color: #111; font-size: 1.45rem; font-weight: 900; letter-spacing: 0; line-height: 1.05; margin: 1.2rem 0 .8rem; word-spacing: .08em; }
    .why-card p { color: #5e5e5a; line-height: 1.55; margin: 0; }
    @media (max-width: 900px) {
      .why-us-section { grid-template-columns: 1fr; }
    }
    @media (max-width: 560px) {
      .why-us-section { padding: 1.25rem; }
      .why-grid { grid-template-columns: 1fr; }
      .why-card { min-height: 210px; }
    }
  `]
})
export class AboutVisionSectionComponent {
  readonly benefits = [
    { number: '01', title: 'Verified equipment', text: 'Every listed camera, lens, light, tripod, and audio kit is checked before it reaches your shoot.' },
    { number: '02', title: 'Clear rental pricing', text: 'Daily prices, stock counts, and package details are visible before you open the product page.' },
    { number: '03', title: 'Fast kit building', text: 'Browse packages or individual gear and move quickly from shortlist to rental cart.' },
    { number: '04', title: 'Shoot-day support', text: 'Get practical help for gear selection, pickup coordination, and production-ready planning.' }
  ];
}
