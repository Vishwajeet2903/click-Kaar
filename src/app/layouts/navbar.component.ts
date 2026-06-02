import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../services/cart.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg sticky-top">
      <div class="container">
        <a routerLink="/" class="brand"><span class="mark">ck</span><span class="word">ClickKar</span></a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav mx-auto">
            <li class="nav-item"><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">Home</a></li>
            <li class="nav-item"><a routerLink="/about" routerLinkActive="active" class="nav-link">About Us</a></li>
            <li class="nav-item"><a routerLink="/blog" routerLinkActive="active" class="nav-link">Ideas</a></li>
            <li class="nav-item has-mega">
              <a routerLink="/catalogue" routerLinkActive="active" class="nav-link">Shop</a>
              <div class="mega surface">
                @for (category of productService.categories(); track category) {
                  <a routerLink="/catalogue" [queryParams]="{ category }">{{ category }}</a>
                }
              </div>
            </li>
            <li class="nav-item"><a routerLink="/dashboard" routerLinkActive="active" class="nav-link">Projects</a></li>
          </ul>
          <div class="actions">
             <a routerLink="/cart" class="bell" aria-label="Cart">●<span>{{ cart.count() }}</span></a>
            <a routerLink="/login" class="avatar" aria-label="Login"></a>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar { background: #fff; padding: 1.15rem 0; }
    .brand { align-items: center; color: #d99411; display: flex; font-size: 1.12rem; font-weight: 700; gap: .75rem; letter-spacing: .42rem; }
    .mark { align-items: center; background: #ff9700; color: #fff; display: inline-flex; font-size: 1rem; height: 44px; justify-content: center; letter-spacing: 0; width: 44px; }
    .word { line-height: 1; }
    .nav-link { color: #171717; font-size: .93rem; font-weight: 500; padding-left: .8rem !important; padding-right: .8rem !important; }
    .nav-link.active, .nav-link:hover { color: #d99411; }
    .actions { align-items: center; display: flex; gap: .8rem; }
    .post { border: 1px solid #d8a43b; color: #d99411; font-size: .86rem; font-weight: 700; padding: .55rem .75rem; white-space: nowrap; }
    .bell { color: #111; font-size: 1.1rem; line-height: 1; position: relative; }
    .bell span { background: #ff9700; border-radius: 999px; color: #fff; font-size: .68rem; line-height: 1; padding: .15rem .34rem; position: absolute; right: -.7rem; top: -.5rem; }
    .avatar { background: url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80') center/cover; border-radius: 999px; height: 32px; width: 32px; }
    .has-mega { position: relative; }
    .mega { display: none; gap: .8rem; left: 0; min-width: 360px; padding: 1rem; position: absolute; top: 100%; z-index: 10; }
    .mega a { border: 1px solid rgba(216,164,59,.3); color: #171717; font-weight: 600; padding: .65rem .8rem; }
    .has-mega:hover .mega { display: grid; grid-template-columns: repeat(2, 1fr); }
    .navbar-toggler { border-color: rgba(216,164,59,.5); }
    @media (max-width: 991px) {
      .brand { letter-spacing: .24rem; }
      .actions { align-items: stretch; flex-direction: column; margin-top: 1rem; }
      .mega { display: grid; min-width: auto; position: static; }
      .avatar { display: none; }
    }
  `]
})
export class NavbarComponent {
  readonly cart = inject(CartService);
  readonly productService = inject(ProductService);
}
