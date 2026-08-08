import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../models/product.model';
import { AdminProductRequest, AdminProductResponse, AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';
import { ProductCardComponent } from '../shared/components/product-card.component';

type ProductStatus = 'Available' | 'Unavailable' | 'Maintenance';

@Component({
  selector: 'app-admin-product-create-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, BreadcrumbComponent, ProductCardComponent],
  template: `
    <app-breadcrumb [label]="pageLabel()" />
    <section class="container product-create-page">
      @if (canManageInventory()) {
        <div class="page-head surface">
          <div>
            <p class="eyebrow">Inventory</p>
            <h1>{{ pageTitle() }}</h1>
          </div>
          <a routerLink="/admin" class="ghost-btn">Back to admin</a>
        </div>

        <div class="editor-layout">
          <form class="surface editor-panel" [formGroup]="productForm" (ngSubmit)="saveProduct()">
            <div class="panel-head">
              <h2>Product details</h2>
              <button type="button" class="link-btn" (click)="resetProductForm()">{{ isEditMode() ? 'Restore' : 'Reset' }}</button>
            </div>
            @if (isLoadingProduct) {
              <p class="muted">Loading product details...</p>
            }
            @if (productFormError) {
              <p class="form-alert" role="alert">{{ productFormError }}</p>
            }
            <div class="form-grid">
              <label>Name<input formControlName="name"></label>
              <label>Brand<input formControlName="brand"></label>
              <label>Category<select formControlName="category">
                <option value="">Select category</option>
                @for (category of categories; track category) {
                  <option [value]="category">{{ category }}</option>
                }
              </select></label>
              <label>Status<select formControlName="status"><option>Available</option><option>Unavailable</option><option>Maintenance</option></select></label>
              <label>Daily price<input type="number" formControlName="dailyPrice"></label>
              <label>Weekly price<input type="number" formControlName="weeklyPrice"></label>
              <label>Stock<input type="number" formControlName="stock"></label>
              <label class="file-field">Product image<input type="file" accept="image/*" (change)="setProductImage($event)"><span>{{ productImageLabel() }}</span></label>
              <label>Warranty date<input type="date" formControlName="warrantyDate"></label>
              <label>Invoice URL<input formControlName="invoiceUrl"></label>
            </div>
            <label>Description<textarea formControlName="description"></textarea></label>
            <div class="spec-section">
              <h2>Specifications</h2>
              <div class="spec-grid">
                @for (field of visibleSpecificationFields(); track field.control) {
                  <label>{{ field.label }}<input [formControlName]="field.control"></label>
                }
              </div>
              <label>Other specifications<textarea formControlName="specOther" placeholder="Add one specification per line, like Filter thread: 82mm"></textarea></label>
            </div>
            <div class="form-actions">
              <button type="button" class="ghost-btn" (click)="openPreview()">Preview</button>
              <button type="submit" class="primary-btn" [disabled]="isSubmitting || isLoadingProduct">{{ submitLabel() }}</button>
            </div>
          </form>
          @if (showPreview()) {
            <section class="surface preview-panel" id="productPreviewPanel" tabindex="-1">
              <div class="panel-head">
                <h2>Product preview</h2>
                <button type="button" class="link-btn" (click)="showPreview.set(false)">Hide</button>
              </div>
              <div class="preview-card-wrap">
                <app-product-card [product]="previewProduct()" />
              </div>
            </section>
          }
        </div>
      } @else {
        <div class="surface access-card">
          <p class="eyebrow">Admin access</p>
          <h1>Please log in as admin to manage inventory.</h1>
          <a routerLink="/login" class="primary-btn">Go to login</a>
        </div>
      }
    </section>
  `,
  styles: [`
    :host ::ng-deep section.container.product-create-page { border-radius: 32px !important; overflow: hidden; }
    .product-create-page { max-width: 95vw !important; padding-bottom: 2rem; }
    .surface { background: #fff; border: 1px solid rgba(17,17,17,.09); border-radius: 8px; box-shadow: 0 18px 45px rgba(17,17,17,.06); }
    .page-head { align-items: end; background: linear-gradient(180deg, #fff, #faf9f6); display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 1.25rem; padding: 1.15rem 1.2rem; }
    .eyebrow { color: #ff9700; font-size: clamp(1rem, 1.5vw, 1.18rem); font-weight: 900; letter-spacing: .08em; margin: 0 0 .25rem; text-transform: uppercase; }
    h1 { font-size: clamp(2rem, 4vw, 3rem); line-height: 1; margin: 0; }
    h2 { font-size: 1.05rem; margin: 0; }
    .editor-layout { align-items: start; display: grid; gap: 1.25rem; grid-template-columns: minmax(0, 1fr) minmax(280px, 360px); }
    .editor-panel, .access-card, .preview-panel { display: grid; gap: 1rem; padding: 1.05rem; }
    .panel-head { align-items: center; display: flex; gap: 1rem; justify-content: space-between; }
    .form-grid { display: grid; gap: .9rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .spec-section { display: grid; gap: .75rem; }
    .spec-grid { display: grid; gap: .9rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    label { color: #111; display: grid; font-size: .78rem; font-weight: 900; gap: .4rem; }
    input, select, textarea { background: #fff; border: 1px solid rgba(17,17,17,.09); border-radius: 6px; color: #141414; font: inherit; min-height: 42px; outline: 0; padding: .68rem .8rem; width: 100%; }
    .file-field input { display: none; }
    .file-field span { align-items: center; background: #fff; border: 1px dashed rgba(17,17,17,.18); border-radius: 6px; color: #555; display: flex; min-height: 42px; padding: .68rem .8rem; }
    textarea { min-height: 92px; resize: vertical; }
    input:focus, select:focus, textarea:focus { border-color: #ff9700; box-shadow: 0 0 0 3px rgba(255,151,0,.14); }
    .primary-btn, .ghost-btn, .link-btn { align-items: center; border-radius: 999px; cursor: pointer; display: inline-flex; font-weight: 900; justify-content: center; text-decoration: none; transition: transform .25s ease, background .25s ease, color .25s ease, box-shadow .25s ease; white-space: nowrap; }
    .primary-btn { background: #111; border: 0; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; min-height: 50px; padding: .85rem 1.25rem; }
    .primary-btn:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #fff; transform: translateY(-2px); }
    .ghost-btn, .link-btn { background: #fff; border: 1px solid rgba(17,17,17,.12); box-shadow: 0 8px 22px rgba(0,0,0,.06); color: #111; min-height: 44px; padding: .72rem 1rem; }
    .ghost-btn:hover, .link-btn:hover { background: #111; color: #fff; transform: translateY(-2px); }
    .link-btn { font-size: .78rem; min-height: 34px; padding: .48rem .78rem; }
    .wide { width: 100%; }
    .form-actions { display: grid; gap: .75rem; grid-template-columns: minmax(120px, .35fr) minmax(160px, .65fr); }
    .preview-card-wrap { max-width: 360px; }
    .preview-panel { outline: none; position: sticky; top: 92px; }
    .preview-panel:focus-visible { box-shadow: 0 0 0 4px rgba(255,151,0,.24), 0 18px 45px rgba(17,17,17,.06); }
    .muted { color: #777; font-size: .9rem; font-weight: 800; margin: 0; }
    .form-alert { background: #fff4f2; border: 1px solid rgba(180,35,24,.24); border-radius: 6px; color: #b42318; font-size: .9rem; font-weight: 800; line-height: 1.45; margin: 0; padding: .85rem 1rem; }
    .access-card { margin: 0 auto; max-width: 680px; text-align: center; }
    .access-card h1 { font-size: clamp(2rem, 5vw, 4rem); line-height: .96; }
    button:disabled, button:disabled:hover { cursor: not-allowed; opacity: .55; transform: none; }
    @media (max-width: 900px) {
      .editor-layout { grid-template-columns: 1fr; }
      .form-grid, .spec-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .preview-panel { position: static; }
    }
    @media (max-width: 640px) {
      .page-head { align-items: stretch; flex-direction: column; }
      .form-grid, .spec-grid { grid-template-columns: 1fr; }
      .form-actions { grid-template-columns: 1fr; }
      .ghost-btn { width: 100%; }
    }
  `]
})
export class AdminProductCreatePageComponent implements OnInit {
  readonly authService = inject(AuthService);

  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  productFormError = '';
  isSubmitting = false;
  isLoadingProduct = false;
  selectedProductImage?: File;
  selectedProductPreviewUrl = '';
  readonly showPreview = signal(false);
  private readonly editingProduct = signal<AdminProductResponse | undefined>(undefined);

  readonly isEditMode = computed(() => !!this.editingProductId);
  readonly pageLabel = computed(() => this.isEditMode() ? 'Edit inventory' : 'Add inventory');
  readonly pageTitle = computed(() => this.isEditMode() ? 'Edit product' : 'Add product');
  readonly submitLabel = computed(() => {
    if (this.isSubmitting) {
      return this.isEditMode() ? 'Saving...' : 'Adding...';
    }
    return this.isEditMode() ? 'Save changes' : 'Add product';
  });
  previewProduct(): Product {
    const value = this.productForm.getRawValue();
    const image = this.selectedProductPreviewUrl || value.image || '/clickkaar-logo.png';
    return {
      id: this.editingProductId ?? 0,
      name: value.name || 'Product name',
      brand: value.brand || 'Brand',
      category: value.category || 'Category',
      image,
      gallery: [image],
      description: value.description || 'Product description preview.',
      specifications: this.parseSpecifications(this.buildSpecifications(value)),
      dailyPrice: Number(value.dailyPrice) || 0,
      weeklyPrice: Number(value.weeklyPrice) || 0,
      warrantyDate: value.warrantyDate,
      invoiceUrl: value.invoiceUrl,
      available: value.status === 'Available',
      rating: 0,
      stock: Number(value.stock) || 0,
      popularity: 0,
      createdAt: new Date().toISOString()
    };
  }
  editingProductId?: number;
  readonly categories = ['Cameras', 'Lenses', 'Lighting', 'Audio Equipment', 'Tripods', 'Accessories'];
  readonly categorySpecificationControls: Record<string, readonly string[]> = {
    Cameras: [
      'specCameraType', 'specSensor', 'specVideo', 'specMount', 'specStabilization', 'specProfiles', 'specSlots',
      'specTotalPixels', 'specEffectivePixels', 'specOpticalLowPass', 'specImageSize', 'specRecognitionStill',
      'specRecognitionMovies', 'specWirelessLan', 'specBluetooth', 'specWeight', 'specOperatingTemperature'
    ],
    Lenses: [
      'specMount', 'specAperture', 'specMinimumAperture', 'specRange', 'specFilterDiameter', 'specFormat',
      'specDimension', 'specElements', 'specFocus', 'specWeatherSealed', 'specWeight'
    ],
    Lighting: [
      'specOutput', 'specColor', 'specControl', 'specPower', 'specBattery', 'specRuntime', 'specTlci', 'specCri',
      'specBrightnessRange', 'specBluetoothControlDistance', 'specWorkingEnvironmentTemperature', 'specDimension', 'specWeight'
    ],
    'Audio Equipment': [
      'specChannels', 'specRecording', 'specRange', 'specBattery', 'specRuntime', 'specPower', 'specControl',
      'specFeatures', 'specDimension', 'specWeight'
    ],
    Tripods: [
      'specPayload', 'specHead', 'specLegs', 'specPlate', 'specAxis', 'specFeatures', 'specDimension', 'specWeight'
    ],
    Accessories: [
      'specPayload', 'specAxis', 'specRuntime', 'specFeatures', 'specFilterType', 'specThreadSize', 'specFilterFactor',
      'specColorShift', 'specGlassMaterial', 'specFrameMaterial', 'specFrameThickness', 'specExactWeight', 'specGroup',
      'specId', 'specFormat', 'specDimension', 'specWeight', 'specPower', 'specControl'
    ]
  };
  readonly specificationFields = [
    { control: 'specCameraType', label: 'Camera Type' },
    { control: 'specSensor', label: 'Sensor', aliases: ['Sensor Type'] },
    { control: 'specVideo', label: 'Video', aliases: ['Video Compression'] },
    { control: 'specMount', label: 'Mount', aliases: ['lens Mount'] },
    { control: 'specAperture', label: 'Aperture', aliases: ['Maximum Aperture'] },
    { control: 'specRange', label: 'Range', aliases: ['Focal Length (MM)', 'Focal Length'] },
    { control: 'specStabilization', label: 'Stabilization' },
    { control: 'specProfiles', label: 'Profiles' },
    { control: 'specSlots', label: 'Slots', aliases: ['Memory Card Slot'] },
    { control: 'specWeatherSealed', label: 'WeatherSealed', aliases: ['Weather sealed'] },
    { control: 'specElements', label: 'Elements' },
    { control: 'specFocus', label: 'Focus', aliases: ['Focus Type', 'Minimum Focus Distance'] },
    { control: 'specOutput', label: 'Output', aliases: ['Output Power'] },
    { control: 'specColor', label: 'Color', aliases: ['Colour Temperature Range', 'CCT'] },
    { control: 'specControl', label: 'Control', aliases: ['Control Method'] },
    { control: 'specPower', label: 'Power', aliases: ['Power Supply'] },
    { control: 'specChannels', label: 'Channels', aliases: ['Channel'] },
    { control: 'specRecording', label: 'Recording', aliases: ['Recoarding Format', 'Recording Format'] },
    { control: 'specBattery', label: 'Battery' },
    { control: 'specPayload', label: 'Payload' },
    { control: 'specHead', label: 'Head' },
    { control: 'specLegs', label: 'Legs' },
    { control: 'specPlate', label: 'Plate' },
    { control: 'specAxis', label: 'Axis' },
    { control: 'specRuntime', label: 'Runtime' },
    { control: 'specFeatures', label: 'Features' },
    { control: 'specTotalPixels', label: 'Number of Pixels (Total)' },
    { control: 'specEffectivePixels', label: 'Number of Pixels (Effective)' },
    { control: 'specOpticalLowPass', label: 'Optial Low-Pass Filter' },
    { control: 'specImageSize', label: 'Image Size (Pixels)' },
    { control: 'specRecognitionStill', label: 'Recogmition Target (Still Images)' },
    { control: 'specRecognitionMovies', label: 'Recogmition Target (Movies)' },
    { control: 'specWirelessLan', label: 'WIireless Lan' },
    { control: 'specBluetooth', label: 'Bluetooth' },
    { control: 'specWeight', label: 'Weight', aliases: ['Weight (With Battery And Memory Card Included)'] },
    { control: 'specOperatingTemperature', label: 'Operating Tempereture' },
    { control: 'specMinimumAperture', label: 'Minimum Aperture' },
    { control: 'specFilterDiameter', label: 'Filter Diameter (MM)' },
    { control: 'specFormat', label: 'Format' },
    { control: 'specDimension', label: 'Dimension', aliases: ['Dimention'] },
    { control: 'specFilterType', label: 'Filter Type' },
    { control: 'specThreadSize', label: 'Thread Size (Diameter)' },
    { control: 'specFilterFactor', label: 'Filter Factor / Stop Reduction' },
    { control: 'specColorShift', label: 'Color Shift' },
    { control: 'specGlassMaterial', label: 'Glass Material' },
    { control: 'specFrameMaterial', label: 'Frame Material' },
    { control: 'specFrameThickness', label: 'Frame Thickness / Profile' },
    { control: 'specExactWeight', label: 'Exact Weight' },
    { control: 'specTlci', label: 'TLCI' },
    { control: 'specCri', label: 'CRI' },
    { control: 'specBrightnessRange', label: 'Brightness Range' },
    { control: 'specGroup', label: 'Group' },
    { control: 'specId', label: 'ID' },
    { control: 'specBluetoothControlDistance', label: 'Bluetooth Control Distance' },
    { control: 'specWorkingEnvironmentTemperature', label: 'Working Environment Temperature' }
  ] as const;

  visibleSpecificationFields(): readonly (typeof this.specificationFields[number])[] {
    const category = this.productForm.controls.category.value;
    const controls = this.categorySpecificationControls[category];
    if (!controls) {
      return [];
    }
    const allowedControls = new Set(controls);
    return this.specificationFields.filter((field) => allowedControls.has(field.control));
  }
  readonly productForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    brand: ['', Validators.required],
    category: ['', Validators.required],
    status: ['Available' as ProductStatus, Validators.required],
    dailyPrice: [0, [Validators.required, Validators.min(1)]],
    weeklyPrice: [0, [Validators.required, Validators.min(1)]],
    stock: [1, [Validators.required, Validators.min(0)]],
    image: [''],
    warrantyDate: [''],
    invoiceUrl: [''],
    description: ['', Validators.required],
    specCameraType: [''],
    specSensor: [''],
    specVideo: [''],
    specMount: [''],
    specAperture: [''],
    specRange: [''],
    specStabilization: [''],
    specProfiles: [''],
    specSlots: [''],
    specWeatherSealed: [''],
    specElements: [''],
    specFocus: [''],
    specOutput: [''],
    specColor: [''],
    specControl: [''],
    specPower: [''],
    specChannels: [''],
    specRecording: [''],
    specBattery: [''],
    specPayload: [''],
    specHead: [''],
    specLegs: [''],
    specPlate: [''],
    specAxis: [''],
    specRuntime: [''],
    specFeatures: [''],
    specTotalPixels: [''],
    specEffectivePixels: [''],
    specOpticalLowPass: [''],
    specImageSize: [''],
    specRecognitionStill: [''],
    specRecognitionMovies: [''],
    specWirelessLan: [''],
    specBluetooth: [''],
    specWeight: [''],
    specOperatingTemperature: [''],
    specMinimumAperture: [''],
    specFilterDiameter: [''],
    specFormat: [''],
    specDimension: [''],
    specFilterType: [''],
    specThreadSize: [''],
    specFilterFactor: [''],
    specColorShift: [''],
    specGlassMaterial: [''],
    specFrameMaterial: [''],
    specFrameThickness: [''],
    specExactWeight: [''],
    specTlci: [''],
    specCri: [''],
    specBrightnessRange: [''],
    specGroup: [''],
    specId: [''],
    specBluetoothControlDistance: [''],
    specWorkingEnvironmentTemperature: [''],
    specOther: ['']
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    const productId = Number(idParam);
    if (!Number.isInteger(productId) || productId <= 0) {
      this.productFormError = 'Invalid product selected.';
      return;
    }

    this.editingProductId = productId;
    this.loadProductForEdit(productId);
  }

  saveProduct(): void {
    this.productFormError = '';
    if (this.productForm.invalid || this.isSubmitting || (!this.productForm.controls.image.value && !this.selectedProductImage)) {
      this.productForm.markAllAsTouched();
      this.productFormError = 'Complete all required product fields and choose a product image.';
      return;
    }

    this.isSubmitting = true;
    if (this.selectedProductImage) {
      const request = this.productRequestFromForm();
      const saveRequest = this.editingProductId
        ? this.adminService.updateProductWithImage(this.editingProductId, request, this.selectedProductImage)
        : this.adminService.createProductWithImage(request, this.selectedProductImage);
      saveRequest.subscribe({
        next: () => this.router.navigateByUrl('/admin'),
        error: (error) => {
          this.isSubmitting = false;
          this.productFormError = this.authService.getErrorMessage(error);
        }
      });
      return;
    }

    this.submitProductRequest();
  }

  setProductImage(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (this.selectedProductPreviewUrl) {
      URL.revokeObjectURL(this.selectedProductPreviewUrl);
      this.selectedProductPreviewUrl = '';
    }
    this.selectedProductImage = input?.files?.[0];
    if (this.selectedProductImage) {
      this.selectedProductPreviewUrl = URL.createObjectURL(this.selectedProductImage);
    }
  }

  productImageLabel(): string {
    return this.selectedProductImage?.name || (this.productForm.controls.image.value ? 'Current image selected' : 'Choose image');
  }

  openPreview(): void {
    this.showPreview.set(true);
    window.setTimeout(() => {
      const target = document.getElementById('productPreviewPanel');
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private submitProductRequest(): void {
    const request = this.productRequestFromForm();
    const saveRequest = this.editingProductId
      ? this.adminService.updateProduct(this.editingProductId, request)
      : this.adminService.createProduct(request);

    saveRequest.subscribe({
      next: () => this.router.navigateByUrl('/admin'),
      error: (error) => {
        this.isSubmitting = false;
        this.productFormError = this.authService.getErrorMessage(error);
      }
    });
  }

  canManageInventory(): boolean {
    return this.authService.hasRole('ADMIN') || this.authService.hasRole('MANAGER') || this.authService.hasRole('INVENTORY_STAFF');
  }

  resetProductForm(): void {
    this.productFormError = '';
    this.selectedProductImage = undefined;
    if (this.selectedProductPreviewUrl) {
      URL.revokeObjectURL(this.selectedProductPreviewUrl);
      this.selectedProductPreviewUrl = '';
    }
    const product = this.editingProduct();
    if (product) {
      this.patchFormFromProduct(product);
      return;
    }

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
      specCameraType: '',
      specSensor: '',
      specVideo: '',
      specMount: '',
      specAperture: '',
      specRange: '',
      specStabilization: '',
      specProfiles: '',
      specSlots: '',
      specWeatherSealed: '',
      specElements: '',
      specFocus: '',
      specOutput: '',
      specColor: '',
      specControl: '',
      specPower: '',
      specChannels: '',
      specRecording: '',
      specBattery: '',
      specPayload: '',
      specHead: '',
      specLegs: '',
      specPlate: '',
      specAxis: '',
      specRuntime: '',
      specFeatures: '',
      specTotalPixels: '',
      specEffectivePixels: '',
      specOpticalLowPass: '',
      specImageSize: '',
      specRecognitionStill: '',
      specRecognitionMovies: '',
      specWirelessLan: '',
      specBluetooth: '',
      specWeight: '',
      specOperatingTemperature: '',
      specMinimumAperture: '',
      specFilterDiameter: '',
      specFormat: '',
      specDimension: '',
      specFilterType: '',
      specThreadSize: '',
      specFilterFactor: '',
      specColorShift: '',
      specGlassMaterial: '',
      specFrameMaterial: '',
      specFrameThickness: '',
      specExactWeight: '',
      specTlci: '',
      specCri: '',
      specBrightnessRange: '',
      specGroup: '',
      specId: '',
      specBluetoothControlDistance: '',
      specWorkingEnvironmentTemperature: '',
      specOther: ''
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
      specs: this.buildSpecifications(value),
      dailyPrice: value.dailyPrice,
      weeklyPrice: value.weeklyPrice,
      warrantyDate: value.warrantyDate || undefined,
      invoiceUrl: value.invoiceUrl || undefined,
      stock: Number(value.stock) || 0,
      availabilityStatus: this.productStatusToApi(value.status),
      images: value.image ? [value.image] : []
    };
  }

  private loadProductForEdit(productId: number): void {
    this.isLoadingProduct = true;
    this.productForm.disable();
    this.adminService.getInventory().subscribe({
      next: (products) => {
        const product = products.find((item) => item.id === productId);
        if (!product) {
          this.productFormError = 'Product not found in inventory.';
          return;
        }

        this.editingProduct.set(product);
        this.patchFormFromProduct(product);
      },
      error: (error) => {
        this.productFormError = this.authService.getErrorMessage(error);
        this.isLoadingProduct = false;
        this.productForm.enable();
      },
      complete: () => {
        this.isLoadingProduct = false;
        this.productForm.enable();
      }
    });
  }

  private patchFormFromProduct(product: AdminProductResponse): void {
    const image = product.images?.[0] || product.imageLink || product.link1 || product.link2 || '';
    const specs = this.parseSpecifications(product.specs ?? '');
    const mappedSpecKeys = new Set(this.specificationFields.flatMap((field) => this.specKeys(field)));
    const otherSpecifications = Object.entries(specs)
      .filter(([key]) => !mappedSpecKeys.has(this.normalizedSpecKey(key)))
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    this.productForm.reset({
      name: product.name,
      brand: product.brand,
      category: this.categoryFromApi(product.category),
      status: this.productStatusFromApi(product.availabilityStatus),
      dailyPrice: Number(product.dailyPrice),
      weeklyPrice: Number(product.weeklyPrice),
      stock: product.stock ?? (product.availabilityStatus === 'AVAILABLE' ? 1 : 0),
      image,
      warrantyDate: product.warrantyDate ?? '',
      invoiceUrl: product.invoiceUrl ?? '',
      description: product.fullDescription || product.shortDescription || '',
      ...this.specFormValues(specs),
      specOther: otherSpecifications
    });
  }

  private categoryFromApi(category: string): string {
    const labels: Record<string, string> = {
      CAMERAS: 'Cameras',
      LENSES: 'Lenses',
      LIGHTING: 'Lighting',
      AUDIO: 'Audio Equipment',
      TRIPODS_SUPPORT: 'Tripods',
      ACCESSORIES: 'Accessories'
    };
    return labels[category] ?? category;
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

  private productStatusFromApi(status: string): ProductStatus {
    if (status === 'MAINTENANCE') return 'Maintenance';
    if (status === 'AVAILABLE') return 'Available';
    return 'Unavailable';
  }

  private buildSpecifications(value: Record<string, unknown>): string {
    const category = String(value['category'] ?? '');
    const controls = this.categorySpecificationControls[category];
    const fields = controls
      ? this.specificationFields.filter((field) => controls.includes(field.control))
      : this.specificationFields;
    const mappedSpecifications = fields
      .map((field) => [field.label, value[field.control]] as const)
      .filter(([, specValue]) => String(specValue ?? '').trim())
      .map(([key, specValue]) => `${key}: ${String(specValue).trim()}`)
      .join('\n');
    const otherSpecifications = String(value['specOther'] ?? '').trim();

    return [mappedSpecifications, otherSpecifications].filter(Boolean).join('\n');
  }

  private parseSpecifications(value: string): Record<string, string> {
    return value.split(/\r?\n|,\s*(?=[^,:\n]+:)/)
      .map((item) => item.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((specs, item) => {
        const [key, ...rest] = item.split(':');
        if (key && rest.length) {
          specs[key.trim()] = rest.join(':').trim();
        }
        return specs;
      }, {});
  }

  private specFormValues(specs: Record<string, string>): Record<string, string> {
    return this.specificationFields.reduce<Record<string, string>>((values, field) => {
      values[field.control] = this.specValue(specs, field.label, ...('aliases' in field ? field.aliases : []));
      return values;
    }, {});
  }

  private specKeys(field: typeof this.specificationFields[number]): string[] {
    return [field.label, ...('aliases' in field ? field.aliases : [])].map((key) => this.normalizedSpecKey(key));
  }

  private specValue(specs: Record<string, string>, ...keys: string[]): string {
    const entries = Object.entries(specs);
    for (const key of keys) {
      const normalizedKey = this.normalizedSpecKey(key);
      const match = entries.find(([entryKey]) => this.normalizedSpecKey(entryKey) === normalizedKey);
      if (match) {
        return match[1];
      }
    }
    return '';
  }

  private normalizedSpecKey(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
}
