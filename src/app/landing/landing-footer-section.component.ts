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
        <div class="footer-actions">
          <a routerLink="/catalogue" class="btn-pill dark">Start browsing</a>
          <a routerLink="/contact" class="btn-pill light">Talk to us</a>
        </div>
      </div>
      <div class="footer-visual" aria-hidden="true">
        <img src="/landing-footer-visual.png" alt="" loading="lazy">
      </div>
    </section>
  `,
  styles: [`
    .landing-footer { align-items: center; display: grid; gap: clamp(1.5rem, 4vw, 4rem); grid-template-columns: minmax(0, 1fr) minmax(280px, .9fr); min-height: 430px; overflow: hidden; padding: clamp(2rem, 6vw, 4.8rem); text-align: left; }
    .footer-copy { max-width: 760px; position: relative; z-index: 1; }
    .eyebrow { word-spacing: .08em; }
    h2 { color: #111; font-size: clamp(3rem, 6.4vw, 6.5rem); font-weight: 900; letter-spacing: 0; line-height: .9; margin: .8rem 0 1.6rem; max-width: 780px; word-spacing: .08em; }
    .footer-actions { display: flex; gap: .8rem; justify-content: flex-start; }
    .footer-visual { align-self: stretch; display: flex; justify-content: flex-end; min-height: 300px; }
    .footer-visual img { border-radius: 8px; height: auto; max-height: 430px; max-width: 100%; object-fit: contain; object-position: center right; width: min(46vw, 560px); }
    @media (max-width: 860px) {
      .landing-footer { grid-template-columns: 1fr; text-align: left; }
      .footer-visual { justify-content: flex-start; min-height: 240px; width: 100%; }
      .footer-visual img { max-height: 340px; width: 100%; }
    }
    @media (max-width: 560px) {
      .landing-footer { min-height: 360px; padding: 1.25rem; }
      h2 { font-size: clamp(2.2rem, 12vw, 3.15rem); line-height: .98; }
      .footer-actions { flex-direction: column; width: 100%; }
      .footer-actions .btn-pill { width: 100%; }
    }
  `]
})
export class LandingFooterSectionComponent {}
