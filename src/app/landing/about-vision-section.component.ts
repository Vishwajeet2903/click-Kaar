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
        <h2>Top camera rental in Pune for creators.</h2>
        <p>Click-Kaar makes finding photography equipment, booking DSLR and Mirrorless cameras easy from search to final pickup.</p>
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
    h2 { color: #111; font-size: clamp(2.8rem, 5.8vw, 5.5rem); font-weight: 900; letter-spacing: 0.2; line-height: .94; margin: 0 0 1.2rem; max-width: 600px; word-spacing: .08em; }
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
      h2 { font-size: clamp(2rem, 11vw, 2.8rem); line-height: 1.02; }
      .why-grid { grid-template-columns: 1fr; }
      .why-card { border-radius: 18px; min-height: 190px; padding: 1.1rem; }
      .why-card h3 { font-size: clamp(1.25rem, 7vw, 1.65rem); line-height: 1.1; }
    }
  `]
})
export class AboutVisionSectionComponent {
  readonly benefits = [
    { number: '01', title: 'Verified cameras', text: 'Every rental DSLR, mirrorless camera, premium lens and lighting kit is tested before your shoot.' },
    { number: '02', title: 'Easy gear booking', text: 'Browse photography equipment or individual lenses and move quickly into your rental cart.' },
    { number: '03', title: 'Live technical support', text: 'Call our local experts anytime during your shoot for immediate camera troubleshooting in Pune city.' },
    { number: '04', title: 'Local support', text: 'Get expert help selecting cameras, coordinating Pune pickups and shoot planning.' }
  ];
}
