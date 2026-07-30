import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-pricing-section',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  template: `
    <section class="landing-card pricing-section" id="pricing">
      <div class="section-heading" appScrollReveal="fade-up">
        <p class="eyebrow">Membership</p>
        <h2>Plans for solo creators and production teams.</h2>
      </div>
      <div class="pricing-grid">
        @for (plan of plans; track plan.name; let index = $index) {
          <article class="price-card" [class.featured]="plan.featured" appScrollReveal="fade-up" [revealStagger]="index * 120">
            <p>{{ plan.name }}</p>
            <h3>{{ plan.price }}</h3>
            <span>{{ plan.note }}</span>
            <ul>
              @for (feature of plan.features; track feature) {
                <li>{{ feature }}</li>
              }
            </ul>
            <a routerLink="/contact" class="btn-pill" [class.dark]="plan.featured" [class.light]="!plan.featured">Choose plan</a>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    .pricing-section { padding: clamp(2rem, 6vw, 4.8rem); }
    .section-heading { margin-bottom: 2rem; max-width: 920px; }
    h2 { color: #111; font-size: clamp(2.15rem, 4vw, 3.75rem); font-weight: 900; letter-spacing: 0; line-height: 1.08; margin: 0; max-width: 900px; }
    .pricing-grid { display: grid; gap: 1rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .price-card { background: #f6f6f4; border-radius: 24px; min-height: 430px; padding: 1.5rem; }
    .price-card.featured { background: #111; color: #fff; transform: translateY(-12px); }
    .price-card p { font-size: .8rem; font-weight: 900; letter-spacing: .2em; margin: 0 0 1.2rem; text-transform: uppercase; }
    .price-card h3 { font-size: 3rem; font-weight: 900; letter-spacing: -.05em; line-height: 1; margin: 0; }
    .price-card span { color: #777; display: block; margin: .65rem 0 1.4rem; }
    .price-card.featured span { color: rgba(255,255,255,.65); }
    ul { display: grid; gap: .65rem; list-style: none; margin: 0 0 1.6rem; padding: 0; }
    li { color: #444; line-height: 1.4; }
    .featured li { color: rgba(255,255,255,.78); }
    @media (max-width: 900px) {
      .pricing-grid { grid-template-columns: 1fr; }
      .price-card.featured { transform: none; }
    }
    @media (max-width: 560px) {
      .pricing-section { padding: 1.25rem; }
    }
  `]
})
export class PricingSectionComponent {
  readonly plans = [
    { name: 'Starter', price: 'Rs. 899', note: 'per rental day', featured: false, features: ['Basic camera kits', 'Standard support', 'Self pickup options'] },
    { name: 'Creator', price: 'Rs. 2,499', note: 'per shoot day', featured: true, features: ['Premium gear bundles', 'Creator shortlist', 'Priority booking'] },
    { name: 'Studio', price: 'Custom', note: 'for teams', featured: false, features: ['Crew and gear planning', 'Studio sourcing', 'Managed production help'] }
  ];
}
