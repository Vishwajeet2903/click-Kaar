import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-landing-footer-section',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  template: `
    <section class="landing-card landing-footer" id="contact" appScrollReveal="fade-up">
      <div class="footer-copy">
        <p class="eyebrow">Click-Kaar</p>
        <h2>Ready to plan your next visual story?</h2>
        <p>Browse trusted camera, lighting and audio gear for your next shoot in Pune, or talk to us for help building the right rental kit.</p>
        <div class="footer-actions">
          <a routerLink="/catalogue" class="btn-pill dark">Start browsing</a>
          <a routerLink="/contact" class="btn-pill light">Talk to us</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .landing-footer { display: block; min-height: 0; overflow: hidden; padding: clamp(2rem, 6vw, 4.8rem); text-align: left; }
    .footer-copy { max-width: 980px; position: relative; z-index: 1; }
    .eyebrow { word-spacing: 0; }
    h2 { color: #111; font-size: clamp(2.2rem, 4vw, 3.75rem); font-weight: 900; letter-spacing: 0; line-height: 1.08; margin: .8rem 0 1rem; max-width: 900px; word-spacing: 0; }
    .footer-copy p:not(.eyebrow) { color: #242424; font-size: 1.08rem; line-height: 1.7; margin: 0 0 1.7rem; max-width: 760px; }
    .footer-actions { display: flex; gap: .8rem; justify-content: flex-start; }    @media (min-width: 1600px) and (min-height: 900px) {
      .landing-footer { min-height: 680px; padding: clamp(8rem, 9.5vw, 10.5rem); }
      .footer-copy { max-width: 1480px; }
      h2 { font-size: clamp(5.6rem, 6vw, 7.2rem); max-width: 1380px; }
      .footer-copy p:not(.eyebrow) { font-size: 1.55rem; line-height: 1.8; margin-bottom: 3rem; max-width: 1120px; }
      .footer-actions { gap: 1.35rem; }
    }
    @media (max-width: 560px) {
      .landing-footer { padding: 1.25rem; }
      h2 { font-size: clamp(1.9rem, 9vw, 2.55rem); line-height: 1.12; }
      .footer-copy p:not(.eyebrow) { font-size: 1rem; line-height: 1.62; }
      .footer-actions { flex-direction: column; width: 100%; }
      .footer-actions .btn-pill { width: 100%; }
    }
  `]
})
export class LandingFooterSectionComponent {}
