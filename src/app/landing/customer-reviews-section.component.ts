import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CustomerReview, CustomerReviewService } from '../services/customer-review.service';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-customer-reviews-section',
  standalone: true,
  imports: [FormsModule, ScrollRevealDirective],
  template: `
    <section class="landing-card reviews-section" id="reviews">
      <div class="reviews-top" appScrollReveal="fade-up">
        <div class="section-heading">
          <p class="eyebrow">Customer reviews</p>
          <h2>Trusted by Pune creators for flawless camera rentals.</h2>
        </div>
        <div class="carousel-controls" aria-label="Customer review slider controls">
          <button type="button" class="theme-arrow-button previous" (click)="slide(-1)" [disabled]="reviews().length < 2" aria-label="Previous reviews">
            <i class="fa-solid fa-angle-right theme-arrow-icon" style="color: rgb(255, 255, 255);" aria-hidden="true"></i>
          </button>
          <button type="button" class="theme-arrow-button" (click)="slide(1)" [disabled]="reviews().length < 2" aria-label="Next reviews">
            <i class="fa-solid fa-angle-right theme-arrow-icon" style="color: rgb(255, 255, 255);" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      @if (reviews().length) {
        <div class="reviews-window" aria-live="polite">
          <div class="reviews-track" [class.no-transition]="isResetting()" [style.--review-index]="currentIndex()">
            @for (review of renderedReviews(); track index; let index = $index) {
              <article class="review-card">
                <div class="rating" [attr.aria-label]="review.rating + ' star review'">
                  @for (star of ratingOptions; track star) {
                    <span [class.dimmed]="star > review.rating">&#9733;</span>
                  }
                </div>
                <p>"{{ review.quote }}"</p>
                @if (review.adminReply) {
                  <div class="admin-reply">
                    <span>Click-Kaar replied</span>
                    <strong>{{ review.adminReply }}</strong>
                  </div>
                }
                <div class="reviewer">
                  @if (review.avatar) {
                    <img [src]="review.avatar" [alt]="review.name">
                  } @else {
                    <span class="reviewer-initials" aria-hidden="true">{{ initials(review.name) }}</span>
                  }
                  <div>
                    <strong>{{ review.name }}</strong>
                    <span>{{ review.role }}</span>
                  </div>
                </div>
              </article>
            }
          </div>
        </div>
      } @else {
        <div class="reviews-empty" aria-live="polite">
          {{ isLoading() ? 'Loading customer reviews...' : 'No customer reviews yet.' }}
        </div>
      }

      <div class="write-review" appScrollReveal="fade-up">
        <div class="write-review-copy">
          <p class="eyebrow">Write a review</p>
          <h3>Share your Click-Kaar equipment experience.</h3>
          <p>Your review will help other creators to rent Click-Kaar Pro Gear photography equipment with complete confidence.</p>
        </div>

        <form class="review-form" (ngSubmit)="submitReview()">
          <div class="review-fields">
            <label>
              <span>Name</span>
              <input type="text" name="reviewName" [(ngModel)]="reviewDraft.name" placeholder="Your name" required maxlength="120">
            </label>
            <label>
              <span>Creator type</span>
              <input type="text" name="reviewRole" [(ngModel)]="reviewDraft.role" placeholder="Photographer, filmmaker..." required maxlength="120">
            </label>
          </div>

          <div class="rating-picker" role="radiogroup" aria-label="Review rating">
            @for (star of ratingOptions; track star) {
              <button
                type="button"
                [class.active]="star <= reviewDraft.rating"
                (click)="selectRating(star)"
                [attr.aria-label]="star + ' star rating'"
                [attr.aria-checked]="star === reviewDraft.rating"
                role="radio">
                &#9733;
              </button>
            }
          </div>

          <label>
            <span>Your review</span>
            <textarea name="reviewQuote" [(ngModel)]="reviewDraft.quote" placeholder="Tell us what was smooth, useful, or memorable." rows="4" required maxlength="600"></textarea>
          </label>

          <div class="review-actions">
            <button type="submit" class="btn-pill" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Saving...' : 'Submit review' }}
            </button>
            @if (reviewSubmitted()) {
              <span class="review-status">Review saved.</span>
            }
            @if (reviewError()) {
              <span class="review-error">{{ reviewError() }}</span>
            }
          </div>
        </form>
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
    .reviews-section { border-radius: 36px; box-shadow: none; padding: clamp(2rem, 6vw, 4.8rem); }
    .reviews-top { align-items: end; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 1.4rem; }
    .section-heading { margin-bottom: 1.4rem; max-width: 920px; }
    h2 { color: #111; font-size: clamp(2.15rem, 4vw, 3.75rem); font-weight: 900; letter-spacing: 0; line-height: 1.08; margin: 0; max-width: 900px; word-spacing: 0; }
    .carousel-controls { display: flex; gap: .5rem; }
    .carousel-controls .theme-arrow-button:disabled { opacity: .45; }
    .reviews-window { --review-step: calc((-100% - 1rem) / 3); overflow: hidden; }
    .reviews-track { display: flex; gap: 1rem; transform: translateX(calc(var(--review-index) * var(--review-step))); transition: transform .62s cubic-bezier(.22, 1, .36, 1); }
    .reviews-track.no-transition { transition: none; }
    .reviews-empty { align-items: center; background: #f6f6f4; border: 1px dashed rgba(17,17,17,.16); border-radius: 24px; color: #666; display: flex; font-size: 1rem; font-weight: 800; min-height: 180px; padding: 1.25rem; }
    .review-card { background: #f6f6f4; border: 1px solid rgba(17,17,17,.03); border-radius: 34px; display: flex; flex: 0 0 calc((100% - 2rem) / 3); flex-direction: column; min-height: 310px; padding: 1.35rem; transition: box-shadow .28s ease, transform .28s ease; }
    .review-card:hover { box-shadow: none; transform: translateY(-4px); }
    .rating { color: #ff9700; font-size: 1rem; font-weight: 900; letter-spacing: .14em; margin-bottom: 1rem; }
    .rating span { color: inherit; display: inline; font-size: inherit; font-weight: inherit; letter-spacing: inherit; margin: 0; }
    .rating .dimmed { color: #d6d1c8; }
    p { color: #222; flex: 1; font-size: clamp(1rem, 1.45vw, 1.18rem); font-weight: 700; letter-spacing: 0; line-height: 1.5; margin: 0 0 1.4rem; word-spacing: 0; }
    .admin-reply { background: #fff; border-left: 4px solid #ff9700; border-radius: 14px; margin: 0 0 1rem; padding: .8rem .9rem; }
    .admin-reply span { color: #ff9700; font-size: .72rem; font-weight: 950; letter-spacing: .08em; margin: 0 0 .35rem; text-transform: uppercase; }
    .admin-reply strong { color: #222; font-size: .9rem; font-weight: 800; line-height: 1.45; }
    .reviewer { align-items: center; display: flex; gap: .8rem; }
    img { border-radius: 50%; height: 52px; object-fit: cover; width: 52px; }
    .reviewer-initials { align-items: center; background: #111; border-radius: 50%; color: #fff; display: inline-flex; flex: 0 0 52px; font-size: .9rem; font-weight: 900; height: 52px; justify-content: center; margin: 0; width: 52px; }
    strong { color: #111; display: block; font-size: .95rem; font-weight: 900; word-spacing: 0; }
    span { color: #666; display: block; font-size: .82rem; font-weight: 800; margin-top: .15rem; }
    .write-review { align-items: start; background: #f6f6f4; border-radius: 24px; color: #fff; display: grid; gap: clamp(1.2rem, 3vw, 2rem); grid-template-columns: minmax(0, .78fr) minmax(0, 1.22fr); margin-top: 1.25rem; padding: clamp(1.2rem, 3vw, 2rem); }
    .write-review-copy .eyebrow { color: #ff9700; font-size: clamp(1rem, 1.5vw, 1.18rem); letter-spacing: .2em; margin: 0 0 .65rem; }
    .write-review-copy h3 { color: #000; font-size: clamp(1.65rem, 3vw, 2.6rem); line-height: 1; margin: 0 0 .85rem; }
    .write-review-copy p:not(.eyebrow) { color: gray; font-size: 1rem; font-weight: 600; line-height: 1.45; margin: 0; max-width: 360px; }
    .review-form { display: grid; gap: .85rem; }
    .review-fields { display: grid; gap: .85rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    label { display: grid; gap: .4rem; }
    label span { color: #ff9700; font-size: .78rem; font-weight: 900; letter-spacing: .08em; margin: 0; text-transform: uppercase; }
    input,
    textarea { background: #fff; border: 1px solid rgba(255,255,255,.1); border-radius: 18px; color: #111; font-size: .98rem; font-weight: 700; min-height: 48px; outline: none; padding: .9rem 1rem; width: 100%; }
    textarea { line-height: 1.45; min-height: 116px; resize: vertical; }
    input:focus,
    textarea:focus { border-color: #ff9700; box-shadow: 0 0 0 3px rgba(255,151,0,.24); }
    .rating-picker { display: flex; gap: .25rem; }
    .rating-picker button { background: transparent; border: 0; color: #808080; cursor: pointer; font-size: 1.55rem; line-height: 1; padding: .1rem .18rem; transition: color .2s ease, transform .2s ease; }
    .rating-picker button.active,
    .rating-picker button:hover { color: #ff9700; transform: translateY(-1px); }
    .review-actions { align-items: center; display: flex; flex-wrap: wrap; gap: .8rem; }
    .review-actions .btn-pill { background: #000; color: #fff; min-width: 150px; }
    .review-actions .btn-pill:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,255,255,.14); color: #111; }
    .review-actions .btn-pill:disabled { background: #d8d4cc; box-shadow: none; color: #777; cursor: not-allowed; transform: none; }
    .review-status,
    .review-error { color: #606060; font-size: .88rem; font-weight: 800; margin: 0; }
    .review-error { color: #b3261e; }
    @media (max-width: 900px) {
      .reviews-top { align-items: flex-start; flex-direction: column; }
      .section-heading { margin-bottom: 0; }
      .reviews-window { --review-step: calc(-100% - 1rem); }
      .review-card { flex-basis: 100%; }
      .review-card { min-height: 240px; }
      .write-review { grid-template-columns: 1fr; }
    }
    @media (max-width: 560px) {
      .reviews-section { border-radius: 26px; padding: 1.25rem; }
      h2 { font-size: clamp(1.9rem, 9vw, 2.55rem); line-height: 1.12; }
      .carousel-controls { width: 100%; }
      .review-fields { grid-template-columns: 1fr; }
      .review-card { border-radius: 28px; min-height: 260px; padding: 1rem; }
      p { font-size: 1rem; line-height: 1.35; }
      .write-review { border-radius: 18px; padding: 1rem; }
      .write-review-copy h3 { font-size: clamp(1.45rem, 8vw, 2rem); line-height: 1.08; }
      input,
      textarea { border-radius: 14px; font-size: .94rem; min-width: 0; }
      .review-actions .btn-pill { width: 100%; }
    }
  `]
})
export class CustomerReviewsSectionComponent implements OnInit {
  private readonly reviewService = inject(CustomerReviewService);

