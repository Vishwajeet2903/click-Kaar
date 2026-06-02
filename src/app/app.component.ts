import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './layouts/footer.component';
import { NavbarComponent } from './layouts/navbar.component';
import { WhatsAppButtonComponent } from './shared/components/whatsapp-button.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, WhatsAppButtonComponent],
  template: `
    <app-navbar />
    <main>
      <router-outlet />
    </main>
    <app-footer />
    <app-whatsapp-button />
  `
})
export class AppComponent {}
