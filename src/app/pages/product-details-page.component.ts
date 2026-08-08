import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../models/product.model';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { discountedRentalPrice, rentalDiscountPercent } from '../services/rental-pricing';
import { CartService } from '../services/cart.service';
import { ProductService, useProductImageFallback } from '../services/product.service';
import { WishlistService } from '../services/wishlist.service';
import { AppButtonComponent } from '../shared/components/app-button.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-added-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <div class="cart-dialog">
      <div class="dialog-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" focusable="false">
          <path d="M8.5 16.8 13.7 22 24 10.6" />
        </svg>
      </div>
      <h2 mat-dialog-title>Added to booking cart</h2>
      <mat-dialog-content>
        Your selected gear and rental dates are ready for checkout.
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button class="dialog-action" mat-dialog-close>Keep browsing</button>
        <button mat-flat-button type="button" class="dialog-action" (click)="viewCart()">View cart</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .cart-dialog { background: #fff; border: 0; border-radius: 28px; color: #111; font-family: var(--app-font); min-width: min(360px, calc(100vw - 48px)); overflow: hidden; padding: 1.35rem; text-align: center; }
    .cart-dialog, .cart-dialog * { font-family: var(--app-font) !important; letter-spacing: 0; }
    .dialog-mark { align-items: center; background: #ff9700; border-radius: 50%; display: inline-flex; height: 56px; justify-content: center; margin-bottom: .85rem; overflow: hidden; width: 56px; }
    .dialog-mark svg { display: block; height: 32px; width: 32px; }
    .dialog-mark path { fill: none; stroke: #fff; stroke-linecap: round; stroke-linejoin: round; stroke-width: 5.2; }
    h2 { color: #111; font-family: var(--display-font) !important; font-size: 1.48rem; font-weight: 950; line-height: 1.05; margin: 0 0 .5rem; padding: 0; }
    mat-dialog-content { color: #666; display: block; font-size: .98rem; font-weight: 700; line-height: 1.6; margin: 0; padding: 0; }
    mat-dialog-actions { display: grid; gap: .7rem; grid-template-columns: 1fr 1fr; margin: 1.2rem 0 0; padding: 0; }
    .dialog-action { --mdc-text-button-label-text-color: #fff; --mdc-filled-button-container-color: #111; --mdc-filled-button-label-text-color: #fff; align-items: center; background: #111 !important; border-radius: 999px !important; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff !important; display: inline-flex; font-size: .92rem; font-weight: 950; justify-content: center; min-height: 46px; padding: .75rem 1rem; text-transform: none; width: 100%; }
    .dialog-action:hover { --mdc-text-button-label-text-color: #fff; --mdc-filled-button-container-color: #ff9700; --mdc-filled-button-label-text-color: #fff; background: #ff9700 !important; color: #fff !important; transform: translateY(-1px); }
    @media (max-width: 420px) {
      mat-dialog-actions { grid-template-columns: 1fr; }
    }
  `]
})
export class AddedDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AddedDialogComponent>);
  private readonly router = inject(Router);

  viewCart(): void {
    this.dialogRef.close();
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    void this.router.navigateByUrl('/cart').then(() => {
      window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }), 0);
      window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }), 120);
    });
  }
}

@Component({
  selector: 'app-product-details-page',
  standalone: true,
  imports: [CurrencyPipe, MatSnackBarModule, BreadcrumbComponent, AppButtonComponent],
  template: `
    @if (product()) {
      <app-breadcrumb [label]="product()!.name" />
      <section class="container product-view pb-5">
        <div class="detail-hero">
          <div class="copy">
            <p class="eyebrow">{{ product()!.category }} / {{ product()!.brand }}</p>
            <h1>{{ product()!.name }}</h1>
            <p class="intro">{{ product()!.description }}</p>
          </div>
        </div>

        <div class="row g-4 align-items-start">
          <div class="col-lg-7">
            <div class="gallery surface">
              <div class="media-frame" (touchstart)="onGalleryTouchStart($event)" (touchend)="onGalleryTouchEnd($event)">
                <img class="main-img" [src]="selectedImage()" [alt]="product()!.name" (error)="useFallback($event)">
                <!-- <span class="stock-chip" [class.out]="!product()!.available">
                  {{ product()!.available ? 'Available now' : 'Unavailable' }}
                </span> -->
              </div>
              <div class="slider-dots" aria-label="Product image slider">
                @for (image of product()!.gallery; track image; let index = $index) {
                  <button
                    type="button"
                    (click)="selectImage(index)"
                    [class.active]="image === selectedImage()"
                    [attr.aria-label]="'View product image ' + (index + 1)"
                  ></button>
                }
              </div>
            </div>
          </div>

          <div class="col-lg-5">
            <aside class="surface booking-card">
              <div class="booking-head">
                <div>
                  <span>From</span>
                  <strong>{{ product()!.dailyPrice | currency:'INR':'symbol':'1.0-0' }}</strong>
                  <small>per day</small>
                </div>
                <div class="availability" [class.out]="!product()!.available">
                  {{ product()!.available ? 'Available' : 'Check back soon' }}
                </div>
              </div>

              <div class="date-grid">
                <button type="button" class="date-control" [class.active]="activeDateField() === 'start'" (click)="openCalendar('start')">
                  <span>Start date</span>
                  <strong>{{ displayDate(startDate()) }}</strong>
                </button>
                <button type="button" class="date-control" [class.active]="activeDateField() === 'end'" (click)="openCalendar('end')">
                  <span>End date</span>
                  <strong>{{ displayDate(endDate()) }}</strong>
                </button>
              </div>

              @if (bookingAlert()) {
                <div class="booking-alert" role="alert">{{ bookingAlert() }}</div>
              }

              @if (activeDateField()) {
                <div class="calendar-popover" aria-label="Rental calendar">
                  <div class="calendar-head">
                    <button type="button" class="calendar-arrow theme-arrow-button previous" aria-label="Previous month" [disabled]="isPreviousCalendarMonthDisabled()" (click)="changeCalendarMonth(-1)">
                      <i class="fa-solid fa-angle-right theme-arrow-icon" style="color: rgb(255, 255, 255);" aria-hidden="true"></i>
                    </button>
                    <strong>{{ calendarTitle() }}</strong>
                    <button type="button" class="calendar-arrow theme-arrow-button" aria-label="Next month" (click)="changeCalendarMonth(1)">
                      <i class="fa-solid fa-angle-right theme-arrow-icon" style="color: rgb(255, 255, 255);" aria-hidden="true"></i>
                    </button>
                  </div>
                  <div class="calendar-weekdays">
                    @for (day of weekDays; track day) {
                      <span>{{ day }}</span>
                    }
                  </div>
                  <div class="calendar-days">
                    @for (day of calendarDays(); track $index) {
                      @if (day) {
                        <button
                          type="button"
                          [class.selected]="isSelectedCalendarDate(day)"
                          [class.blocked]="isBlockedCalendarDate(day)"
                          [disabled]="isDisabledCalendarDate(day)"
                          (click)="selectCalendarDate(day)"
                        >
                          {{ day.getDate() }}
                        </button>
                      } @else {
                        <span></span>
                      }
                    }
                  </div>
                </div>
              }

              <div class="duration-options" aria-label="Quick rental duration">
                @for (days of rentalDurations; track days) {
                  <button
                    type="button"
                    class="duration-card"
                    [class.active]="duration() === days"
                    (click)="selectDuration(days)"
                  >
                    <span>{{ days }} {{ days === 1 ? 'day' : 'days' }}</span>
                    <strong>{{ rentalPrice(days) | currency:'INR':'symbol':'1.0-0' }}</strong>
                  </button>
                }
              </div>

              <div class="total-panel">
                <span>{{ duration() }} day rental@if (discountPercent()) { <small>{{ discountPercent() }}% off</small> }</span>
                <strong>{{ total() | currency:'INR':'symbol':'1.0-0' }}</strong>
              </div>

              <div class="action-grid">
                <app-button (click)="addToCart()" [disabled]="!product()!.available || isCheckingAvailability()">
                  {{ isCheckingAvailability() ? 'Checking dates...' : 'Add To Cart' }}
                </app-button>
                <app-button variant="secondary" (click)="toggleWishlist()">
                  {{ wishlist.has(product()!.id) ? 'Saved' : 'Add To Wishlist' }}
                </app-button>
              </div>

              <div class="trust-row">
                <span>Verified gear</span>
                <span>Cleaned before pickup</span>
                <span>Flexible rentals</span>
              </div>
            </aside>

          </div>
        </div>

        <div class="detail-panels">
          <section class="surface info-card description-card">
            <h2>Description</h2>
            <p>{{ product()!.description }}</p>
          </section>

          <section class="surface info-card specs-card">
            <h2>Specifications</h2>
            @for (entry of specEntries(); track entry[0]) {
              <div><span>{{ specLabel(entry[0]) }}</span><strong>{{ entry[1] }}</strong></div>
            }
          </section>
        </div>
      </section>
    }
  `,
  styles: [`
    .product-view { display: grid; gap: 1.35rem; }
    .detail-hero { align-items: end; display: grid; gap: 1.25rem; grid-template-columns: minmax(0, 1fr); }
    .copy { max-width: 820px; min-width: 0; }
    .eyebrow { line-height: 1.35; }
    h1 { color: #111; font-size: clamp(1.85rem, 4.2vw, 3.65rem); font-weight: 950; letter-spacing: 0; line-height: 1.08; margin: .35rem 0 .85rem; overflow-wrap: anywhere; }
    .intro { color: #4f4f4c; font-size: clamp(1rem, 1.35vw, 1.12rem); font-weight: 650; line-height: 1.75; margin: 0; max-width: 72ch; overflow-wrap: anywhere; }
    .gallery { max-width: 100%; overflow: hidden; padding: .65rem; position: sticky; top: 92px; }
    .media-frame { aspect-ratio: 4 / 3; background: #ececea; border-radius: 18px; max-width: 100%; overflow: hidden; position: relative; touch-action: pan-y; width: 100%; }
    .main-img { display: block; height: 100%; max-height: 100%; max-width: 100%; object-fit: cover; width: 100%; }
    .stock-chip { background: #ff9700; border-radius: 999px; bottom: 1rem; color: #111; font-size: .75rem; font-weight: 950; left: 1rem; padding: .5rem .8rem; position: absolute; text-transform: uppercase; }
    .stock-chip.out { background: #111; color: #fff; }
    .slider-dots { align-items: center; display: flex; gap: .45rem; justify-content: center; margin-top: .75rem; min-height: 22px; }
    .slider-dots button { background: rgba(255,151,0,.32); border: 0; border-radius: 999px; cursor: pointer; height: 8px; padding: 0; transition: background .25s ease, transform .25s ease, width .25s ease; width: 8px; }
    .slider-dots button.active, .slider-dots button:hover { background: #ff9700; transform: translateY(-1px); width: 28px; }
    .booking-card { padding: 1.25rem; position: sticky; top: 92px; }
    .booking-head { align-items: start; display: flex; gap: 1.2rem; justify-content: space-between; margin-bottom: 1.25rem; }
    .booking-head span, .booking-head small { color: #777; display: block; font-size: .78rem; font-weight: 800; text-transform: uppercase; }
    .booking-head strong { color: #111; display: block; font-size: 2rem; line-height: 1.08; margin: .2rem 0; }
    .availability { background: rgba(24,134,75,.1); border-radius: 999px; color: #18864b; font-size: .78rem; font-weight: 950; padding: .55rem .75rem; text-align: center; white-space: nowrap; }
    .availability.out { background: rgba(194,58,33,.1); color: #c23a21; }
    .date-grid { display: grid; column-gap: 1.15rem; row-gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: .55rem; }
    .date-control { background: #fff; border: 1px solid rgba(255,151,0,.36); border-radius: 18px; cursor: pointer; display: grid; gap: .5rem; min-width: 0; padding: 1rem 1.05rem; text-align: left; transition: background .25s ease, border-color .25s ease, box-shadow .25s ease, transform .25s ease; }
    .date-control:hover, .date-control.active { border-color: #ff9700; box-shadow: 0 12px 24px rgba(255,151,0,.13); transform: translateY(-1px); }
    .date-control span { color: #ff9700; font-size: .72rem; font-weight: 950; text-transform: uppercase; }
    .date-control strong { color: #111; font-size: 1rem; line-height: 1.25; overflow-wrap: anywhere; }
    .booking-alert { background: #fff8ed; border: 1px solid rgba(255,151,0,.34); border-left: 4px solid #ff9700; border-radius: 16px; color: #111; font-size: .9rem; font-weight: 850; line-height: 1.45; margin: .75rem 0 1rem; padding: .85rem 1rem; }
    .calendar-popover { background: #fff; border: 1px solid rgba(255,151,0,.36); border-radius: 22px; box-shadow: 0 18px 38px rgba(17,17,17,.1); margin: 1rem 0 1.2rem; padding: 1.1rem; }
    .calendar-head { align-items: center; display: flex; justify-content: space-between; margin-bottom: 1rem; }
    .calendar-head strong { color: #111; font-size: .96rem; }
    .calendar-head .calendar-arrow { --arrow-button-size: 28px; }
    .calendar-head .calendar-arrow .theme-arrow-icon {
      color: #fff !important;
      display: block;
      font-size: 0;
      height: 16px;
      line-height: 1;
      position: relative;
      width: 14px;
    }
    .calendar-head .calendar-arrow .theme-arrow-icon::before,
    .calendar-head .calendar-arrow .theme-arrow-icon::after {
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
    .calendar-head .calendar-arrow .theme-arrow-icon::before { transform: translateY(-50%) rotate(45deg); }
    .calendar-head .calendar-arrow .theme-arrow-icon::after { transform: translateY(-50%) rotate(-45deg); }
    .calendar-head .calendar-arrow.previous .theme-arrow-icon,
    .calendar-head .calendar-arrow.previous:hover .theme-arrow-icon { transform: rotate(180deg); }
    .calendar-weekdays, .calendar-days { display: grid; gap: .45rem; grid-template-columns: repeat(7, 1fr); }
    .calendar-weekdays span { color: #ff9700; font-size: .66rem; font-weight: 950; text-align: center; text-transform: uppercase; }
    .calendar-days button, .calendar-days span { align-items: center; aspect-ratio: 1; border-radius: 999px; display: inline-flex; font-size: .82rem; justify-content: center; }
    .calendar-days button { background: #fff; border: 1px solid transparent; color: #111; cursor: pointer; font-weight: 900; }
    .calendar-days button:hover, .calendar-days button.selected { background: #ff9700; border-color: #ff9700; color: #fff; }
    .calendar-days button:disabled { background: #f5f5f3; color: #c7c7c0; cursor: not-allowed; }
    .calendar-days button.blocked:disabled { background: rgba(194,58,33,.1); border-color: rgba(194,58,33,.16); color: #c23a21; text-decoration: line-through; }
    .duration-options { display: grid; gap: .65rem; grid-template-columns: repeat(4, 1fr); margin: 0 0 1.1rem; }
    .duration-card { background: #fff; border: 1px solid rgba(255,151,0,.42); border-radius: 16px; color: #111; cursor: pointer; min-height: 62px; padding: .65rem .5rem; text-align: center; transition: transform .25s ease, border-color .25s ease, background .25s ease, color .25s ease, box-shadow .25s ease; }
    .duration-card span { color: #ff9700; display: block; font-size: .68rem; font-weight: 950; line-height: 1.1; text-transform: uppercase; }
    .duration-card strong { color: #111; display: block; font-size: .88rem; line-height: 1.2; margin-top: .25rem; white-space: nowrap; }
    .duration-card:hover, .duration-card.active { background: #ff9700; border-color: #ff9700; box-shadow: 0 12px 24px rgba(255,151,0,.2); color: #fff; transform: translateY(-2px); }
    .duration-card:hover span, .duration-card.active span { color: #fff; }
    .duration-card:hover strong, .duration-card.active strong { color: #fff; }
    .total-panel { align-items: center; background: #fff; border: 1px solid rgba(17,17,17,.08); border-radius: 20px; display: flex; justify-content: space-between; margin: .1rem 0 1.15rem; padding: 1rem 1.1rem; }
    .total-panel span { color: #777; display: grid; font-weight: 800; gap: .2rem; }
    .total-panel small { color: #027a48; font-size: .74rem; font-weight: 950; }
    .total-panel strong { color: #111; font-size: 1.35rem; }
    .action-grid { display: grid; gap: .85rem; grid-template-columns: repeat(2, 1fr); }
    .trust-row { border-top: 1px solid rgba(17,17,17,.08); display: grid; gap: .75rem; grid-template-columns: repeat(3, 1fr); margin-top: 1.2rem; padding-top: 1.15rem; }
    .trust-row span { color: #555; font-size: .76rem; font-weight: 800; line-height: 1.35; }
    .detail-panels { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .info-card { min-height: 210px; padding: 1.2rem; }
    .info-card h2 { color: #111; font-size: 1.16rem; font-weight: 950; line-height: 1.25; margin: 0 0 .55rem; }
    .description-card p { color: #4f4f4c; font-size: 1rem; font-weight: 650; line-height: 1.8; margin: .75rem 0 0; max-width: 78ch; overflow-wrap: anywhere; }
    .specs-card div { align-items: start; border-top: 1px solid rgba(17,17,17,.08); display: grid; gap: 1rem; grid-template-columns: minmax(120px, .75fr) minmax(0, 1.25fr); padding: .9rem 0; }
    .specs-card span { color: #777; font-size: .82rem; font-weight: 900; line-height: 1.35; text-transform: uppercase; }
    .specs-card strong { color: #111; font-size: .95rem; font-weight: 850; line-height: 1.45; overflow-wrap: anywhere; text-align: left; }
    @media (max-width: 991px) {
      .detail-hero { grid-template-columns: 1fr; }
      h1 { font-size: clamp(1.8rem, 7vw, 2.8rem); }
      .detail-panels { grid-template-columns: 1fr; }
      .gallery, .booking-card { position: static; }
    }
    @media (max-width: 575px) {
      .date-grid, .action-grid, .trust-row { grid-template-columns: 1fr; }
      .date-grid { row-gap: .85rem; }
      .duration-options { grid-template-columns: repeat(2, 1fr); }
      .booking-head { display: grid; }
      .availability { justify-self: start; }
      .gallery { max-width: 100%; overflow: hidden; padding: .45rem; }
      .media-frame { border-radius: 14px; contain: paint; cursor: grab; }
      .main-img { height: 100%; min-height: 0; }
      .product-view { gap: 1rem; }
      h1 { line-height: 1.1; }
      .intro, .description-card p { font-size: .96rem; line-height: 1.7; }
      .specs-card div { grid-template-columns: 1fr; gap: .28rem; }
    }
  `]
})
export class ProductDetailsPageComponent {
  private readonly productService = inject(ProductService);
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  protected readonly wishlist = inject(WishlistService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly product = signal<Product | undefined>(undefined);
  readonly selectedImage = signal('');
  readonly startDate = signal(new Date());
  readonly endDate = signal(new Date());
  readonly isCheckingAvailability = signal(false);
  readonly bookedRanges = signal<Array<{ start: Date; end: Date }>>([]);
  readonly blockedRanges = computed(() => {
    const productId = this.product()?.id;
    const cartRanges = productId
      ? this.cart.items()
          .filter((item) => item.product.id === productId)
          .map((item) => ({ start: this.stripTime(item.startDate), end: this.stripTime(item.endDate) }))
      : [];
    return [...this.bookedRanges(), ...cartRanges];
  });
  readonly bookingAlert = signal('');
  protected readonly activeDateField = signal<'start' | 'end' | undefined>(undefined);
  protected readonly calendarMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  protected readonly rentalDurations = [1, 2, 5, 7];
  private readonly maxRentalDays = 7;
  protected readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  private readonly monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  private galleryTouchStartX = 0;
  private alertTimeout: ReturnType<typeof setTimeout> | undefined;
  readonly duration = computed(() => Math.max(1, Math.floor((this.endDate().getTime() - this.startDate().getTime()) / 86_400_000) + 1));
  readonly discountPercent = computed(() => rentalDiscountPercent(this.duration()));
  readonly total = computed(() => discountedRentalPrice(this.product()?.dailyPrice ?? 0, this.duration()));
  readonly specEntries = computed(() => Object.entries(this.product()?.specifications ?? {}));

  constructor() {
    const id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
    this.productService.getProduct(id).subscribe((product) => {
      this.product.set(product);
      this.selectedImage.set(product?.image ?? '');
      this.loadBlockedRanges(id);
    });
  }

  rentalPrice(days: number): number {
    return discountedRentalPrice(this.product()?.dailyPrice ?? 0, days);
  }

  displayDate(date: Date): string {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  specLabel(label: string): string {
    return label
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  dateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  setStartDate(value: string): void {
    const currentDuration = Math.min(this.duration(), this.maxRentalDays);
    const selectedStart = this.parseDateInput(value);
    const today = this.today();
    const nextStart = selectedStart < today ? today : selectedStart;
    if (this.isBlockedCalendarDate(nextStart)) {
      this.showTopMessage('This date is already booked. Please choose another date.', 3200);
      return;
    }
    this.startDate.set(nextStart);

    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextStart.getDate() + currentDuration - 1);
    if (this.rangeOverlapsBlockedDates(nextStart, nextEnd)) {
      const availableWindow = this.firstAvailableWindow(currentDuration, nextStart);
      this.startDate.set(availableWindow.start);
      this.endDate.set(availableWindow.end);
      this.showTopMessage('Selected days crossed booked dates, so the calendar moved to the next available window.', 3600);
      return;
    }
    this.endDate.set(nextEnd);
  }

  setEndDate(value: string): void {
    const nextEnd = this.parseDateInput(value);
    const minEndDate = this.startDate() < this.today() ? this.today() : this.startDate();
    const maxEndDate = this.maxEndDateForStart(this.startDate());
    let adjustedEnd = nextEnd < minEndDate ? minEndDate : nextEnd;
    if (adjustedEnd > maxEndDate) {
      adjustedEnd = maxEndDate;
      this.showTopMessage('Rental duration can be maximum 7 days.', 3200);
    }
    if (this.rangeOverlapsBlockedDates(this.startDate(), adjustedEnd)) {
      this.showTopMessage('This rental range includes booked dates. Please choose an earlier available end date.', 3400);
      return;
    }
    this.endDate.set(adjustedEnd);
  }

  openCalendar(field: 'start' | 'end'): void {
    const nextField = this.activeDateField() === field ? undefined : field;
    this.activeDateField.set(nextField);
    if (!nextField) return;

    const anchorDate = field === 'start' ? this.startDate() : this.endDate();
    this.calendarMonth.set(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1));
  }

  calendarTitle(): string {
    const month = this.calendarMonth();
    return `${this.monthNames[month.getMonth()]} ${month.getFullYear()}`;
  }

  calendarDays(): Array<Date | undefined> {
    const month = this.calendarMonth();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const days: Array<Date | undefined> = Array.from({ length: firstDay.getDay() }, () => undefined);

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(new Date(month.getFullYear(), month.getMonth(), day));
    }

    return days;
  }

  changeCalendarMonth(offset: number): void {
    const month = this.calendarMonth();
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    const currentMonth = this.currentCalendarMonth();
    this.calendarMonth.set(nextMonth < currentMonth ? currentMonth : nextMonth);
  }

  selectCalendarDate(day: Date): void {
    if (this.isDisabledCalendarDate(day)) return;
    this.bookingAlert.set('');

    if (this.activeDateField() === 'start') {
      this.setStartDate(this.dateInputValue(day));
    } else {
      this.setEndDate(this.dateInputValue(day));
    }
    this.activeDateField.set(undefined);
  }

  isSelectedCalendarDate(day: Date): boolean {
    const selected = this.activeDateField() === 'start' ? this.startDate() : this.endDate();
    return this.dateInputValue(day) === this.dateInputValue(selected);
  }

  isDisabledCalendarDate(day: Date): boolean {
    if (day < this.today()) return true;
    if (this.isBlockedCalendarDate(day)) return true;
    if (this.activeDateField() === 'end' && day > this.maxEndDateForStart(this.startDate())) return true;
    if (this.activeDateField() === 'end' && this.rangeOverlapsBlockedDates(this.startDate(), day)) return true;

    return this.activeDateField() === 'end' && this.dateInputValue(day) < this.dateInputValue(this.startDate());
  }

  isBlockedCalendarDate(day: Date): boolean {
    return this.blockedRanges().some((range) => this.isDateWithinRange(day, range.start, range.end));
  }

  isPreviousCalendarMonthDisabled(): boolean {
    return this.calendarMonth() <= this.currentCalendarMonth();
  }

  selectDuration(days: number): void {
    const start = this.startDate();
    const nextEndDate = new Date(start);
    nextEndDate.setDate(start.getDate() + days - 1);
    if (this.rangeOverlapsBlockedDates(start, nextEndDate)) {
      this.showTopMessage('Those rental days include already booked dates. Please choose another window.', 3600);
      return;
    }
    this.endDate.set(nextEndDate);
  }

  selectImage(index: number): void {
    const image = this.product()?.gallery[index];
    if (image) this.selectedImage.set(image);
  }

  useFallback(event: Event): void {
    const product = this.product();
    if (product) {
      useProductImageFallback(event);
    }
  }

  showPreviousImage(): void {
    this.showImageAtOffset(-1);
  }

  showNextImage(): void {
    this.showImageAtOffset(1);
  }

  onGalleryTouchStart(event: TouchEvent): void {
    this.galleryTouchStartX = event.changedTouches[0]?.clientX ?? 0;
  }

  onGalleryTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0]?.clientX ?? this.galleryTouchStartX;
    const deltaX = endX - this.galleryTouchStartX;
    if (Math.abs(deltaX) < 40) {
      return;
    }

    deltaX > 0 ? this.showPreviousImage() : this.showNextImage();
  }

  addToCart(): void {
    const product = this.product();
    if (!product || this.isCheckingAvailability()) return;
    if (!this.ensureCustomerAccess()) {
      return;
    }
    if (this.startDate() < this.today() || this.endDate() < this.today()) {
      this.showTopMessage('Choose today or a future date for booking.', 3200);
      this.setStartDate(this.dateInputValue(this.today()));
      return;
    }
    if (this.duration() > this.maxRentalDays) {
      this.showTopMessage('Rental duration can be maximum 7 days.', 3200);
      this.endDate.set(this.maxEndDateForStart(this.startDate()));
      return;
    }
    if (this.rangeOverlapsBlockedDates(this.startDate(), this.endDate())) {
      this.showTopMessage('This product is already booked for one or more selected dates.', 3600);
      return;
    }
    if (!this.cart.canAdd(product, this.startDate(), this.endDate())) {
      this.showTopMessage(`Only ${this.cart.availableStock(product)} units are available for this product.`, 3200);
      return;
    }

    this.isCheckingAvailability.set(true);
    this.bookingService.checkAvailability(product.id, this.dateInputValue(this.startDate()), this.dateInputValue(this.endDate()))
      .subscribe({
        next: (availability) => {
          this.isCheckingAvailability.set(false);
          if (!availability.available) {
            this.showTopMessage(availability.message, 3800);
            return;
          }

          if (!this.cart.add(product, this.startDate(), this.endDate())) {
            this.showTopMessage(`Only ${this.cart.availableStock(product)} units are available for this product.`, 3200);
            return;
          }
          this.moveSelectionToAvailableWindow();
          this.dialog.open(AddedDialogComponent);
        },
        error: (error) => {
          this.isCheckingAvailability.set(false);
          this.showTopMessage(this.authService.getErrorMessage(error), 3600);
        }
      });
  }

  toggleWishlist(): void {
    const product = this.product();
    if (!product) return;
    if (!this.ensureCustomerAccess()) {
      return;
    }
    const added = this.wishlist.toggle(product);
    this.snackBar.open(added ? 'Added to wishlist' : 'Removed from wishlist', 'Close', {
      duration: 2200,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-screen-center']
    });
  }

  private showTopMessage(message: string, duration: number): void {
    this.bookingAlert.set(message);
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
    this.alertTimeout = setTimeout(() => this.bookingAlert.set(''), duration);
  }

  private ensureCustomerAccess(): boolean {
    const user = this.authService.currentUser();
    if (!user) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return false;
    }
    if (!this.authService.isCustomer()) {
      this.showTopMessage('Only customer accounts can rent products or use wishlist.', 3200);
      return false;
    }
    return true;
  }

  private parseDateInput(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private loadBlockedRanges(productId: number): void {
    this.bookingService.getBlockedRanges(productId).subscribe({
      next: (ranges) => {
        this.bookedRanges.set(ranges.map((range) => ({
          start: this.parseDateInput(range.startDate),
          end: this.parseDateInput(range.endDate)
        })));
        this.moveSelectionToAvailableWindow();
      },
      error: () => {
        this.bookedRanges.set([]);
        this.showTopMessage('Booked dates could not be loaded. Please refresh before selecting rental dates.', 4200);
      }
    });
  }

  private maxEndDateForStart(startDate: Date): Date {
    const maxEndDate = this.stripTime(startDate);
    maxEndDate.setDate(maxEndDate.getDate() + this.maxRentalDays - 1);
    return maxEndDate;
  }

  private rangeOverlapsBlockedDates(startDate: Date, endDate: Date): boolean {
    const start = this.stripTime(startDate);
    const end = this.stripTime(endDate);
    return this.blockedRanges().some((range) => start <= range.end && end >= range.start);
  }

  private moveSelectionToAvailableWindow(): void {
    if (!this.rangeOverlapsBlockedDates(this.startDate(), this.endDate())) {
      return;
    }

    const availableWindow = this.firstAvailableWindow(this.duration(), this.today());
    this.startDate.set(availableWindow.start);
    this.endDate.set(availableWindow.end);
  }

  private firstAvailableWindow(durationDays: number, fromDate: Date): { start: Date; end: Date } {
    let start = this.stripTime(fromDate);

    for (let attempt = 0; attempt < 730; attempt += 1) {
      const end = new Date(start);
      end.setDate(start.getDate() + durationDays - 1);
      if (!this.rangeOverlapsBlockedDates(start, end)) {
        return { start, end };
      }

      start = new Date(start);
      start.setDate(start.getDate() + 1);
    }

    return { start: this.today(), end: this.today() };
  }

  private isDateWithinRange(day: Date, startDate: Date, endDate: Date): boolean {
    const date = this.stripTime(day);
    return date >= startDate && date <= endDate;
  }

  private stripTime(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private today(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  private currentCalendarMonth(): Date {
    const today = this.today();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  private showImageAtOffset(offset: number): void {
    const gallery = this.product()?.gallery ?? [];
    if (gallery.length < 2) {
      return;
    }

    const currentIndex = Math.max(0, gallery.findIndex((image) => image === this.selectedImage()));
    const nextIndex = (currentIndex + offset + gallery.length) % gallery.length;
    this.selectedImage.set(gallery[nextIndex]);
  }
}



