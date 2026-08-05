import { Component } from '@angular/core';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [BreadcrumbComponent],
  template: `
    <app-breadcrumb label="FAQ" />
    <section class="container pb-5 faq">
      <p class="eyebrow">Questions</p>
      <h1 class="section-title">FAQ</h1>
      @for (item of questions; track item.q) {
        <details class="surface">
          <summary>{{ item.q }}</summary>
          <p class="muted">{{ item.a }}</p>
        </details>
      }
    </section>
  `,
  styles: [`
    .faq { max-width: 95vw; }
    details { margin-bottom: .9rem; padding: 1rem; }
    summary { cursor: pointer; font-weight: 900; }
    p { margin: .8rem 0 0; }
  `]
})
export class FaqPageComponent {
  readonly questions = [
    { q: 'Is this connected to a backend?', a: 'Yes. Bookings, accounts, catalogue data, and payments are handled through the ClickKaar backend.' },
    { q: 'Can I choose rental dates?', a: 'Yes. Product details include datepickers and automatic duration pricing.' },
    { q: 'Are payments real?', a: 'Yes. Online checkout uses Razorpay for UPI, card, net banking, and wallet payments.' },
    { q: 'Can products be filtered?', a: 'Yes. Catalogue supports category, brand, price, availability, search, sorting, and pagination.' }
  ];
}
