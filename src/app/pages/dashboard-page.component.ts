import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking } from '../models/product.model';
import { BookingService } from '../services/booking.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Dashboard" />
    <section class="container pb-5">
      <h1 class="section-title">Customer Dashboard</h1>
      <div class="dashboard">
        <aside class="surface sidebar">
          @for (item of nav; track item) { <a href="#">{{ item }}</a> }
        </aside>
        <div class="content">
          <div class="surface profile">
            <p class="eyebrow">Profile</p>
            <h2>Jeet Sharma</h2>
            <p class="muted">jeet&#64;example.com · +91 98765 43210</p>
          </div>
          <div class="row g-3">
            @for (booking of bookings$ | async; track booking.id) {
              <div class="col-md-4">
                <article class="surface booking">
                  <span [class]="booking.status.toLowerCase()">{{ booking.status }}</span>
                  <h3>{{ booking.productName }}</h3>
                  <p class="muted">{{ booking.dateRange }}</p>
                  <strong>{{ booking.total | currency:'INR':'symbol':'1.0-0' }}</strong>
                </article>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .dashboard { display: grid; gap: 1.2rem; grid-template-columns: 240px 1fr; }
    .sidebar, .profile, .booking { padding: 1.2rem; }
    .sidebar a { border-radius: 5%; color: #555; display: block; font-weight: 800; padding: .75rem; }
    .sidebar a:hover { background: rgba(255,151,0,.1); color: #ff9700; }
    .profile { margin-bottom: 1rem; }
    h2, h3 { font-weight: 900; }
    .booking { height: 100%; }
    .booking span { border-radius: 999px; display: inline-block; font-size: .75rem; font-weight: 900; margin-bottom: .8rem; padding: .25rem .55rem; }
    .active { background: rgba(39,174,96,.12); color: #18864b; }
    .past { background: rgba(0,0,0,.06); color: #555; }
    .upcoming { background: rgba(255,151,0,.14); color: #d99411; }
    @media (max-width: 767px) { .dashboard { grid-template-columns: 1fr; } }
  `]
})
export class DashboardPageComponent {
  readonly bookings$: Observable<Booking[]> = inject(BookingService).getBookings();
  readonly nav = ['Profile', 'Active Bookings', 'Past Bookings', 'Upcoming Returns', 'Wishlist'];
}
