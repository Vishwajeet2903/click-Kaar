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
      </div>
      <div class="row g-4">
        <aside class="col-lg-3">
          <div class="surface filters">
            <div class="filter-head">
              <div>
                <p class="eyebrow mb-1">Filters</p>
                <h2>Refine gear</h2>
              </div>
              <button type="button" class="reset" (click)="resetFilters()" [disabled]="activeFilters() === 0">Reset</button>
            </div>
            <p class="filter-count">{{ filtered().length }} items found</p>
            <div class="filter-group">
              <label class="form-label" for="catalogue-search">Search</label>
              <input id="catalogue-search" class="form-control" placeholder="Search gear or brand" [ngModel]="query()" (ngModelChange)="query.set($event); page.set(1)">
            </div>
            <div class="filter-group">
              <label class="form-label" for="catalogue-category">Category</label>
              <select id="catalogue-category" class="form-select" [ngModel]="category()" (ngModelChange)="setCategory($event)">
                <option value="">All categories</option>
                @for (item of categories(); track item) { <option [value]="item">{{ item }}</option> }
              </select>
            </div>
            <div class="filter-group">
              <label class="form-label" for="catalogue-brand">Brand</label>
              <select id="catalogue-brand" class="form-select" [ngModel]="brand()" (ngModelChange)="brand.set($event); page.set(1)">
                <option value="">All brands</option>
                @for (item of brands(); track item) { <option [value]="item">{{ item }}</option> }
              </select>
            </div>
            <!-- <label class="toggle"><input type="checkbox" [ngModel]="availableOnly()" (ngModelChange)="availableOnly.set($event); page.set(1)"> Available only</label> -->
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
    :host ::ng-deep .section-title { font-size: clamp(2rem, 4.2vw, 3.8rem); letter-spacing: 0; line-height: 1.08; text-align: left; }
    .eyebrow { font-size: .92rem; letter-spacing: .1em; line-height: 1.2; }
    .form-control::placeholder{color: #777}
    .filters { display: grid; gap: 1rem; padding: 1rem; position: sticky; top: 92px; }
    .filter-head { align-items: center; display: flex; gap: 1rem; justify-content: space-between; }
    .filter-head h2 { font-size: 1.08rem; letter-spacing: 0; line-height: 1.2; margin: 0; }
    .reset { background: #fff; border: 1px solid rgba(17,17,17,.12); border-radius: 999px; color: #111; font-size: .82rem; font-weight: 800; min-height: 38px; padding: .45rem .8rem; transition: transform .25s ease, border-color .25s ease, background .25s ease, color .25s ease; }
    .reset:hover:not(:disabled) { background: #111; border-color: #111; color: #fff; transform: translateY(-2px); }
    .reset:disabled { cursor: not-allowed; opacity: .45; }
    .filter-count { background: #fff; border-radius: 999px; color: #171717; font-size: .84rem; font-weight: 700; line-height: 1.35; margin: 0; padding: .55rem .75rem; text-align: center; }
    .filter-group { display: grid; gap: .45rem; }
    .form-label, .toggle { color: #171717; font-size: .88rem; font-weight: 700; line-height: 1.35; margin: 0; }
    .form-control, .form-select { color: #171717; font-size: .9rem; font-weight: 500; line-height: 1.45; }
    .toggle { align-items: center; display: flex; gap: .5rem; }
    .toggle input { accent-color: #ff9700; height: 18px; width: 18px; }
    .empty { padding: 2rem; text-align: center; }
    .pagination-bar { align-items: center; display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; }
    .pagination-bar button { background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; font-size: .96rem; font-weight: 800; min-height: 50px; padding: .85rem 1.25rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; }
    .pagination-bar span { color: #333; font-size: .95rem; font-weight: 600; line-height: 1.4; }
    .pagination-bar button:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .pagination-bar button:disabled, .pagination-bar button:disabled:hover { background: #111; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; cursor: not-allowed; opacity: .45; transform: none; }
  `]
})
export class CataloguePageComponent {
  private readonly productService = inject(ProductService);
  readonly query = signal('');
  readonly category = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('category') ?? '');
  readonly brand = signal('');
  readonly availableOnly = signal(false);
  readonly page = signal(1);
  readonly categories = this.productService.categories;
  readonly products = signal<Product[]>([]);
  readonly catalogueProducts = computed(() => this.products().filter((item) => item.availabilityStatus !== 'MAINTENANCE'));
  readonly brands = computed(() => {
    const selectedCategory = this.category();
    return [...new Set(this.catalogueProducts()
      .filter((item) => !selectedCategory || item.category === selectedCategory)
      .map((item) => item.brand))];
  });
  readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    return this.catalogueProducts()
      .filter((item) => !q || item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q))
      .filter((item) => !this.category() || item.category === this.category())
      .filter((item) => !this.brand() || item.brand === this.brand())
      .filter((item) => !this.availableOnly() || item.available);
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / 6)));
  readonly pageProducts = computed(() => this.filtered().slice((this.page() - 1) * 6, this.page() * 6));
  readonly activeFilters = computed(() => [
    this.query(),
    this.category(),
    this.brand(),
    this.availableOnly()
  ].filter(Boolean).length);

  constructor() {
    this.productService.getProducts().subscribe((products) => this.products.set(products));
  }

  resetFilters(): void {
    this.query.set('');
    this.category.set('');
    this.brand.set('');
    this.availableOnly.set(false);
    this.page.set(1);
  }

  setCategory(category: string): void {
    this.category.set(category);
    this.brand.set('');
    this.page.set(1);
  }
}
