import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-landing-footer-section',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  template: `
    <section class="landing-card landing-footer" id="contact" appScrollReveal="fade-up">
      <p class="eyebrow">ClickKar</p>
      <h2>Ready to plan your next visual story?</h2>
      <div class="footer-actions">
        <a routerLink="/catalogue" class="btn-pill dark">Start browsing</a>
        <a routerLink="/contact" class="btn-pill light">Talk to us</a>
      </div>
    </section>
  `,
  styles: [`
    .landing-footer { align-items: center; display: flex; flex-direction: column; min-height: 430px; justify-content: center; padding: clamp(2rem, 6vw, 4.8rem); text-align: center; }
    h2 { color: #111; font-size: clamp(3rem, 7vw, 6.5rem); font-weight: 900; letter-spacing: -.06em; line-height: .9; margin: .8rem auto 1.6rem; max-width: 900px; }
    .footer-actions { display: flex; gap: .8rem; justify-content: center; }
    @media (max-width: 560px) {
      .landing-footer { min-height: 360px; padding: 1.25rem; }
      .footer-actions { flex-direction: column; width: 100%; }
    }
  `]
})
export class LandingFooterSectionComponent {}
