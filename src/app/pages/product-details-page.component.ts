import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../models/product.model';
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
    <h2 mat-dialog-title>Added to booking cart</h2>
    <mat-dialog-content>Your rental kit is ready for checkout.</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Keep browsing</button>
      <a mat-flat-button color="primary" routerLink="/cart" mat-dialog-close>View cart</a>
    </mat-dialog-actions>
  `
})
export class AddedDialogComponent {}

@Component({
  selector: 'app-product-details-page',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule, MatSnackBarModule, BreadcrumbComponent, AppButtonComponent],
  template: `
    @if (product()) {
      <app-breadcrumb [label]="product()!.name" />
      <section class="container pb-5">
        <div class="row g-4">
          <div class="col-lg-6">
            <div class="gallery">
              <img class="main-img" [src]="selectedImage()" [alt]="product()!.name">
              <div class="thumbs">
                @for (image of product()!.gallery; track image) {
                  <button (click)="selectedImage.set(image)" [class.active]="image === selectedImage()"><img [src]="image" [alt]="product()!.name"></button>
                }
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="surface details">
              <p class="eyebrow">{{ product()!.category }} · {{ product()!.brand }}</p>
              <h1>{{ product()!.name }}</h1>
              <p class="muted">{{ product()!.description }}</p>
              <div class="price-row">
                <div><strong>{{ product()!.dailyPrice | currency:'INR':'symbol':'1.0-0' }}</strong><span>/ day</span></div>
                <div><strong>{{ product()!.weeklyPrice | currency:'INR':'symbol':'1.0-0' }}</strong><span>/ week</span></div>
              </div>
              <div class="availability" [class.out]="!product()!.available">{{ product()!.available ? 'Available now' : 'Currently unavailable' }} · {{ product()!.stock }} units</div>
              <div class="booking">
                <mat-form-field appearance="outline">
                  <mat-label>Start date</mat-label>
                  <input matInput [matDatepicker]="startPicker" [ngModel]="startDate()" (ngModelChange)="startDate.set($event)">
                  <mat-datepicker-toggle matIconSuffix [for]="startPicker" />
                  <mat-datepicker #startPicker />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>End date</mat-label>
                  <input matInput [matDatepicker]="endPicker" [ngModel]="endDate()" (ngModelChange)="endDate.set($event)">
                  <mat-datepicker-toggle matIconSuffix [for]="endPicker" />
                  <mat-datepicker #endPicker />
                </mat-form-field>
              </div>
              <div class="total">Duration: {{ duration() }} days · Total: <strong>{{ total() | currency:'INR':'symbol':'1.0-0' }}</strong></div>
              <div class="row g-2 mt-2">
                <div class="col-sm-6"><app-button (click)="addToCart()">Add To Cart</app-button></div>
                <div class="col-sm-6"><app-button variant="secondary" (click)="toggleWishlist()">Add To Wishlist</app-button></div>
              </div>
            </div>
            <div class="surface specs">
              <h2>Specifications</h2>
              @for (entry of specEntries(); track entry[0]) {
                <div><span>{{ entry[0] }}</span><strong>{{ entry[1] }}</strong></div>
              }
            </div>
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    .gallery { position: sticky; top: 92px; }
    .main-img { aspect-ratio: 4/3; border-radius: 2.5%; object-fit: cover; transition: transform .25s ease; width: 100%; }
    .main-img:hover { transform: scale(1.015); }
    .thumbs { display: grid; gap: .7rem; grid-template-columns: repeat(4, 1fr); margin-top: .8rem; }
    .thumbs button { background: transparent; border: 2px solid transparent; border-radius: 5%; overflow: hidden; padding: 0; }
    .thumbs button.active { border-color: #ff9700; }
    .thumbs img { aspect-ratio: 1/1; object-fit: cover; width: 100%; }
    .details, .specs { padding: 1.3rem; }
    h1 { font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 950; }
    .price-row { display: grid; gap: 1rem; grid-template-columns: repeat(2, 1fr); margin: 1.2rem 0; }
    .price-row div { background: #fff; border: 1px solid rgba(216,164,59,.42); border-radius: 2.5%; padding: 1rem; }
    .price-row strong { display: block; font-size: 1.4rem; }
    .price-row span { color: #777; }
    .availability { color: #18864b; font-weight: 900; margin-bottom: 1rem; }
    .availability.out { color: #c23a21; }
    .booking { display: grid; gap: 1rem; grid-template-columns: repeat(2, 1fr); }
    .total { color: #171717; font-weight: 800; margin: .5rem 0 1rem; }
    .specs { margin-top: 1rem; }
    .specs h2 { font-size: 1.2rem; font-weight: 900; }
    .specs div { border-top: 1px solid rgba(148,163,184,.15); display: flex; justify-content: space-between; padding: .75rem 0; }
    .specs span { color: #777; }
    @media (max-width: 575px) { .booking, .price-row { grid-template-columns: 1fr; } }
  `]
})
export class ProductDetailsPageComponent {
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly product = signal<Product | undefined>(undefined);
  readonly selectedImage = signal('');
  readonly startDate = signal(new Date());
  readonly endDate = signal(new Date(Date.now() + 3 * 86_400_000));
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

  addToCart(): void {
    const product = this.product();
    if (!product) return;
    this.cart.add(product, this.startDate(), this.endDate());
    this.dialog.open(AddedDialogComponent);
  }

  toggleWishlist(): void {
    const product = this.product();
    if (!product) return;
    const added = this.wishlist.toggle(product);
    this.snackBar.open(added ? 'Added to wishlist' : 'Removed from wishlist', 'Close', { duration: 2200 });
  }
}
