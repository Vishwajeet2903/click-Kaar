import { Component } from '@angular/core';
import { AboutVisionSectionComponent } from '../landing/about-vision-section.component';
import { GallerySectionComponent } from '../landing/gallery-section.component';
import { HeroSectionComponent } from '../landing/hero-section.component';
import { LandingFooterSectionComponent } from '../landing/landing-footer-section.component';
import { MarketplaceSectionComponent } from '../landing/marketplace-section.component';
import { ShowcaseSectionComponent } from '../landing/showcase-section.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    HeroSectionComponent,
    ShowcaseSectionComponent,
    MarketplaceSectionComponent,
    AboutVisionSectionComponent,
    GallerySectionComponent,
    LandingFooterSectionComponent
  ],
  template: `
    <div class="landing-page">
      <app-hero-section />
      <app-showcase-section />
      <app-marketplace-section />
      <app-about-vision-section />
      <app-gallery-section />
      <app-landing-footer-section />
    </div>
  `,
  styles: [`
    .landing-page {
      display: grid;
      gap: 1.25rem;
      margin: 0 auto;
      padding: 0 0 1.25rem;
    }
  `]
})
export class HomePageComponent {}
