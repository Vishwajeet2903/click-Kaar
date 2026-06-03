import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../models/product.model';
import { ProductService } from '../services/product.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';
import { ProductCardComponent } from '../shared/components/product-card.component';

@Component({
  selector: 'app-catalogue-page',
  standalone: true,
  imports: [FormsModule, BreadcrumbComponent, ProductCardComponent],
  template: `
    <app-breadcrumb label="Catalogue" />
    <section class="container pb-5">
      <div class="d-flex justify-content-between align-items-end gap-3 flex-wrap mb-4">
        <div><p class="eyebrow">Rental catalogue</p><h1 class="section-title">Find the exact gear for the shot</h1></div>
        <select class="form-select sort" [ngModel]="sort()" (ngModelChange)="sort.set($event); page.set(1)">
          <option value="popular">Most Popular</option>
          <option value="low">Price Low to High</option>
          <option value="high">Price High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>
      <div class="row g-4">
        <aside class="col-lg-3">
          <div class="surface filters">
            <input class="form-control mb-3" placeholder="Search gear" [ngModel]="query()" (ngModelChange)="query.set($event); page.set(1)">
            <label class="form-label">Category</label>
            <select class="form-select mb-3" [ngModel]="category()" (ngModelChange)="category.set($event); page.set(1)">
              <option value="">All categories</option>
              @for (item of categories(); track item) { <option [value]="item">{{ item }}</option> }
            </select>
            <label class="form-label">Brand</label>
            <select class="form-select mb-3" [ngModel]="brand()" (ngModelChange)="brand.set($event); page.set(1)">
              <option value="">All brands</option>
              @for (item of brands(); track item) { <option [value]="item">{{ item }}</option> }
            </select>
            <label class="form-label">Max daily price: ₹{{ maxPrice() }}</label>
            <input class="form-range mb-3" type="range" min="500" max="5000" step="100" [ngModel]="maxPrice()" (ngModelChange)="maxPrice.set(+$event); page.set(1)">
            <label class="toggle"><input type="checkbox" [ngModel]="availableOnly()" (ngModelChange)="availableOnly.set($event); page.set(1)"> Available only</label>
          </div>
        </aside>
        <div class="col-lg-9">
          <div class="row g-4">
            @for (product of pageProducts(); track product.id) {
              <div class="col-sm-6 col-xl-4"><app-product-card [product]="product" /></div>
            } @empty {
              <div class="col-12"><div class="surface empty">No equipment matches those filters.</div></div>
            }
          </div>
          <div class="pagination-bar">
            <button (click)="page.set(page() - 1)" [disabled]="page() === 1">Previous</button>
            <span>Page {{ page() }} of {{ totalPages() }}</span>
            <button (click)="page.set(page() + 1)" [disabled]="page() === totalPages()">Next</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .sort { max-width: 230px; }
    .filters { padding: 1rem; position: sticky; top: 92px; }
    .form-label, .toggle { color: #171717; font-weight: 800; }
    .toggle { align-items: center; display: flex; gap: .5rem; }
    .empty { padding: 2rem; text-align: center; }
    .pagination-bar { align-items: center; display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; }
    .pagination-bar button { background: #fff; border: 1px solid rgba(216,164,59,.65); border-radius: 5%; color: #171717; font-weight: 800; padding: .6rem 1rem; }
    .pagination-bar button:disabled { opacity: .45; }
  `]
})
export class CataloguePageComponent {
  private readonly productService = inject(ProductService);
  readonly query = signal('');
  readonly category = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('category') ?? '');
  readonly brand = signal('');
  readonly maxPrice = signal(5000);
  readonly availableOnly = signal(false);
  readonly sort = signal('popular');
  readonly page = signal(1);
  readonly categories = this.productService.categories;
  readonly products = signal<Product[]>([]);
  readonly brands = computed(() => [...new Set(this.products().map((item) => item.brand))]);
  readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    return this.products()
      .filter((item) => !q || item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q))
      .filter((item) => !this.category() || item.category === this.category())
      .filter((item) => !this.brand() || item.brand === this.brand())
      .filter((item) => item.dailyPrice <= this.maxPrice())
      .filter((item) => !this.availableOnly() || item.available)
      .sort((a, b) => this.sort() === 'low' ? a.dailyPrice - b.dailyPrice : this.sort() === 'high' ? b.dailyPrice - a.dailyPrice : this.sort() === 'newest' ? b.createdAt.localeCompare(a.createdAt) : b.popularity - a.popularity);
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / 6)));
  readonly pageProducts = computed(() => this.filtered().slice((this.page() - 1) * 6, this.page() * 6));

  constructor() {
    this.productService.getProducts().subscribe((products) => this.products.set(products));
  }
}
