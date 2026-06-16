import { Component } from '@angular/core';

@Component({
  selector: 'app-whatsapp-button',
  standalone: true,
  template: `
    <a class="whatsapp" href="https://wa.me/9096820033" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16.04 4.1a11.72 11.72 0 0 0-10.1 17.64L4.7 27.3l5.68-1.18A11.72 11.72 0 1 0 16.04 4.1Z" />
        <path class="phone" d="M12.25 10.15c-.28-.62-.58-.63-.84-.64h-.72c-.25 0-.65.09-.99.47-.34.37-1.3 1.27-1.3 3.1 0 1.82 1.33 3.59 1.52 3.84.18.25 2.57 4.12 6.34 5.61 3.13 1.23 3.77.99 4.45.92.68-.06 2.2-.9 2.51-1.77.31-.87.31-1.62.22-1.77-.09-.16-.34-.25-.72-.44-.37-.19-2.2-1.08-2.54-1.2-.34-.13-.59-.19-.84.18-.25.38-.96 1.2-1.18 1.45-.22.25-.43.28-.81.09-.37-.19-1.58-.58-3.01-1.85-1.11-.99-1.86-2.21-2.08-2.59-.22-.37-.02-.57.16-.76.17-.17.37-.44.56-.65.19-.22.25-.38.37-.63.13-.25.06-.47-.03-.65-.09-.19-.82-2.03-1.08-2.72Z" />
      </svg>
    </a>
  `,
  styles: [`
    .whatsapp { align-items: center; background: #22c55e; border-radius: 999px; bottom: 1.2rem; box-shadow: 0 12px 30px rgba(34,197,94,.35); color: #ffffff; display: flex; height: 54px; justify-content: center; position: fixed; right: 1.2rem; transition: transform .25s ease, box-shadow .25s ease; width: 54px; z-index: 20; }
    .whatsapp:hover { box-shadow: 0 16px 34px rgba(34,197,94,.42); transform: translateY(-2px); }
    svg { fill: currentColor; height: 31px; width: 31px; }
    .phone { fill: #22c55e; }
  `]
})
export class WhatsAppButtonComponent {}
