import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminProductRequest, AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

type ProductStatus = 'Available' | 'Unavailable' | 'Maintenance';

@Component({
  selector: 'app-admin-product-create-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Add inventory" />
    <section class="container product-create-page">
      @if (authService.isAdmin()) {
        <div class="page-head surface">
          <div>
            <p class="eyebrow">Inventory</p>
            <h1>Add product</h1>
          </div>
          <a routerLink="/admin" class="ghost-btn">Back to admin</a>
        </div>

        <form class="surface editor-panel" [formGroup]="productForm" (ngSubmit)="saveProduct()">
          <div class="panel-head">
            <h2>Product details</h2>
            <button type="button" class="link-btn" (click)="resetProductForm()">Reset</button>
          </div>
          @if (productFormError) {
            <p class="form-alert" role="alert">{{ productFormError }}</p>
          }
          <div class="form-grid">
            <label>Name<input formControlName="name"></label>
            <label>Brand<input formControlName="brand"></label>
            <label>Category<input formControlName="category"></label>
            <label>Status<select formControlName="status"><option>Available</option><option>Unavailable</option><option>Maintenance</option></select></label>
            <label>Daily price<input type="number" formControlName="dailyPrice"></label>
            <label>Weekly price<input type="number" formControlName="weeklyPrice"></label>
            <label>Stock<input type="number" formControlName="stock"></label>
            <label>Image URL<input formControlName="image"></label>
            <label>Warranty date<input type="date" formControlName="warrantyDate"></label>
            <label>Invoice URL<input formControlName="invoiceUrl"></label>
          </div>
          <label>Description<textarea formControlName="description"></textarea></label>
          <label>Specifications<textarea formControlName="specifications" placeholder="Sensor: 45MP, Video: 8K RAW"></textarea></label>
          <button type="submit" class="primary-btn wide" [disabled]="isSubmitting">{{ isSubmitting ? 'Adding...' : 'Add product' }}</button>
        </form>
      } @else {
        <div class="surface access-card">
          <p class="eyebrow">Admin access</p>
          <h1>Please log in as admin to add inventory.</h1>
          <a routerLink="/login" class="primary-btn">Go to login</a>
        </div>
      }
    </section>
  `,
  styles: [`
    .product-create-page { max-width: 95vw !important; padding-bottom: 2rem; }
    .surface { background: #fff; border: 1px solid rgba(17,17,17,.09); border-radius: 8px; box-shadow: 0 18px 45px rgba(17,17,17,.06); }
    .page-head { align-items: end; background: linear-gradient(180deg, #fff, #faf9f6); display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 1.25rem; padding: 1.15rem 1.2rem; }
    .eyebrow { color: #ff9700; font-size: clamp(1rem, 1.5vw, 1.18rem); font-weight: 900; letter-spacing: .08em; margin: 0 0 .25rem; text-transform: uppercase; }
    h1 { font-size: clamp(2rem, 4vw, 3rem); line-height: 1; margin: 0; }
    h2 { font-size: 1.05rem; margin: 0; }
    .editor-panel, .access-card { display: grid; gap: 1rem; padding: 1.05rem; }
    .panel-head { align-items: center; display: flex; gap: 1rem; justify-content: space-between; }
    .form-grid { display: grid; gap: .9rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    label { color: #111; display: grid; font-size: .78rem; font-weight: 900; gap: .4rem; }
    input, select, textarea { background: #fff; border: 1px solid rgba(17,17,17,.09); border-radius: 6px; color: #141414; font: inherit; min-height: 42px; outline: 0; padding: .68rem .8rem; width: 100%; }
    textarea { min-height: 92px; resize: vertical; }
    input:focus, select:focus, textarea:focus { border-color: #ff9700; box-shadow: 0 0 0 3px rgba(255,151,0,.14); }
    .primary-btn, .ghost-btn, .link-btn { align-items: center; border-radius: 999px; cursor: pointer; display: inline-flex; font-weight: 900; justify-content: center; text-decoration: none; transition: transform .25s ease, background .25s ease, color .25s ease, box-shadow .25s ease; white-space: nowrap; }
    .primary-btn { background: #111; border: 0; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; min-height: 50px; padding: .85rem 1.25rem; }
    .primary-btn:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .ghost-btn, .link-btn { background: #fff; border: 1px solid rgba(17,17,17,.12); box-shadow: 0 8px 22px rgba(0,0,0,.06); color: #111; min-height: 44px; padding: .72rem 1rem; }
    .ghost-btn:hover, .link-btn:hover { background: #111; color: #fff; transform: translateY(-2px); }
    .link-btn { font-size: .78rem; min-height: 34px; padding: .48rem .78rem; }
    .wide { width: 100%; }
    .form-alert { background: #fff4f2; border: 1px solid rgba(180,35,24,.24); border-radius: 6px; color: #b42318; font-size: .9rem; font-weight: 800; line-height: 1.45; margin: 0; padding: .85rem 1rem; }
    .access-card { margin: 0 auto; max-width: 680px; text-align: center; }
    .access-card h1 { font-size: clamp(2rem, 5vw, 4rem); line-height: .96; }
    button:disabled, button:disabled:hover { cursor: not-allowed; opacity: .55; transform: none; }
    @media (max-width: 900px) {
      .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .page-head { align-items: stretch; flex-direction: column; }
      .form-grid { grid-template-columns: 1fr; }
      .ghost-btn { width: 100%; }
    }
  `]
})
export class AdminProductCreatePageComponent {
  readonly authService = inject(AuthService);

  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  productFormError = '';
  isSubmitting = false;

  readonly productForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    brand: ['', Validators.required],
    category: ['', Validators.required],
    status: ['Available' as ProductStatus, Validators.required],
    dailyPrice: [0, [Validators.required, Validators.min(1)]],
    weeklyPrice: [0, [Validators.required, Validators.min(1)]],
    stock: [1, [Validators.required, Validators.min(0)]],
    image: ['', Validators.required],
    warrantyDate: [''],
    invoiceUrl: [''],
    description: ['', Validators.required],
    specifications: ['']
  });

  saveProduct(): void {
    this.productFormError = '';
    if (this.productForm.invalid || this.isSubmitting) {
      this.productForm.markAllAsTouched();
      this.productFormError = 'Complete all required product fields.';
      return;
    }

    this.isSubmitting = true;
    this.adminService.createProduct(this.productRequestFromForm()).subscribe({
      next: () => this.router.navigateByUrl('/admin'),
      error: (error) => {
        this.isSubmitting = false;
        this.productFormError = this.authService.getErrorMessage(error);
      }
    });
  }

  resetProductForm(): void {
    this.productFormError = '';
    this.productForm.reset({
      name: '',
      brand: '',
      category: '',
      status: 'Available',
      dailyPrice: 0,
      weeklyPrice: 0,
      stock: 1,
      image: '',
      warrantyDate: '',
      invoiceUrl: '',
      description: '',
      specifications: ''
    });
  }

  private productRequestFromForm(): AdminProductRequest {
    const value = this.productForm.getRawValue();
    return {
      name: value.name,
      brand: value.brand,
      category: this.categoryToApi(value.category),
      shortDescription: value.description,
      fullDescription: value.description,
      specs: value.specifications,
      dailyPrice: value.dailyPrice,
      weeklyPrice: value.weeklyPrice,
      warrantyDate: value.warrantyDate || undefined,
      invoiceUrl: value.invoiceUrl || undefined,
      availabilityStatus: this.productStatusToApi(value.status),
      images: value.image ? [value.image] : []
    };
  }

  private categoryToApi(category: string): string {
    const labels: Record<string, string> = {
      Cameras: 'CAMERAS',
      Lenses: 'LENSES',
      Lighting: 'LIGHTING',
      'Audio Equipment': 'AUDIO',
      Audio: 'AUDIO',
      Tripods: 'TRIPODS_SUPPORT',
      Accessories: 'ACCESSORIES'
    };
    return labels[category] ?? category.trim().toUpperCase().replace(/\s+/g, '_');
  }

  private productStatusToApi(status: ProductStatus): string {
    if (status === 'Maintenance') return 'MAINTENANCE';
    if (status === 'Available') return 'AVAILABLE';
    return 'UNAVAILABLE';
  }
}
