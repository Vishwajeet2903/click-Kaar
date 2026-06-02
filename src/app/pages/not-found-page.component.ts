import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppButtonComponent } from '../shared/components/app-button.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, AppButtonComponent],
  template: `
    <section class="container not-found">
      <p class="eyebrow">404</p>
      <h1>Frame not found</h1>
      <p class="muted">The page you requested is outside the current Clickkaar catalogue.</p>
      <a routerLink="/"><app-button>Back to Home</app-button></a>
    </section>
  `,
  styles: [`
    .not-found { display: grid; min-height: 68vh; place-content: center; text-align: center; }
    h1 { font-size: clamp(3rem, 9vw, 7rem); font-weight: 950; }
    a { display: inline-block; justify-self: center; min-width: 220px; }
  `]
})
export class NotFoundPageComponent {}
