import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer>
      <div class="footer-shell">
        <div class="footer-top">
          <div class="brand-block">
            <a routerLink="/" class="brand"><span>ck</span> ClickKar</a>
            <h2>Rent the kit. Build the shoot. Create the frame.</h2>
          </div>
          <div class="footer-cta">
            <p>Marketplace for cameras, lenses, lighting, audio gear, studios, and creator-ready packages.</p>
            <a routerLink="/catalogue">Open catalogue</a>
          </div>
        </div>

        <div class="footer-grid">
          <nav aria-label="Marketplace links">
            <h3>Marketplace</h3>
            <a routerLink="/catalogue">All equipment</a>
            <a routerLink="/catalogue" [queryParams]="{ category: 'Cameras' }">Cameras</a>
            <a routerLink="/catalogue" [queryParams]="{ category: 'Lenses' }">Lenses</a>
            <a routerLink="/catalogue" [queryParams]="{ category: 'Lighting' }">Lighting</a>
          </nav>
          <nav aria-label="Company links">
            <h3>Company</h3>
            <a routerLink="/about">About us</a>
            <a routerLink="/blog">Blogs</a>
            <a routerLink="/faq">FAQ</a>
            <a routerLink="/contact">Review</a>
          </nav>
          <nav aria-label="Support links">
            <h3>Support</h3>
            <a routerLink="/terms">Terms</a>
            <a routerLink="/privacy">Privacy</a>
            <a routerLink="/contact">Contact number</a>
            <a routerLink="/contact">Email</a>
            <a routerLink="/contact">Address</a>
            
          </nav>
          <!-- <div class="contact-card">
            <h3>Connect with us on </h3>
           
            <a routerLink="/contact">facebook</a>
            <a routerLink="/contact">Pinstagram</a>
            <a routerLink="/contact">linkdin</a>
            <a routerLink="/contact">Youtube</a>
            <a routerLink="/contact">Youtube</a>
          </div> -->
          <nav aria-label="Support links">
            <h3>Connect with us on</h3>
            <a href="facebook.com">facebook</a>
            <a href="instagaram.com">Instagram</a>
            <a href="linkdin.com">linkdin</a>
            <a href="youtube.com">Youtube</a>
            <a href="pintrest.com">Pintrest</a>
            
          </nav>

        </div>

        <div class="footer-bottom">
          <span>© 2026 CLICK-KAAR LLP.</span>
          <div>
            <a href="#">Terms & Condition </a>
            
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    footer { background: #ececec; padding: 0 0 1.25rem; }
    .footer-shell { background: #fdfdfc; border-radius: 28px; box-shadow: 0 26px 70px rgba(0,0,0,.08); margin: 0 auto; max-width: min(1180px, calc(100vw - 48px)); overflow: hidden; padding: clamp(1.4rem, 4vw, 3rem); position: relative; }
    .footer-shell::before { background: radial-gradient(circle at 20% 0%, rgba(0,0,0,.045), transparent 28%), radial-gradient(circle at 92% 12%, rgba(255,151,0,.22), transparent 32%); content: ""; inset: 0; pointer-events: none; position: absolute; }
    .footer-shell > * { position: relative; z-index: 1; }
    .footer-top { align-items: end; display: grid; gap: 2rem; grid-template-columns: 1.25fr .75fr; margin-bottom: 2.2rem; }
    .brand { align-items: center; color: #111; display: inline-flex; font-size: 1.05rem; font-weight: 900; gap: .7rem; margin-bottom: 1.2rem; }
    .brand span { align-items: center; background: #ff9700; border-radius: 6px; color: #fff; display: inline-flex; height: 24px; justify-content: center; transform: rotate(-18deg); width: 24px; }
    h2 { color: #111; font-size: clamp(2.8rem, 6vw, 5.8rem); font-weight: 900; letter-spacing: -.065em; line-height: .88; margin: 0; max-width: 760px; }
    .footer-cta p { color: #444; line-height: 1.6; margin: 0 0 1rem; }
    .footer-cta a, .contact-card a { align-items: center; background: #111; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; display: inline-flex; font-size: .96rem; font-weight: 800; justify-content: center; min-height: 50px; padding: .85rem 1.25rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; }
    .footer-cta a:hover, .contact-card a:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .footer-grid { display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    nav, .contact-card { background: #f6f6f4; border: 1px solid rgba(17,17,17,.06); border-radius: 22px; padding: 1.2rem; }
    h3 { color: #111; font-size: .78rem; font-weight: 900; letter-spacing: .2em; margin: 0 0 1rem; text-transform: uppercase; }
    nav a { color: #555; display: block; font-size: .92rem; font-weight: 700; margin: .72rem 0; }
    nav a:hover { color: #111; }
    .contact-card p { color: #555; line-height: 1.55; margin: 0 0 1rem; }
    .footer-bottom { align-items: center; border-top: 1px solid rgba(17,17,17,.08); color: #666; display: flex; font-size: .84rem; font-weight: 700; justify-content: space-between; margin-top: 1.4rem; padding-top: 1.2rem; }
    .footer-bottom div { display: flex; flex-wrap: wrap; gap: 1rem; }
    .footer-bottom a { color: #111; }
    @media (max-width: 900px) {
      .footer-top, .footer-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 560px) {
      .footer-shell { border-radius: 20px; max-width: calc(100vw - 18px); padding: 1.25rem; }
      .footer-top, .footer-grid { grid-template-columns: 1fr; }
      .footer-bottom { align-items: flex-start; flex-direction: column; gap: 1rem; }
    }
  `]
})
export class FooterComponent {}
