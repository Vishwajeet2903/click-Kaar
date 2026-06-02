import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer>
      <div class="container">
        <div class="row g-4 align-items-start">
          <div class="col-md-3">
            <h3>Information</h3>
            <a routerLink="/contact">Contact us</a>
            <a routerLink="/terms">Terms & Privacy</a>
            <a routerLink="/about">About Us</a>
          </div>
          <div class="col-md-3">
            <h3>Follow Us</h3>
            <a href="#">Facebook</a>
            <a href="#">Instagram</a>
            <a href="#">Twitter</a>
          </div>
          <div class="col-md-6 watermark">
            <div class="camera-mark"></div>
          </div>
        </div>
        <div class="footer-nav">
          <a routerLink="/contact">Get Team</a>
          <a routerLink="/contact">Get Editor</a>
          <a routerLink="/catalogue">Rent Equipment</a>
          <a routerLink="/catalogue">Rent Studio</a>
          <a routerLink="/catalogue">Buy Equipment</a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    footer { background: #f7f7f7; margin-top: 4rem; padding: 4.5rem 0 2rem; }
    h3 { color: #171717; font-size: 1.25rem; font-weight: 700; margin-bottom: 1.4rem; text-decoration: underline; text-decoration-color: #d8a43b; text-underline-offset: .25rem; }
    a { color: #555; display: block; font-size: .92rem; margin: .8rem 0; }
    a:hover { color: #ff9700; }
    .watermark { display: flex; justify-content: flex-end; }
    .camera-mark { border: 26px solid rgba(0,0,0,.035); border-radius: 18px; height: 210px; position: relative; width: 340px; }
    .camera-mark::before { border: 22px solid rgba(0,0,0,.035); border-radius: 50%; content: ""; height: 110px; left: 88px; position: absolute; top: 50px; width: 110px; }
    .camera-mark::after { background: rgba(0,0,0,.035); border-radius: 999px; content: ""; height: 26px; position: absolute; right: 42px; top: 58px; width: 26px; }
    .footer-nav { display: flex; flex-wrap: wrap; gap: 2.4rem; margin-top: 2.5rem; }
    .footer-nav a { color: #d99411; font-weight: 600; }
    @media (max-width: 767px) {
      .watermark { justify-content: flex-start; }
      .camera-mark { width: 260px; }
    }
  `]
})
export class FooterComponent {}
