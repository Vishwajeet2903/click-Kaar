import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import AOS from 'aos';
import { Subscription, filter } from 'rxjs';
import { FooterComponent } from './layouts/footer.component';
import { NavbarComponent } from './layouts/navbar.component';
import { WhatsAppButtonComponent } from './shared/components/whatsapp-button.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, WhatsAppButtonComponent],
  template: `
    <div class="route-transition" [class.active]="transitionActive" aria-hidden="true">
      <video src="/reference-motion.mp4" autoplay muted loop playsinline></video>
      <span>ClickKar</span>
    </div>
    <app-navbar />
    <main class="page-shell">
      <router-outlet />
    </main>
    <app-footer />
    <app-whatsapp-button />
  `
})
export class AppComponent implements AfterViewInit, OnDestroy {
  transitionActive = false;

  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly subscriptions = new Subscription();
  private aosObserver?: IntersectionObserver;
  private transitionTimer?: number;
  private aosTimer?: number;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.subscriptions.add(
      this.router.events.pipe(filter((event) => event instanceof NavigationStart)).subscribe(() => {
        this.transitionActive = true;
      })
    );

    this.subscriptions.add(
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
        window.clearTimeout(this.transitionTimer);
        this.transitionTimer = window.setTimeout(() => {
          this.transitionActive = false;
        }, 560);
        this.refreshAnimations();
      })
    );
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.applyAosAttributes();
    AOS.init({
      duration: 850,
      easing: 'ease-out-cubic',
      once: true,
      offset: 90,
      delay: 0,
      mirror: false,
      anchorPlacement: 'top-bottom',
      disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });

    window.setTimeout(() => AOS.refreshHard(), 180);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.aosObserver?.disconnect();
    window.clearTimeout(this.transitionTimer);
    window.clearTimeout(this.aosTimer);
  }

  private refreshAnimations(): void {
    window.clearTimeout(this.aosTimer);
    this.aosTimer = window.setTimeout(() => {
      this.applyAosAttributes();
      AOS.refreshHard();
      this.forceAosVisibilityFallback();
    }, 120);
  }

  private applyAosAttributes(): void {
    const pageShell = this.document.querySelector<HTMLElement>('main.page-shell');
    if (!pageShell) {
      return;
    }

    const selector = [
      '.section-heading',
      'h1',
      'h2',
      'h3',
      'article',
      'figure',
      'img',
      'button',
      '.btn',
      '.btn-pill',
      '.surface',
      '.product-card',
      'app-product-card',
      '.market-product',
      '.package-card',
      '.feature-card',
      '.why-card',
      '.gallery-grid > *',
      '.row > [class*="col-"]'
    ].join(',');

    pageShell.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
      if (element.hasAttribute('data-aos') || element.closest('app-navbar') || element.closest('.route-transition') || element.closest('.hero-collage')) {
        return;
      }

      element.setAttribute('data-aos', this.pickAnimation(element, index));
      element.setAttribute('data-aos-duration', '850');
      element.setAttribute('data-aos-easing', 'ease-out-cubic');
      element.setAttribute('data-aos-once', 'true');
      element.setAttribute('data-aos-delay', String((index % 5) * 80));
    });
  }

  private forceAosVisibilityFallback(): void {
    const pageShell = this.document.querySelector<HTMLElement>('main.page-shell');
    if (!pageShell || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.aosObserver?.disconnect();
    this.aosObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-init', 'aos-animate');
          this.aosObserver?.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    pageShell.querySelectorAll<HTMLElement>('[data-aos]').forEach((element) => {
      element.classList.add('aos-init');

      if (this.isInViewport(element)) {
        element.classList.add('aos-animate');
        return;
      }

      this.aosObserver?.observe(element);
    });
  }

  private pickAnimation(element: HTMLElement, index: number): string {
    if (element.matches('img, figure, .gallery-grid > *, .product-card, app-product-card')) {
      return 'zoom-in';
    }

    if (element.matches('article, .surface, .market-product, .package-card, .feature-card, .why-card, .row > [class*="col-"]')) {
      return index % 2 === 0 ? 'fade-right' : 'fade-left';
    }

    return 'fade-up';
  }

  private isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const height = window.innerHeight || this.document.documentElement.clientHeight;
    return rect.top < height * 0.95 && rect.bottom > height * 0.05;
  }
}
