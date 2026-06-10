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
            <img class="brand-mark" src="/Main logo Black .png" alt="" aria-hidden="true">
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
            <li class="nav-item"><a routerLink="/blog" fragment="gallery" class="nav-link" (click)="closeMenu()">Blog</a></li>
            <li class="nav-item has-mega">
              <a routerLink="/catalogue" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Categories</a>
              <div class="mega surface">
                @for (category of productService.categories(); track category) {
                  <a routerLink="/catalogue" [queryParams]="{ category }" (click)="closeMenu()">{{ category }}</a>
                }
              </div>
            </li>
            <li class="nav-item"><a routerLink="/dashboard" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Wishlist</a></li>
            @if (authService.isAdmin()) {
              <li class="nav-item"><a routerLink="/admin" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Admin</a></li>
            }
          </ul>
          <div class="actions">
            <a routerLink="/cart" class="cart-link" aria-label="Open cart" (click)="closeMenu()">
              @if (cart.count() > 0) {
                <svg class="cart-full" viewBox="0 0 32 32" aria-hidden="true">
                  <path class="basket-fill" d="M7.9 11.2h19.4l-1.9 10.2a2.8 2.8 0 0 1-2.8 2.3H11.3a2.8 2.8 0 0 1-2.8-2.3L6.6 6.8H3.3" />
                  <path class="camera-body" d="M11.3 13.3h8.2l1.1 1.5h2.2a1.6 1.6 0 0 1 1.6 1.6v3.8a1.6 1.6 0 0 1-1.6 1.6H11.3a1.6 1.6 0 0 1-1.6-1.6v-5.3a1.6 1.6 0 0 1 1.6-1.6Z" />
                  <circle class="camera-lens" cx="16.9" cy="18.2" r="2.4" />
                  <path class="tripod" d="M22.8 12.6v9.8M20.5 25.2l2.3-2.8 2.3 2.8M20.9 12.6h3.8" />
                  <path class="wheel" d="M11.2 27.4h.1M23.1 27.4h.1" />
                </svg>
              } @else {
                <svg class="cart-empty" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M7.9 11.2h19.4l-1.9 10.2a2.8 2.8 0 0 1-2.8 2.3H11.3a2.8 2.8 0 0 1-2.8-2.3L6.6 6.8H3.3" />
                  <path d="M11.2 27.4h.1M23.1 27.4h.1" />
                </svg>
              }
              @if (cart.count() > 0) {
                <b>{{ cart.count() }}</b>
              }
            </a>
            @if (currentUser(); as user) {
              <a routerLink="/dashboard" class="avatar-link" [attr.aria-label]="'Open profile for ' + user.fullName" [title]="user.fullName" (click)="closeMenu()">
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
    .navbar > .container { background: rgba(253,253,252,.86); border: 1px solid rgba(17,17,17,.06); border-radius: 26px; box-shadow: 0 18px 42px rgba(0,0,0,.08); backdrop-filter: blur(18px); max-width: min(1180px, calc(100vw - 48px)); padding: .9rem 1.2rem; }
    .brand { align-items: center; display: inline-flex; flex: 0 0 auto; gap: .85rem; min-width: 0; }
    .mark { align-items: center; background: #ff9700; border-radius: 6px; display: inline-flex; height: 42px; justify-content: center; overflow: hidden; transform: rotate(-18deg); width: 42px; }
    .brand-mark { height: 36px; object-fit: contain; transform: rotate(18deg); width: 36px; }
    .word { color: #151515; font-size: 1.05rem; font-weight: 900; letter-spacing: -.03em; line-height: 1; }
    .nav-link { color: #111; font-size: .76rem; font-weight: 800; padding-left: .85rem !important; padding-right: .85rem !important; }
    .nav-link.active, .nav-link:hover { color: #111; text-decoration: underline; text-underline-offset: .28rem; }
    .navbar-collapse { align-items: center; display: flex; flex-basis: auto; flex-grow: 1; }
    .actions { align-items: center; display: flex; gap: .8rem; }
    .cart-link { align-items: center; background: #fff; border-radius: 999px; box-shadow: 0 8px 22px rgba(0,0,0,.06); color: #151515; display: inline-flex; height: 44px; justify-content: center; min-width: 44px; padding: .45rem .62rem; position: relative; }
    .cart-link svg { fill: none; height: 27px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.2; width: 27px; }
    .cart-link .cart-full { fill: none; stroke-width: 1.9; }
    .basket-fill { fill: #ff9700; stroke: #111; }
    .camera-body { fill: #111; stroke: #111; }
    .camera-lens { fill: #ff9700; stroke: #fff; stroke-width: 1.3; }
    .tripod, .wheel { fill: none; stroke: #111; }
    .cart-link b { align-items: center; background: #ff9700; border: 2px solid #fff; border-radius: 999px; color: #111; display: inline-flex; font-size: .66rem; font-weight: 950; height: 18px; justify-content: center; line-height: 1; min-width: 18px; padding: 0 .24rem; position: absolute; right: -4px; top: -5px; }
    .cart-link:hover { background: #111; color: #fff; transform: translateY(-1px); }
    .cart-link:hover .basket-fill { fill: #ff9700; stroke: #fff; }
    .cart-link:hover .camera-body { fill: #fff; stroke: #fff; }
    .cart-link:hover .camera-lens { stroke: #111; }
    .cart-link:hover .tripod, .cart-link:hover .wheel { stroke: #fff; }
    .login-link { align-items: center; background: #111; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; display: inline-flex; font-size: .96rem; font-weight: 800; justify-content: center; min-height: 50px; padding: .85rem 1.25rem; }
    .login-link:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .avatar-link { align-items: center; background: #111; border: 2px solid #ff9700; border-radius: 50%; box-shadow: 0 10px 24px rgba(0,0,0,.12); color: #fff; display: inline-flex; font-size: .9rem; font-weight: 950; height: 38px; justify-content: center; line-height: 1; text-transform: uppercase; width: 38px; }
    .avatar-link:hover { background: #ff9700; color: #111; transform: translateY(-1px); }
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
      .word { font-size: 1rem; letter-spacing: .12rem; }
      .navbar-toggler { display: inline-flex; }
      .navbar-collapse { align-items: stretch; display: none; flex-basis: 100%; flex-direction: column; margin-top: 1rem; }
      .navbar-collapse.show { display: flex; }
      .navbar-nav { gap: .2rem; }
      .actions { align-items: stretch; flex-direction: column; margin-top: 1rem; }
      .cart-link { align-self: flex-start; }
      .avatar-link { border-radius: 999px; height: 40px; width: 100%; }
      .mega { display: grid; min-width: auto; position: static; }
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
}
