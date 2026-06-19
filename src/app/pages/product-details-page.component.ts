import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../models/product.model';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { CartService } from '../services/cart.service';
import { ProductService } from '../services/product.service';
import { WishlistService } from '../services/wishlist.service';
import { AppButtonComponent } from '../shared/components/app-button.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-added-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, RouterLink],
  template: `
    <div class="cart-dialog">
      <div class="dialog-mark">✓</div>
      <h2 mat-dialog-title>Added to booking cart</h2>
      <mat-dialog-content>
        Your selected gear and rental dates are ready for checkout.
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button class="dialog-action" mat-dialog-close>Keep browsing</button>
        <a mat-flat-button class="dialog-action" routerLink="/cart" mat-dialog-close>View cart</a>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .cart-dialog { background: #fff; border: 1px solid rgba(255,151,0,.22); border-radius: 24px; color: #111; font-family: var(--app-font); min-width: min(360px, calc(100vw - 48px)); padding: 1.35rem; text-align: center; }
    .cart-dialog, .cart-dialog * { font-family: var(--app-font) !important; letter-spacing: 0; }
    .dialog-mark { align-items: center; background: #ff9700; border-radius: 999px; color: #111; display: inline-flex; font-size: 1.35rem; font-weight: 950; height: 52px; justify-content: center; margin-bottom: .85rem; width: 52px; }
    h2 { color: #111; font-family: var(--display-font) !important; font-size: 1.48rem; font-weight: 950; line-height: 1.05; margin: 0 0 .5rem; padding: 0; }
    mat-dialog-content { color: #666; display: block; font-size: .98rem; font-weight: 700; line-height: 1.6; margin: 0; padding: 0; }
    mat-dialog-actions { display: grid; gap: .7rem; grid-template-columns: 1fr 1fr; margin: 1.2rem 0 0; padding: 0; }
    .dialog-action { --mdc-text-button-label-text-color: #fff; --mdc-filled-button-container-color: #111; --mdc-filled-button-label-text-color: #fff; align-items: center; background: #111 !important; border-radius: 999px !important; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff !important; display: inline-flex; font-size: .92rem; font-weight: 950; justify-content: center; min-height: 46px; padding: .75rem 1rem; text-transform: none; width: 100%; }
    .dialog-action:hover { --mdc-text-button-label-text-color: #111; --mdc-filled-button-container-color: #ff9700; --mdc-filled-button-label-text-color: #111; background: #ff9700 !important; color: #111 !important; transform: translateY(-1px); }
    @media (max-width: 420px) {
      mat-dialog-actions { grid-template-columns: 1fr; }
    }
  `]
})
export class AddedDialogComponent {}

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
          <div class="hero-stats" aria-label="Rental highlights">
            <div><span>Rating</span><strong class="rating-value">{{ product()!.rating }}</strong></div>
            <div><span>Stock</span><strong>{{ product()!.stock }}</strong></div>
            <div><span>Weekly</span><strong>{{ product()!.weeklyPrice | currency:'INR':'symbol':'1.0-0' }}</strong></div>
          </div>
        </div>

        <div class="row g-4 align-items-start">
          <div class="col-lg-7">
            <div class="gallery surface">
              <div class="media-frame" (touchstart)="onGalleryTouchStart($event)" (touchend)="onGalleryTouchEnd($event)">
                <img class="main-img" [src]="selectedImage()" [alt]="product()!.name">
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
                  {{ product()!.available ? product()!.stock + ' units ready' : 'Check back soon' }}
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

              @if (activeDateField()) {
                <div class="calendar-popover" aria-label="Rental calendar">
                  <div class="calendar-head">
                    <button type="button" class="calendar-arrow theme-arrow-button previous" aria-label="Previous month" (click)="changeCalendarMonth(-1)">
                      <span class="theme-arrow-icon" aria-hidden="true"></span>
                    </button>
                    <strong>{{ calendarTitle() }}</strong>
                    <button type="button" class="calendar-arrow theme-arrow-button" aria-label="Next month" (click)="changeCalendarMonth(1)">
                      <span class="theme-arrow-icon" aria-hidden="true"></span>
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
                <span>{{ duration() }} day rental</span>
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
              <div><span>{{ entry[0] }}</span><strong>{{ entry[1] }}</strong></div>
            }
          </section>
        </div>
      </section>
    }
  `,
  styles: [`
    .product-view { display: grid; gap: 1.35rem; }
    .detail-hero { align-items: end; display: grid; gap: 1.25rem; grid-template-columns: minmax(0, 1fr) auto; }
    .copy { max-width: 760px; }
    h1 { color: #111; font-size: clamp(2.2rem, 6vw, 5.25rem); font-weight: 950; letter-spacing: 0; line-height: .92; margin: .35rem 0 .75rem; }
    .intro { color: #575757; font-size: clamp(1rem, 1.7vw, 1.16rem); line-height: 1.65; margin: 0; max-width: 680px; }
    .hero-stats { display: grid; gap: .65rem; grid-template-columns: repeat(3, minmax(86px, 1fr)); min-width: min(100%, 360px); }
    .hero-stats div { background: #fff; border-radius: 18px; color: #fff; padding: .85rem .95rem; }
    .hero-stats span { color: #000; display: block; font-size: .7rem; font-weight: 900; text-transform: uppercase; }
    .hero-stats strong { color: #000; display: block; font-size: clamp(1rem, 2vw, 1.28rem); line-height: 1.1; margin-top: .35rem; }
    .hero-stats strong.rating-value { color: #008000; }
    .gallery { overflow: visible; padding: .65rem; position: sticky; top: 92px; }
    .media-frame { background: #ececea; border-radius: 18px; overflow: hidden; position: relative; touch-action: pan-y; }
    .main-img { aspect-ratio: 4/3; display: block; height: auto; object-fit: cover; width: 100%; }
    .stock-chip { background: #ff9700; border-radius: 999px; bottom: 1rem; color: #111; font-size: .75rem; font-weight: 950; left: 1rem; padding: .5rem .8rem; position: absolute; text-transform: uppercase; }
    .stock-chip.out { background: #111; color: #fff; }
    .slider-dots { align-items: center; display: flex; gap: .45rem; justify-content: center; margin-top: .75rem; min-height: 22px; }
    .slider-dots button { background: rgba(255,151,0,.32); border: 0; border-radius: 999px; cursor: pointer; height: 8px; padding: 0; transition: background .25s ease, transform .25s ease, width .25s ease; width: 8px; }
    .slider-dots button.active, .slider-dots button:hover { background: #ff9700; transform: translateY(-1px); width: 28px; }
    .booking-card { padding: 1.25rem; position: sticky; top: 92px; }
    .booking-head { align-items: start; display: flex; gap: 1.2rem; justify-content: space-between; margin-bottom: 1.25rem; }
    .booking-head span, .booking-head small { color: #777; display: block; font-size: .78rem; font-weight: 800; text-transform: uppercase; }
    .booking-head strong { color: #111; display: block; font-size: 2rem; line-height: 1; margin: .2rem 0; }
    .availability { background: rgba(24,134,75,.1); border-radius: 999px; color: #18864b; font-size: .78rem; font-weight: 950; padding: .55rem .75rem; text-align: center; white-space: nowrap; }
    .availability.out { background: rgba(194,58,33,.1); color: #c23a21; }
    .date-grid { display: grid; column-gap: 1.15rem; row-gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: .55rem; }
    .date-control { background: #fff; border: 1px solid rgba(255,151,0,.36); border-radius: 18px; cursor: pointer; display: grid; gap: .5rem; min-width: 0; padding: 1rem 1.05rem; text-align: left; transition: background .25s ease, border-color .25s ease, box-shadow .25s ease, transform .25s ease; }
    .date-control:hover, .date-control.active { border-color: #ff9700; box-shadow: 0 12px 24px rgba(255,151,0,.13); transform: translateY(-1px); }
    .date-control span { color: #ff9700; font-size: .72rem; font-weight: 950; text-transform: uppercase; }
    .date-control strong { color: #111; font-size: 1rem; line-height: 1.1; }
    .calendar-popover { background: #fff; border: 1px solid rgba(255,151,0,.36); border-radius: 22px; box-shadow: 0 18px 38px rgba(17,17,17,.1); margin: 1rem 0 1.2rem; padding: 1.1rem; }
    .calendar-head { align-items: center; display: flex; justify-content: space-between; margin-bottom: 1rem; }
    .calendar-head strong { color: #111; font-size: .96rem; }
    .calendar-head .calendar-arrow { --arrow-button-size: 30px; }
    .calendar-head .calendar-arrow .theme-arrow-icon {
      --arrow-head-size: 8px;
      --arrow-head-stroke: 3px;
      --arrow-icon-height: 12px;
      --arrow-icon-width: 14px;
      --arrow-line-stroke: 3px;
    }
    .calendar-weekdays, .calendar-days { display: grid; gap: .45rem; grid-template-columns: repeat(7, 1fr); }
    .calendar-weekdays span { color: #ff9700; font-size: .66rem; font-weight: 950; text-align: center; text-transform: uppercase; }
    .calendar-days button, .calendar-days span { align-items: center; aspect-ratio: 1; border-radius: 999px; display: inline-flex; font-size: .82rem; justify-content: center; }
    .calendar-days button { background: #fff; border: 1px solid transparent; color: #111; cursor: pointer; font-weight: 900; }
    .calendar-days button:hover, .calendar-days button.selected { background: #ff9700; border-color: #ff9700; color: #111; }
    .calendar-days button:disabled { background: #f5f5f3; color: #c7c7c0; cursor: not-allowed; }
    .duration-options { display: grid; gap: .65rem; grid-template-columns: repeat(4, 1fr); margin: 0 0 1.1rem; }
    .duration-card { background: #fff; border: 1px solid rgba(255,151,0,.42); border-radius: 16px; color: #111; cursor: pointer; min-height: 62px; padding: .65rem .5rem; text-align: center; transition: transform .25s ease, border-color .25s ease, background .25s ease, color .25s ease, box-shadow .25s ease; }
    .duration-card span { color: #ff9700; display: block; font-size: .68rem; font-weight: 950; line-height: 1.1; text-transform: uppercase; }
    .duration-card strong { color: #111; display: block; font-size: .88rem; line-height: 1.1; margin-top: .25rem; white-space: nowrap; }
    .duration-card:hover, .duration-card.active { background: #ff9700; border-color: #ff9700; box-shadow: 0 12px 24px rgba(255,151,0,.2); color: #111; transform: translateY(-2px); }
    .duration-card:hover span, .duration-card.active span { color: #fff; }
    .duration-card:hover strong, .duration-card.active strong { color: #111; }
    .total-panel { align-items: center; background: #fff; border: 1px solid rgba(17,17,17,.08); border-radius: 20px; display: flex; justify-content: space-between; margin: .1rem 0 1.15rem; padding: 1rem 1.1rem; }
    .total-panel span { color: #777; font-weight: 800; }
    .total-panel strong { color: #111; font-size: 1.35rem; }
    .action-grid { display: grid; gap: .85rem; grid-template-columns: repeat(2, 1fr); }
    .trust-row { border-top: 1px solid rgba(17,17,17,.08); display: grid; gap: .75rem; grid-template-columns: repeat(3, 1fr); margin-top: 1.2rem; padding-top: 1.15rem; }
    .trust-row span { color: #555; font-size: .76rem; font-weight: 800; line-height: 1.25; }
    .detail-panels { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .info-card { min-height: 210px; padding: 1.1rem; }
    .info-card h2 { color: #111; font-size: 1.12rem; font-weight: 950; margin: 0 0 .35rem; }
    .description-card p { color: #575757; line-height: 1.7; margin: .75rem 0 0; }
    .specs-card div { align-items: center; border-top: 1px solid rgba(17,17,17,.08); display: flex; gap: 1rem; justify-content: space-between; padding: .82rem 0; }
    .specs-card span { color: #777; font-weight: 800; }
    .specs-card strong { color: #111; text-align: right; }
    @media (max-width: 991px) {
      .detail-hero { grid-template-columns: 1fr; }
      .detail-panels { grid-template-columns: 1fr; }
      .gallery, .booking-card { position: static; }
    }
    @media (max-width: 575px) {
      .hero-stats, .date-grid, .action-grid, .trust-row { grid-template-columns: 1fr; }
      .date-grid { row-gap: .85rem; }
      .duration-options { grid-template-columns: repeat(2, 1fr); }
      .booking-head { display: grid; }
      .availability { justify-self: start; }
      .gallery { padding: .45rem; }
      .media-frame { cursor: grab; }
      .main-img { min-height: 280px; }
    }
  `]
})
export class ProductDetailsPageComponent {
  private readonly productService = inject(ProductService);
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);
  private readonly cart = inject(CartService);
  protected readonly wishlist = inject(WishlistService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly product = signal<Product | undefined>(undefined);
  readonly selectedImage = signal('');
  readonly startDate = signal(new Date());
  readonly endDate = signal(new Date(Date.now() + 3 * 86_400_000));
  readonly isCheckingAvailability = signal(false);
  protected readonly activeDateField = signal<'start' | 'end' | undefined>(undefined);
  protected readonly calendarMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  protected readonly rentalDurations = [1, 2, 3, 4];
  protected readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  private readonly monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  private galleryTouchStartX = 0;
  readonly duration = computed(() => Math.max(1, Math.ceil((this.endDate().getTime() - this.startDate().getTime()) / 86_400_000)));
  readonly total = computed(() => (this.product()?.dailyPrice ?? 0) * this.duration());
  readonly specEntries = computed(() => Object.entries(this.product()?.specifications ?? {}));

  constructor() {
    const id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
    this.productService.getProduct(id).subscribe((product) => {
      this.product.set(product);
      this.selectedImage.set(product?.image ?? '');
    });
  }

  rentalPrice(days: number): number {
    return (this.product()?.dailyPrice ?? 0) * days;
  }

  displayDate(date: Date): string {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  dateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  setStartDate(value: string): void {
    const currentDuration = this.duration();
    const nextStart = this.parseDateInput(value);
    this.startDate.set(nextStart);

    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextStart.getDate() + currentDuration);
    this.endDate.set(nextEnd);
  }

  setEndDate(value: string): void {
    const nextEnd = this.parseDateInput(value);
    this.endDate.set(nextEnd < this.startDate() ? this.startDate() : nextEnd);
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
    this.calendarMonth.set(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  }

  selectCalendarDate(day: Date): void {
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
    return this.activeDateField() === 'end' && this.dateInputValue(day) < this.dateInputValue(this.startDate());
  }

  selectDuration(days: number): void {
    const start = this.startDate();
    const nextEndDate = new Date(start);
    nextEndDate.setDate(start.getDate() + days);
    this.endDate.set(nextEndDate);
  }

  selectImage(index: number): void {
    const image = this.product()?.gallery[index];
    if (image) this.selectedImage.set(image);
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

    this.isCheckingAvailability.set(true);
    this.bookingService.checkAvailability(product.id, this.dateInputValue(this.startDate()), this.dateInputValue(this.endDate()))
      .subscribe({
        next: (availability) => {
          this.isCheckingAvailability.set(false);
          if (!availability.available) {
            this.showTopMessage(availability.message, 3800);
            return;
          }

          this.cart.add(product, this.startDate(), this.endDate());
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
    const added = this.wishlist.toggle(product);
    this.snackBar.open(added ? 'Added to wishlist' : 'Removed from wishlist', 'Close', {
      duration: 2200,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-success-top']
    });
  }

  private showTopMessage(message: string, duration: number): void {
    this.snackBar.open(message, 'Close', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-success-top']
    });
  }

  private parseDateInput(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
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
