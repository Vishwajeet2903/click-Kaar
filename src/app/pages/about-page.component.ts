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
        <img src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=1600&q=80" alt="Studio lights and photography crew">
        <div>
          <p class="eyebrow">About Clickkaar</p>
          <h1 class="section-title">Built for photographers, filmmakers, and creators who need the right gear without owning everything.</h1>
          <p class="muted">Clickkaar is a frontend mock rental platform designed around fast discovery, transparent rental pricing, and clean booking workflows.</p>
        </div>
      </div>
      <div class="row g-4 mt-2">
        @for (item of values; track item.title) {
          <div class="col-md-4"><div class="surface value"><h2>{{ item.title }}</h2><p class="muted">{{ item.text }}</p></div></div>
        }
      </div>
    </section>
  `,
  styles: [`
    .about-hero { align-items: center; display: grid; gap: 2rem; grid-template-columns: 1fr 1fr; }
    img { aspect-ratio: 4/3; border-radius: 8px; object-fit: cover; width: 100%; }
    .value { height: 100%; padding: 1.2rem; }
    h2 { font-size: 1.2rem; font-weight: 900; }
    @media (max-width: 767px) { .about-hero { grid-template-columns: 1fr; } }
  `]
})
export class AboutPageComponent {
  readonly values = [
    { title: 'Inspected inventory', text: 'Every mock listing is presented as tested, clean, and production-ready.' },
    { title: 'Flexible rental thinking', text: 'Daily and weekly rates help crews plan lean shoots with clear totals.' },
    { title: 'Creator-first UX', text: 'The interface focuses on discovery, booking confidence, and repeat rentals.' }
  ];
}
