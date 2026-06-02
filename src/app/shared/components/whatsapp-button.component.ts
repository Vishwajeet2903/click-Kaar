import { Component } from '@angular/core';

@Component({
  selector: 'app-whatsapp-button',
  standalone: true,
  template: `<a class="whatsapp" href="https://wa.me/919999999999" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">WA</a>`,
  styles: [`
    .whatsapp { align-items: center; background: #22c55e; border-radius: 999px; bottom: 1.2rem; box-shadow: 0 12px 30px rgba(34,197,94,.35); color: #052e16; display: flex; font-weight: 900; height: 54px; justify-content: center; position: fixed; right: 1.2rem; width: 54px; z-index: 20; }
  `]
})
export class WhatsAppButtonComponent {}
