import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-gallery-section',
  standalone: true,
  imports: [ScrollRevealDirective],
  template: `
    <section class="landing-card gallery-section" id="gallery">
      <div class="section-heading" appScrollReveal="fade-up">
        <p class="eyebrow">Gallery</p>
        <h2>Colorful production moments, ready to be remixed.</h2>
      </div>
      <div class="gallery-grid">
        @for (image of images; track image.alt; let index = $index) {
          <figure [class.tall]="image.tall" [class.wide]="image.wide" appScrollReveal="scale" [revealStagger]="index * 70">
            <img [src]="image.src" [alt]="image.alt">
          </figure>
        }
      </div>
    </section>
  `,
  styles: [`
    .gallery-section { padding: clamp(2rem, 6vw, 4.8rem); }
    .section-heading { max-width: 760px; }
    h2 { color: #111; font-size: clamp(2.5rem, 5vw, 4.6rem); font-weight: 900; letter-spacing: -.055em; line-height: .98; margin: 0 0 2rem; }
    .gallery-grid { display: grid; gap: 1rem; grid-auto-flow: dense; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    figure { background: #f6f6f4; border-radius: 24px; height: 260px; margin: 0; overflow: hidden; }
    figure.wide { grid-column: span 2; }
    figure.tall { grid-row: span 2; height: 536px; }
    img { height: 100%; object-fit: cover; transition: transform .45s ease; width: 100%; }
    figure:hover img { transform: scale(1.07); }
    @media (max-width: 900px) {
      .gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .gallery-section { padding: 1.25rem; }
      .gallery-grid { grid-template-columns: 1fr; }
      figure, figure.tall { grid-column: auto; grid-row: auto; height: 260px; }
    }
  `]
})
export class GallerySectionComponent {
  readonly images = [
    { src: 'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=900&q=80', alt: 'Camera shoot detail', wide: true },
    { src: '/join-photographer.png', alt: 'Photographer creative portrait', tall: true },
    { src: 'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?auto=format&fit=crop&w=900&q=80', alt: 'Tripod equipment' },
    { src: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=80', alt: 'Audio equipment' },
    { src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80', alt: 'Studio interior', wide: true },
    { src: 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=900&q=80', alt: 'Outdoor creator kit' }
  ];
}
