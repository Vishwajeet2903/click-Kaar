import { Component, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <a routerLink="/" class="brand" aria-label="Click-Kaar home">
          <span class="mark">
            <img class="brand-mark" src="/Main logo White.png" alt="" aria-hidden="true">
          </span>
          <span class="word">CLICK-KAAR</span>
        </a>
        <button
          class="navbar-toggler"
          type="button"
          [class.is-open]="menuOpen"
          [attr.aria-expanded]="menuOpen"
          aria-controls="navMenu"
          aria-label="Toggle navigation"
          (click)="toggleMenu()"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="navbar-collapse" [class.show]="menuOpen" id="navMenu">
          <ul class="navbar-nav mx-auto">
            <li class="nav-item"><a routerLink="/" fragment="home" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link" (click)="closeMenu()">Get Started</a></li>
            <!-- <li class="nav-item"><a routerLink="/" fragment="marketplace" class="nav-link" (click)="closeMenu()">Marketplace</a></li> -->
            <li class="nav-item"><a routerLink="/catalogue" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Catalogue</a></li>
            <li class="nav-item"><a routerLink="/about" routerLinkActive="active" class="nav-link" (click)="closeMenu()">About Us</a></li>
            <li class="nav-item"><a routerLink="/blog" fragment="gallery" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Blog</a></li>
            @if (authService.isStaff()) {
              <li class="nav-item"><a [routerLink]="accountLink()" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Staff</a></li>
            }
            <!-- <li class="nav-item has-mega">
              <a routerLink="/catalogue" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Categories</a>
              <div class="mega surface">
                @for (category of productService.categories(); track category) {
                  <a routerLink="/catalogue" [queryParams]="{ category }" (click)="closeMenu()">{{ category }}</a>
                }
              </div>
            </li> -->
            @if (canShowCustomerActions()) {
              <li class="nav-item"><a routerLink="/wishlist" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Wishlist</a></li>
            }
            @if (authService.isAdmin()) {
              <li class="nav-item"><a routerLink="/admin" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Admin</a></li>
            }
          </ul>
          <div class="actions">
            @if (canShowCustomerActions()) {
              <a routerLink="/cart" class="cart-link" aria-label="Open cart" (click)="closeMenu()">
                @if (cart.count() > 0) {
                  <svg class="cart-full" viewBox="0 0 32 32" aria-hidden="true">
                    <path class="cart-basket-fill" d="M8.7 11h18.1l-1.7 9.8a3 3 0 0 1-3 2.5H12.3a3 3 0 0 1-3-2.6L7.4 7.2H4.2" />
                    <path class="cart-line" d="M12.5 15.2h11.2M13.3 19h9.6" />
                    <circle class="cart-wheel" cx="12.4" cy="26.6" r="1.3" />
                    <circle class="cart-wheel" cx="23.1" cy="26.6" r="1.3" />
                  </svg>
                } @else {
                  <svg class="cart-empty" viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M8.7 11h18.1l-1.7 9.8a3 3 0 0 1-3 2.5H12.3a3 3 0 0 1-3-2.6L7.4 7.2H4.2" />
                    <path d="M12.5 15.2h11.2M13.3 19h9.6" />
                    <circle cx="12.4" cy="26.6" r="1.3" />
                    <circle cx="23.1" cy="26.6" r="1.3" />
                  </svg>
                }
                @if (cart.count() > 0) {
                  <b>{{ cart.count() }}</b>
                }
              </a>
            }
            @if (currentUser(); as user) {
              <a [routerLink]="accountLink()" class="avatar-link" [attr.aria-label]="accountLabel(user.fullName)" [title]="accountLabel(user.fullName)" (click)="closeMenu()">
                {{ getInitial(user.fullName) }}
              </a>
            } @else {
              <a routerLink="/login" class="login-link" (click)="closeMenu()">Login</a>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar { background: transparent; left: 0; padding: 1rem 0 .65rem; position: fixed; right: 0; top: 0; z-index: 1000; }
    .navbar > .container { background: rgba(253,253,252,.86); border: 1px solid rgba(17,17,17,.06); border-radius: 26px; box-shadow: 0 18px 42px rgba(0,0,0,.08); backdrop-filter: blur(18px); max-width: min(95vw, calc(100vw - 48px)); padding: .9rem 1.2rem; }
    .brand { align-items: center; display: inline-flex; flex: 0 0 auto; gap: .85rem; min-width: 0; }
    .mark { align-items: center; background: #ff9700; border-radius: 6px; display: inline-flex; height: 42px; justify-content: center; overflow: hidden; transform: rotate(-18deg); width: 42px; }
    .brand-mark { height: 36px; object-fit: contain; transform: rotate(18deg); width: 36px; }
    .word { color: #151515; font-size: 1.05rem; font-weight: 900; letter-spacing: .02em; line-height: 1; word-spacing: .08em; }
    .nav-link { color: #111; font-size: .76rem; font-weight: 800; padding-left: .85rem !important; padding-right: .85rem !important; transition: color .2s ease; }
    .nav-link.active { color: #ff9700; text-decoration: none; }
    .nav-link:hover { color: #ff9700; text-decoration: none; }
    .navbar-collapse { align-items: center; display: flex; flex-basis: auto; flex-grow: 1; }
    .actions { align-items: center; display: flex; gap: .8rem; }
    .cart-link { align-items: center; background: #fff; border-radius: 999px; box-shadow: 0 8px 22px rgba(0,0,0,.06); color: #151515; display: inline-flex; height: 44px; justify-content: center; min-width: 44px; padding: .45rem .62rem; position: relative; }
    .cart-link svg { fill: none; height: 27px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.2; width: 27px; }
    .cart-link .cart-full { stroke-width: 1.9; }
    .cart-basket-fill { fill: #ff9700; stroke: #111; }
    .cart-line { fill: none; stroke: #111; }
    .cart-wheel { fill: #111; stroke: #111; }
    .cart-link b { align-items: center; background: #ff9700; border: 2px solid #fff; border-radius: 999px; color: #111; display: inline-flex; font-size: .66rem; font-weight: 950; height: 18px; justify-content: center; line-height: 1; min-width: 18px; padding: 0 .24rem; position: absolute; right: -4px; top: -5px; }
    .cart-link:hover { background: #111; color: #fff; transform: translateY(-1px); }
    .cart-link:hover .cart-basket-fill { fill: #ff9700; stroke: #fff; }
    .cart-link:hover .cart-line { stroke: #111; }
    .cart-link:hover .cart-wheel { fill: #fff; stroke: #fff; }
    .login-link { align-items: center; background: #111; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; display: inline-flex; font-size: .96rem; font-weight: 800; justify-content: center; min-height: 50px; padding: .85rem 1.25rem; }
    .login-link:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #fff; transform: translateY(-2px); }
    .avatar-link { align-items: center; background: #111; border: 2px solid transparent; border-radius: 50%; box-shadow: 0 10px 24px rgba(0,0,0,.12); color: #fff !important; display: inline-flex; font-size: .9rem; font-weight: 950; height: 38px; justify-content: center; line-height: 1; text-transform: uppercase; width: 38px; }
    .avatar-link:hover { background: #ff9700; color: #fff !important; transform: translateY(-1px); }
    .avatar-link:focus,
    .avatar-link:focus-visible { box-shadow: 0 10px 24px rgba(0,0,0,.12); color: #fff !important; outline: 0; }
    .has-mega { position: relative; }
    .mega { display: none; gap: .8rem; left: 0; min-width: 360px; padding: 1rem; position: absolute; top: 100%; z-index: 10; }
    .mega a { border: 1px solid rgba(21,21,21,.08); border-radius: 999px; color: #171717; font-size: .78rem; font-weight: 800; padding: .65rem .8rem; }
    .has-mega:hover .mega { display: grid; grid-template-columns: repeat(2, 1fr); }
    .navbar-toggler { align-items: center; border: 1px solid rgba(21,21,21,.18); border-radius: 999px; display: none; flex-direction: column; gap: 4px; height: 38px; justify-content: center; padding: 0; width: 42px; }
    .navbar-toggler:focus { box-shadow: 0 0 0 .18rem rgba(255,151,0,.28); }
    .navbar-toggler span { background: #111; border-radius: 999px; display: block; height: 2px; transition: opacity .2s ease, transform .2s ease; width: 18px; }
    .navbar-toggler.is-open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
    .navbar-toggler.is-open span:nth-child(2) { opacity: 0; }
    .navbar-toggler.is-open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
    @media (max-width: 991px) {
      .brand { gap: .65rem; }
      .mark { height: 36px; width: 36px; }
      .brand-mark { height: 31px; width: 31px; }
      .word { font-size: 1rem; letter-spacing: .02em; word-spacing: .08em; }
      .navbar-toggler { display: inline-flex; }
      .navbar-collapse { align-items: stretch; display: none; flex-basis: 100%; flex-direction: column; margin-top: 1rem; }
      .navbar-collapse.show { display: flex; }
      .navbar-nav { gap: .2rem; }
      .actions { align-items: stretch; flex-direction: column; margin-top: 1rem; }
      .cart-link { align-self: flex-start; }
      .avatar-link { border-radius: 999px; height: 40px; width: 100%; }
      .mega { min-width: auto; position: static; }
      .navbar > .container { border-radius: 18px; max-width: calc(100vw - 18px); padding: 1rem; }
    }
  `]
})
export class NavbarComponent implements OnDestroy {
  readonly authService = inject(AuthService);

  readonly cart = inject(CartService);
  readonly currentUser = this.authService.currentUser;
  readonly productService = inject(ProductService);
  menuOpen = false;

  private readonly router = inject(Router);
  private readonly subscriptions = new Subscription();

  constructor() {
    this.subscriptions.add(
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
        this.closeMenu();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  getInitial(name: string): string {
    return name.trim().charAt(0) || 'U';
  }

  accountLink(): string {
    return this.authService.defaultDashboardUrl();
  }

  accountLabel(name: string): string {
    return this.authService.isAdmin() || this.authService.isStaff() ? `Open dashboard for ${name}` : `Open profile for ${name}`;
  }

  canShowCustomerActions(): boolean {
    const user = this.authService.currentUser();
    return !user || this.authService.isCustomer();
  }
}
