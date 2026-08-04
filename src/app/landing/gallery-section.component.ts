import { Component, OnInit, inject, signal } from '@angular/core';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';
import { GalleryImage, GalleryService } from '../services/gallery.service';

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
        @for (image of images(); track image.id; let index = $index) {
          <figure [class.tall]="image.tall" [class.wide]="image.wide" appScrollReveal="scale" [revealStagger]="index * 70">
            <img [src]="image.imageUrl" [alt]="image.altText">
          </figure>
        } @empty {
          <p class="gallery-empty">Gallery images will appear here once they are added from admin.</p>
        }
      </div>
    </section>
  `,
  styles: [`
    .gallery-section { padding: clamp(2rem, 6vw, 4.8rem); }
    .section-heading { max-width: none; width: 100%; }
    h2 { color: #111; font-size: clamp(2.15rem, 3.6vw, 3.35rem); font-weight: 900; letter-spacing: 0; line-height: 1.08; margin: 0 0 2rem; max-width: none; text-wrap: balance; word-spacing: 0; }
    .gallery-grid { display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    figure { background: #f6f6f4; border-radius: 24px; height: 260px; margin: 0; overflow: hidden; }
    figure.wide,
    figure.tall { grid-column: auto; grid-row: auto; height: 260px; }
    img { height: 100%; object-fit: cover; transition: transform .45s ease; width: 100%; }
    figure:hover img { transform: scale(1.07); }
    .gallery-empty { color: #666; font-size: 1rem; font-weight: 800; grid-column: 1 / -1; margin: 0; }
    @media (max-width: 900px) {
      .gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .gallery-section { padding: 1.25rem; }
      h2 { font-size: clamp(1.9rem, 9vw, 2.55rem); line-height: 1.12; }
      .gallery-grid { grid-template-columns: 1fr; }
      figure, figure.tall { border-radius: 18px; grid-column: auto; grid-row: auto; height: 230px; }
    }
  `]
})
export class GallerySectionComponent implements OnInit {
  private readonly galleryService = inject(GalleryService);

  readonly images = signal<GalleryImage[]>([]);

  ngOnInit(): void {
    this.galleryService.getGallery().subscribe({
      next: (images) => this.images.set(images),
      error: () => this.images.set([])
    });
  }
}
