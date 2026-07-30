import { Component } from '@angular/core';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [BreadcrumbComponent],
  template: `
    <app-breadcrumb label="About Us" />
    <section class="container pb-5">
      <div class="about-hero">
        <div>
          <p class="eyebrow">About Click-Kaar Pro Gear</p>
          <h1 class="section-title">A Pune-based camera and production equipment rental company.</h1>
          <p class="intro">Click-Kaar Pro Gear supports the creative and media industry with high-quality, reliable equipment for corporate films, documentaries, advertisements, independent films, weddings, and digital content production.</p>
        </div>
      </div>

      <div class="about-content">
        <article class="surface story">
          <h2>Our Goal</h2>
          <p>Our goal is to offer the latest technology and professional gear to help creators bring their ideas to life. With a wide range of cameras, lenses, lighting, audio equipment, production accessories, and technical support, Click-Kaar Pro Gear is your trusted partner for every shoot.</p>
        </article>

        <article class="surface story">
          <h2>Our Services</h2>
          <p>At Click-Kaar Pro Gear, we are committed to delivering quality and reliability for every production. We offer professional camera and filmmaking equipment from leading global brands to meet the needs of photographers, filmmakers, and content creators.</p>
          <div class="service-grid">
            @for (service of services; track service) {
              <span>{{ service }}</span>
            }
          </div>
        </article>

        <article class="surface story">
          <h2>Our Fantastic Team</h2>
          <p>Our dedicated team is committed to providing reliable and professional service for every production. From equipment bookings and technical support to operations and customer assistance, we work together to ensure a smooth rental experience.</p>
          <p>Whether it's a corporate film, commercial, documentary, wedding, or independent project, our team is always ready to help you choose the right equipment and provide the support you need for a successful shoot.</p>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .about-hero { width: 100%; }
    .section-title { font-size: clamp(2.1rem, 4vw, 3.85rem); letter-spacing: 0; line-height: 1.08; margin: 0 0 1rem; max-width: none; text-align: left; word-spacing: 0; }
    .intro { color: #242424; font-size: 1.1rem; line-height: 1.75; margin: 0; max-width: none; }
    .about-content { display: grid; gap: 1rem; margin-top: 1.75rem; }
    .story { padding: clamp(1.2rem, 3vw, 2rem); }
    h2 { color: #111; font-size: clamp(1.5rem, 2.4vw, 2.2rem); font-weight: 900; letter-spacing: 0; line-height: 1.12; margin: 0 0 .85rem; }
    .story p { color: #333; font-size: 1rem; line-height: 1.72; margin: 0; max-width: none; }
    .story p + p { margin-top: .85rem; }
    .service-grid { display: grid; gap: .75rem; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 1.2rem; }
    .service-grid span { background: #fff; border: 1px solid rgba(17,17,17,.08); border-radius: 999px; color: #111; font-size: .92rem; font-weight: 800; padding: .75rem 1rem; }
    @media (max-width: 991px) { .service-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 560px) {
      .section-title { font-size: clamp(1.9rem, 9vw, 2.55rem); line-height: 1.12; }
      .intro { font-size: 1rem; line-height: 1.65; }
      .service-grid { grid-template-columns: 1fr; }
      .service-grid span { border-radius: 14px; }
    }
  `]
})
export class AboutPageComponent {
  readonly services = [
    'Camera & Lens Rentals',
    'Lighting Equipment',
    'Audio & Recording Gear',
    'Gimbals, Tripods & Camera Support',
    'Production Accessories',
    'Technical Assistance & Equipment Consultation'
  ];
}
