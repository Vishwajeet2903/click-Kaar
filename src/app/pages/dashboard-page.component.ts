import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Booking } from '../models/product.model';
import { AuthService } from '../services/auth.service';
import { BookingService } from '../services/booking.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, RouterLink, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Dashboard" />
    <section class="container pb-5">
      @if (currentUser(); as user) {
        <h1 class="section-title">Customer Dashboard</h1>
        <div class="dashboard">
          <aside class="surface sidebar">
            @for (item of nav; track item) { <a href="#">{{ item }}</a> }
            <button type="button" (click)="logout()">Log out</button>
          </aside>

          <div class="content">
            <div class="surface profile">
              <div>
                <p class="eyebrow">Profile</p>
                <h2>{{ user.fullName }}</h2>
                <p class="muted">
                  {{ user.email }}
                  @if (user.mobile) { <span> - {{ user.mobile }}</span> }
                </p>
              </div>

              <div class="profile-meta">
                <span>Customer ID #{{ user.userId }}</span>
                @for (role of user.roles; track role) {
                  <strong>{{ role }}</strong>
                }
              </div>
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
      } @else {
        <div class="surface empty-state">
          <p class="eyebrow">Account required</p>
          <h1>Please log in to view your dashboard.</h1>
          <a routerLink="/login">Go to login</a>
        </div>
      }
    </section>
  `,
  styles: [`
    .dashboard { display: grid; gap: 1.2rem; grid-template-columns: 240px 1fr; }
    .sidebar, .profile, .booking { padding: 1.2rem; }
    .sidebar a { border-radius: 5%; color: #555; display: block; font-weight: 800; padding: .75rem; }
    .sidebar a:hover { background: rgba(255,151,0,.1); color: #ff9700; }
    .sidebar button { background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; font-size: .96rem; font-weight: 800; margin-top: .8rem; min-height: 50px; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; width: 100%; }
    .sidebar button:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .profile { align-items: center; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: 1rem; }
    .profile h2 { margin-bottom: .35rem; }
    .profile-meta { align-items: flex-end; display: flex; flex-direction: column; gap: .55rem; text-align: right; }
    .profile-meta span { color: #777; font-size: .85rem; font-weight: 800; }
    .profile-meta strong { background: rgba(255,151,0,.2); border-radius: 999px; color: #ff9700; font-size: .75rem; padding: .35rem .65rem; }
    .empty-state { margin: 0 auto; max-width: 680px; padding: 2rem; text-align: center; }
    .empty-state a { align-items: center; background: #111; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; display: inline-flex; font-size: .96rem; font-weight: 800; justify-content: center; margin-top: 1rem; min-height: 50px; padding: .85rem 1.25rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; }
    .empty-state a:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    h2, h3 { font-weight: 900; }
    .booking { height: 100%; }
    .booking span { border-radius: 999px; display: inline-block; font-size: .75rem; font-weight: 900; margin-bottom: .8rem; padding: .25rem .55rem; }
    .active { background: rgba(39,174,96,.12); color: #18864b; }
    .past { background: rgba(0,0,0,.06); color: #555; }
    .upcoming { background: rgba(255,151,0,.14); color: #d99411; }
    @media (max-width: 767px) {
      .dashboard { grid-template-columns: 1fr; }
      .profile { align-items: flex-start; flex-direction: column; }
      .profile-meta { align-items: flex-start; text-align: left; }
    }
  `]
})
export class DashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly bookings$: Observable<Booking[]> = inject(BookingService).getBookings();
  readonly currentUser = this.authService.currentUser;
  readonly nav = ['Profile', 'Active Bookings', 'Past Bookings', 'Upcoming Returns', 'Wishlist'];

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
