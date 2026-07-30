import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AdminBookingResponse,
  AdminContentResponse,
  AdminCustomerResponse,
  AdminPaymentResponse,
  AdminProductResponse,
  AdminService
} from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-staff-dashboard-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, BreadcrumbComponent],
  template: `
    <app-breadcrumb [label]="dashboardTitle()" />
    <section class="container staff-dashboard">
      <header class="surface hero-panel">
        <div class="hero-copy">
          <p class="eyebrow">{{ roleLabel() }}</p>
          <h1>{{ dashboardTitle() }}</h1>
          <p>{{ dashboardIntro() }}</p>
        </div>
        <button type="button" class="logout-btn" (click)="logout()">Logout</button>
      </header>

      <div class="metric-grid">
        @for (metric of metrics(); track metric.label) {
          <article class="surface metric-card">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <small>{{ metric.note }}</small>
          </article>
        }
      </div>

      @if (canUseInventory()) {
        <section class="surface panel">
          <div class="panel-head">
            <h2>Inventory</h2>
            @if (canEditInventory()) {
              <a routerLink="/admin/inventory/new">Add product</a>
            }
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Category</th><th>Daily price</th><th>Status</th></tr></thead>
              <tbody>
                @for (product of pagedInventory(); track product.id) {
                  <tr>
                    <td><strong>{{ product.name }}</strong><span>{{ product.brand }}</span></td>
                    <td>{{ product.category }}</td>
                    <td>{{ product.dailyPrice | currency:'INR':'symbol':'1.0-0' }}</td>
                    <td>{{ product.availabilityStatus }}</td>
                  </tr>
                }
                @if (!inventory().length) {
                  <tr><td colspan="4" class="empty-cell">No inventory items found.</td></tr>
                }
              </tbody>
            </table>
          </div>
          @if (inventory().length > inventoryPageSize) {
            <div class="pager">
              <span>{{ inventoryPageSummary() }}</span>
              <div>
                <button type="button" [disabled]="inventoryPage() === 1" (click)="changeInventoryPage(-1)">Previous</button>
                <button type="button" [disabled]="inventoryPage() === inventoryPageCount()" (click)="changeInventoryPage(1)">Next</button>
              </div>
            </div>
          }
        </section>
      }

      @if (canUseBookings()) {
        <section class="surface panel">
          <div class="panel-head"><h2>Bookings</h2><span>{{ bookings().length }} total</span></div>
          <div class="list-grid">
            @for (booking of bookings().slice(0, 4); track booking.id) {
              <article>
                <strong>{{ booking.bookingNumber }}</strong>
                <span>{{ booking.customer }} - {{ booking.products.join(', ') }}</span>
                <small>{{ booking.startDate | date:'mediumDate' }} to {{ booking.endDate | date:'mediumDate' }}</small>
              </article>
            }
          </div>
        </section>
      }

      @if (canUseCustomers()) {
        <section class="surface panel">
          <div class="panel-head"><h2>Customers</h2><span>{{ customers().length }} listed</span></div>
          <div class="list-grid compact">
            @for (customer of customers().slice(0, 6); track customer.id) {
              <article>
                <strong>{{ customer.name }}</strong>
                <span>{{ customer.email }}</span>
                <small>{{ customer.city || 'City not added' }}</small>
              </article>
            }
          </div>
        </section>
      }

      @if (canUsePayments()) {
        <section class="surface panel">
          <div class="panel-head"><h2>Payments</h2><span>{{ payments().length }} records</span></div>
          <div class="list-grid compact">
            @for (payment of payments().slice(0, 6); track payment.id) {
              <article>
                <strong>{{ payment.amount | currency:'INR':'symbol':'1.0-0' }}</strong>
                <span>{{ payment.customer }} - {{ payment.bookingId }}</span>
                <small>{{ payment.status }}</small>
              </article>
            }
          </div>
        </section>
      }

      @if (canUseContent()) {
        <section class="surface panel">
          <div class="panel-head"><h2>Content</h2><span>{{ contentCount() }} items</span></div>
          <div class="list-grid">
            @for (post of content()?.blogPosts?.slice(0, 4) ?? []; track post.id) {
              <article>
                <strong>{{ post.title }}</strong>
                <span>{{ post.category || 'Blog' }}</span>
                <small>{{ post.status }}</small>
              </article>
            }
            @for (item of content()?.staticContent?.slice(0, 4) ?? []; track item.key) {
              <article>
                <strong>{{ item.title }}</strong>
                <span>Static content</span>
                <small>{{ item.status }}</small>
              </article>
            }
          </div>
        </section>
      }
    </section>
  `,
  styles: [`
    .staff-dashboard { display: grid; gap: 1rem; max-width: 95vw !important; padding-bottom: 2rem; }
    .surface { background: #fff; border: 1px solid rgba(17,17,17,.09); border-radius: 8px; box-shadow: 0 18px 45px rgba(17,17,17,.06); }
    .hero-panel { align-items: start; display: flex; gap: 1rem; justify-content: space-between; padding: clamp(1.2rem, 3vw, 2rem); }
    .hero-copy { min-width: 0; }
    h1 { color: #111; font-size: clamp(2.1rem, 4vw, 3.7rem); letter-spacing: 0; line-height: 1.08; margin: 0 0 .85rem; }
    .hero-panel p:not(.eyebrow) { color: #333; font-size: 1.05rem; line-height: 1.7; margin: 0; }
    .logout-btn { background: #fff; border: 1px solid rgba(17,17,17,.12); border-radius: 999px; color: #111; cursor: pointer; flex: 0 0 auto; font-size: .86rem; font-weight: 900; padding: .7rem 1rem; }
    .logout-btn:hover { background: #111; color: #fff; }
    .metric-grid { display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .metric-card { display: grid; gap: .4rem; min-height: 120px; padding: 1rem; }
    .metric-card span, .panel-head span, small { color: #777; font-size: .78rem; font-weight: 800; }
    .metric-card strong { color: #111; font-size: 2rem; font-weight: 950; }
    .panel { display: grid; gap: 1rem; padding: 1rem; }
    .panel-head { align-items: center; display: flex; gap: 1rem; justify-content: space-between; }
    h2 { color: #111; font-size: 1.25rem; font-weight: 900; margin: 0; }
    .panel-head a { background: #111; border-radius: 999px; color: #fff; font-size: .86rem; font-weight: 900; padding: .65rem .9rem; }
    .table-wrap { overflow-x: auto; }
    table { border-collapse: collapse; min-width: 720px; width: 100%; }
    th, td { border-bottom: 1px solid rgba(17,17,17,.08); padding: .8rem; text-align: left; vertical-align: top; }
    th { color: #777; font-size: .72rem; font-weight: 900; text-transform: uppercase; }
    td strong, article strong { color: #111; display: block; font-weight: 900; }
    td span, article span { color: #555; display: block; font-size: .9rem; margin-top: .2rem; }
    .empty-cell { color: #777; font-weight: 800; text-align: center; }
    .pager { align-items: center; display: flex; gap: 1rem; justify-content: space-between; }
    .pager span { color: #777; font-size: .82rem; font-weight: 900; }
    .pager div { display: flex; gap: .5rem; }
    .pager button { background: #111; border: 0; border-radius: 999px; color: #fff; cursor: pointer; font-size: .82rem; font-weight: 900; padding: .62rem .9rem; }
    .pager button:disabled { background: #dedbd3; color: #777; cursor: not-allowed; }
    .list-grid { display: grid; gap: .75rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .list-grid.compact { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .list-grid article { background: #f6f6f4; border: 1px solid rgba(17,17,17,.06); border-radius: 8px; padding: .9rem; }
    @media (max-width: 900px) {
      .metric-grid, .list-grid.compact { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .list-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 560px) {
      .staff-dashboard { max-width: calc(100vw - 18px) !important; }
      .hero-panel { align-items: stretch; flex-direction: column; }
      .logout-btn { width: 100%; }
      .metric-grid, .list-grid.compact { grid-template-columns: 1fr; }
      .pager { align-items: stretch; flex-direction: column; }
      .pager div { width: 100%; }
      .pager button { flex: 1; }
    }
  `]
})
export class StaffDashboardPageComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  readonly inventory = signal<AdminProductResponse[]>([]);
  readonly bookings = signal<AdminBookingResponse[]>([]);
  readonly customers = signal<AdminCustomerResponse[]>([]);
  readonly payments = signal<AdminPaymentResponse[]>([]);
  readonly content = signal<AdminContentResponse | null>(null);
  readonly inventoryPage = signal(1);
  readonly inventoryPageSize = 10;

  readonly roleLabel = computed(() => {
    if (this.authService.hasRole('MANAGER')) return 'Manager';
    if (this.authService.hasRole('INVENTORY_STAFF')) return 'Inventory Staff';
    if (this.authService.hasRole('CONTENT_EDITOR')) return 'Content Editor';
    return 'Staff';
  });

  readonly dashboardTitle = computed(() => `${this.roleLabel()} Dashboard`);
  readonly dashboardIntro = computed(() => {
    if (this.authService.hasRole('MANAGER')) return 'Manage bookings, customers, inventory, payments and operational review from one workspace.';
    if (this.authService.hasRole('INVENTORY_STAFF')) return 'Keep stock, returns and maintenance workflows moving with inventory and booking visibility.';
    return 'Review blog and static content work while keeping catalogue and booking context visible.';
  });

  readonly contentCount = computed(() => (this.content()?.blogPosts.length ?? 0) + (this.content()?.staticContent.length ?? 0));
  readonly inventoryPageCount = computed(() => Math.max(1, Math.ceil(this.inventory().length / this.inventoryPageSize)));
  readonly pagedInventory = computed(() => {
    const safePage = Math.min(this.inventoryPageCount(), Math.max(1, this.inventoryPage()));
    const start = (safePage - 1) * this.inventoryPageSize;
    return this.inventory().slice(start, start + this.inventoryPageSize);
  });
  readonly metrics = computed(() => [
    { label: 'Inventory', value: String(this.inventory().length), note: 'Catalogue items' },
    { label: 'Bookings', value: String(this.bookings().length), note: 'Visible orders' },
    { label: 'Customers', value: String(this.customers().length), note: this.canUseCustomers() ? 'Customer records' : 'No access' },
    { label: 'Content', value: String(this.contentCount()), note: this.canUseContent() ? 'Posts and pages' : 'No access' }
  ]);

  ngOnInit(): void {
    this.adminService.getInventory().subscribe({
      next: (items) => {
        this.inventory.set(items);
        this.inventoryPage.set(Math.min(this.inventoryPageCount(), Math.max(1, this.inventoryPage())));
      },
      error: () => this.inventory.set([])
    });
    this.adminService.getBookings().subscribe({ next: (items) => this.bookings.set(items), error: () => this.bookings.set([]) });
    if (this.canUseCustomers()) {
      this.adminService.getCustomers().subscribe({ next: (items) => this.customers.set(items), error: () => this.customers.set([]) });
    }
    if (this.canUsePayments()) {
      this.adminService.getPayments().subscribe({ next: (items) => this.payments.set(items), error: () => this.payments.set([]) });
    }
    if (this.canUseContent()) {
      this.adminService.getContent().subscribe({ next: (items) => this.content.set(items), error: () => this.content.set(null) });
    }
  }

  canUseInventory(): boolean {
    return this.authService.hasRole('MANAGER') || this.authService.hasRole('INVENTORY_STAFF') || this.authService.hasRole('CONTENT_EDITOR');
  }

  canEditInventory(): boolean {
    return this.authService.hasRole('MANAGER') || this.authService.hasRole('INVENTORY_STAFF');
  }

  canUseBookings(): boolean {
    return this.authService.hasRole('MANAGER') || this.authService.hasRole('INVENTORY_STAFF') || this.authService.hasRole('CONTENT_EDITOR');
  }

  canUseCustomers(): boolean {
    return this.authService.hasRole('MANAGER') || this.authService.hasRole('INVENTORY_STAFF');
  }

  canUsePayments(): boolean {
    return this.authService.hasRole('MANAGER');
  }

  canUseContent(): boolean {
    return this.authService.hasRole('MANAGER') || this.authService.hasRole('CONTENT_EDITOR');
  }

  changeInventoryPage(direction: number): void {
    this.inventoryPage.set(Math.min(this.inventoryPageCount(), Math.max(1, this.inventoryPage() + direction)));
  }

  inventoryPageSummary(): string {
    const total = this.inventory().length;
    if (!total) return 'No inventory items';
    const safePage = Math.min(this.inventoryPageCount(), Math.max(1, this.inventoryPage()));
    const start = (safePage - 1) * this.inventoryPageSize + 1;
    const end = Math.min(total, safePage * this.inventoryPageSize);
    return `Showing ${start}-${end} of ${total}`;
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