  readonly currentIndex = signal(1);
  readonly isResetting = signal(false);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly reviewError = signal('');
  readonly reviewSubmitted = signal(false);
  readonly reviews = signal<CustomerReview[]>([]);
  readonly ratingOptions = [1, 2, 3, 4, 5];
  readonly maxNameLength = 120;
  readonly maxRoleLength = 120;
  readonly maxQuoteLength = 600;
  reviewDraft = {
    name: '',
    role: '',
    quote: '',
    rating: 0
  };

  readonly renderedReviews = computed(() => [
    this.reviews()[this.reviews().length - 1],
    ...this.reviews(),
    ...this.reviews().slice(0, 3)
  ]);

  ngOnInit(): void {
    this.loadReviews();
  }

  slide(step: number): void {
    const total = this.reviews().length;
    if (total < 2) {
      return;
    }

    this.currentIndex.update((index) => index + step);

    window.setTimeout(() => {
      if (this.currentIndex() > total) {
        this.snapTo(1);
      } else if (this.currentIndex() < 1) {
        this.snapTo(total);
      }
    }, 640);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  selectRating(rating: number): void {
    this.reviewDraft.rating = rating;
  }

  submitReview(): void {
    const name = this.reviewDraft.name.trim();
    const role = this.reviewDraft.role.trim();
    const quote = this.reviewDraft.quote.trim();

    if (!name || !role || !quote || !this.reviewDraft.rating) {
      this.reviewError.set('Please fill in your name, creator type, and review.');
      this.reviewSubmitted.set(false);
      return;
    }

    if (name.length > this.maxNameLength || role.length > this.maxRoleLength) {
      this.reviewError.set('Name and creator type must be 120 characters or less.');
      this.reviewSubmitted.set(false);
      return;
    }

    if (quote.length > this.maxQuoteLength) {
      this.reviewError.set('Review must be 600 characters or less.');
      this.reviewSubmitted.set(false);
      return;
    }

    this.reviewError.set('');
    this.reviewSubmitted.set(false);
    this.isSubmitting.set(true);

    this.reviewService.createReview({
      name,
      role,
      quote,
      rating: this.reviewDraft.rating
    }).subscribe({
      next: () => {
        this.reviewSubmitted.set(true);
        this.reviewDraft = {
          name: '',
          role: '',
          quote: '',
          rating: 0
        };
        this.loadReviews();
      },
      error: (error) => {
        this.reviewError.set(this.reviewSaveErrorMessage(error));
        this.isSubmitting.set(false);
      }
    });
  }

  private loadReviews(): void {
    this.isLoading.set(true);
    this.reviewService.getReviews().subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.currentIndex.set(reviews.length ? 1 : 0);
        this.isLoading.set(false);
        this.isSubmitting.set(false);
      },
      error: () => {
        this.reviewError.set('Could not load customer reviews.');
        this.reviews.set([]);
        this.currentIndex.set(0);
        this.isLoading.set(false);
        this.isSubmitting.set(false);
      }
    });
  }

  private snapTo(index: number): void {
    this.isResetting.set(true);
    this.currentIndex.set(index);

    window.setTimeout(() => {
      this.isResetting.set(false);
    });
  }

  private reviewSaveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Could not reach the backend from this site. Please refresh and try again.';
      }

      if (error.error?.errors && typeof error.error.errors === 'object') {
        const messages = Object.values(error.error.errors)
          .filter((message): message is string => typeof message === 'string' && message.trim().length > 0);
        if (messages.length) {
          return messages.join(' ');
        }
      }

      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }
    }

    return 'Could not save your review. Please try again.';
  }
}
