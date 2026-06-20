import { Component, computed, signal } from '@angular/core';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-customer-reviews-section',
  standalone: true,
  imports: [ScrollRevealDirective],
  template: `
    <section class="landing-card reviews-section" id="reviews">
      <div class="reviews-top" appScrollReveal="fade-up">
        <div class="section-heading">
          <p class="eyebrow">Customer reviews</p>
          <h2>Trusted by creators who cannot miss the shot.</h2>
        </div>
        <div class="carousel-controls" aria-label="Customer review slider controls">
          <button type="button" class="theme-arrow-button previous" (click)="slide(-1)" aria-label="Previous reviews">
            <i class="fa-solid fa-angle-right theme-arrow-icon" style="color: rgb(255, 255, 255);" aria-hidden="true"></i>
          </button>
          <button type="button" class="theme-arrow-button" (click)="slide(1)" aria-label="Next reviews">
            <i class="fa-solid fa-angle-right theme-arrow-icon" style="color: rgb(255, 255, 255);" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <div class="reviews-window" aria-live="polite">
        <div class="reviews-track" [class.no-transition]="isResetting()" [style.--review-index]="currentIndex()">
          @for (review of renderedReviews(); track index; let index = $index) {
            <article class="review-card">
              <div class="rating" aria-label="5 star review">★★★★★</div>
              <p>"{{ review.quote }}"</p>
              <div class="reviewer">
                <img [src]="review.avatar" [alt]="review.name">
                <div>
                  <strong>{{ review.name }}</strong>
                  <span>{{ review.role }}</span>
                </div>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .carousel-controls .theme-arrow-button { --arrow-button-size: 28px; }
    .carousel-controls .theme-arrow-icon {
      color: #fff !important;
      display: block;
      font-size: 0;
      height: 16px;
      line-height: 1;
      position: relative;
      width: 14px;
    }
    .carousel-controls .theme-arrow-icon::before,
    .carousel-controls .theme-arrow-icon::after {
      background: currentColor;
      border: 0;
      border-radius: 999px;
      content: "";
      height: 5px;
      left: 0;
      position: absolute;
      top: 50%;
      transform-origin: calc(100% - 2.5px) 50%;
      width: 15px;
    }
    .carousel-controls .theme-arrow-icon::before { transform: translateY(-50%) rotate(45deg); }
    .carousel-controls .theme-arrow-icon::after { transform: translateY(-50%) rotate(-45deg); }
    .carousel-controls .theme-arrow-button.previous .theme-arrow-icon { transform: rotate(180deg); }
    .reviews-section { padding: clamp(2rem, 6vw, 4.8rem); }
    .reviews-top { align-items: end; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 1.4rem; }
    .section-heading { margin-bottom: 1.4rem; max-width: 760px; }
    h2 { color: #111; font-size: clamp(2.5rem, 5vw, 4.6rem); font-weight: 900; letter-spacing: 0; line-height: .98; margin: 0; word-spacing: .08em; }
    .carousel-controls { display: flex; gap: .5rem; }
    .reviews-window { --review-step: calc((-100% - 1rem) / 3); overflow: hidden; }
    .reviews-track { display: flex; gap: 1rem; transform: translateX(calc(var(--review-index) * var(--review-step))); transition: transform .62s cubic-bezier(.22, 1, .36, 1); }
    .reviews-track.no-transition { transition: none; }
    .review-card { background: #f6f6f4; border: 1px solid rgba(17,17,17,.06); border-radius: 24px; display: flex; flex: 0 0 calc((100% - 2rem) / 3); flex-direction: column; min-height: 310px; padding: 1.35rem; transition: box-shadow .28s ease, transform .28s ease; }
    .review-card:hover { box-shadow: 0 24px 48px rgba(0,0,0,.14); transform: translateY(-8px); }
    .rating { color: #ff9700; font-size: 1rem; font-weight: 900; letter-spacing: .14em; margin-bottom: 1rem; }
    p { color: #222; flex: 1; font-size: clamp(1.1rem, 1.8vw, 1.35rem); font-weight: 800; letter-spacing: 0; line-height: 1.25; margin: 0 0 1.4rem; word-spacing: .06em; }
    .reviewer { align-items: center; display: flex; gap: .8rem; }
    img { border-radius: 50%; height: 52px; object-fit: cover; width: 52px; }
    strong { color: #111; display: block; font-size: .95rem; font-weight: 900; word-spacing: .08em; }
    span { color: #666; display: block; font-size: .82rem; font-weight: 800; margin-top: .15rem; }
    @media (max-width: 900px) {
      .reviews-top { align-items: flex-start; flex-direction: column; }
      .section-heading { margin-bottom: 0; }
      .reviews-window { --review-step: calc(-100% - 1rem); }
      .review-card { flex-basis: 100%; }
      .review-card { min-height: 240px; }
    }
    @media (max-width: 560px) {
      .reviews-section { padding: 1.25rem; }
    }
  `]
})
export class CustomerReviewsSectionComponent {
  readonly currentIndex = signal(1);
  readonly isResetting = signal(false);

  readonly renderedReviews = computed(() => [
    this.reviews[this.reviews.length - 1],
    ...this.reviews,
    ...this.reviews.slice(0, 3)
  ]);

  readonly reviews = [
    {
      quote: 'The kit arrived clean, charged, and exactly matched the booking. We finished a two-day product shoot without chasing backups.',
      name: 'Aarav Mehta',
      role: 'Product photographer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80'
    },
    {
      quote: 'Click-Kaar helped us pick lenses, lights, and audio in one call. The pricing was clear and pickup was smooth.',
      name: 'Nisha Rao',
      role: 'Brand filmmaker',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80'
    },
    {
      quote: 'I booked a mirrorless body and primes for a wedding reel at the last minute. Everything was ready before call time.',
      name: 'Kabir Sethi',
      role: 'Wedding creator',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80'
    },
    {
      quote: 'The studio lighting kit was packed beautifully and the team explained every modifier before handoff.',
      name: 'Meera Iyer',
      role: 'Studio producer',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80'
    },
    {
      quote: 'We rented audio and gimbal gear for a food campaign. The booking stayed simple even when our dates changed.',
      name: 'Rohan Dutta',
      role: 'Commercial director',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80'
    },
    {
      quote: 'Great recommendations, quick confirmation, and no surprises on deposit or daily pricing.',
      name: 'Tara Shah',
      role: 'Content creator',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80'
    }
  ];

  slide(step: number): void {
    const total = this.reviews.length;
    this.currentIndex.update((index) => index + step);

    window.setTimeout(() => {
      if (this.currentIndex() > total) {
        this.snapTo(1);
      } else if (this.currentIndex() < 1) {
        this.snapTo(total);
      }
    }, 640);
  }

  private snapTo(index: number): void {
    this.isResetting.set(true);
    this.currentIndex.set(index);

    window.setTimeout(() => {
      this.isResetting.set(false);
    });
  }
}
