import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-policy-page',
  standalone: true,
  imports: [BreadcrumbComponent],
  template: `
    <app-breadcrumb [label]="title" />
    <section class="container pb-5 policy">
      <p class="eyebrow">Legal</p>
      <h1 class="section-title">{{ title }}</h1>
      @for (section of sections; track section.heading) {
        <div class="surface block"><h2>{{ section.heading }}</h2><p class="muted">{{ section.text }}</p></div>
      }
    </section>
  `,
  styles: [`
    .policy { max-width: 95vw; }
    .block { margin-bottom: 1rem; padding: 1.2rem; }
    h2 { font-size: 1.2rem; font-weight: 900; }
  `]
})
export class PolicyPageComponent {
  private readonly page = inject(ActivatedRoute).snapshot.data['page'];
  readonly title = this.page === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions';
  readonly sections = this.page === 'privacy'
    ? [
        { heading: 'Mock data', text: 'This frontend demo does not transmit personal data to a backend service.' },
        { heading: 'Forms', text: 'Form entries are used only for client-side validation and mock UI feedback.' },
        { heading: 'Images', text: 'Remote placeholder images are used to create a realistic photography aesthetic.' }
      ]
    : [
        { heading: 'Rental flow', text: 'Bookings, prices, deposits, taxes, and payments are mock-only for this frontend build.' },
        { heading: 'Availability', text: 'Inventory availability is represented by static mock product data.' },
        { heading: 'Use of app', text: 'This project is a production-quality frontend prototype and not an operational rental backend.' }
      ];
}
