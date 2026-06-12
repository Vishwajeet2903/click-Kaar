import { AfterViewInit, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  template: `
    <section class="landing-card hero-section" id="home">
      <div class="hero-copy">
        <p class="eyebrow" appScrollReveal="fade-up">Creative rental marketplace</p>
        <h1 appScrollReveal="fade-up" [revealDelay]="90">Build a shoot that looks like a <h1 class="mast">MASTERPIECE.</h1></h1>
        <p class="hero-subtitle" appScrollReveal="fade-up" [revealDelay]="180">
          Rent the Right Gear, Right When You Need It.
        </p>
        <div class="hero-actions" appScrollReveal="fade-up" [revealDelay]="260">
          <a routerLink="/catalogue" class="btn-pill dark">Shop rental gear</a>
        </div>

        <form class="market-search" appScrollReveal="fade-up" [revealDelay]="340">
          <span aria-hidden="true"></span>
          <input type="search" placeholder="Search cameras, lenses, studios, editors">
          <a routerLink="/catalogue" aria-label="Search marketplace">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4.2 4.2" />
            </svg>
          </a>
        </form>

        <div class="category-row" appScrollReveal="fade-up" [revealDelay]="420" aria-label="Popular marketplace categories">
          @for (category of categories; track category) {
            <a routerLink="/catalogue" [queryParams]="{ category }">{{ category }}</a>
          }
        </div>
      </div>

      <div class="hero-collage" [class.collage-ready]="collageReady">
        <span class="handle handle-blue">from ₹899/day</span>
        <span class="handle handle-green">live stock</span>
        @for (item of collage; track item.alt; let index = $index) {
          <a class="collage-card" [class]="'card-' + (index + 1)" routerLink="/catalogue" [queryParams]="{ category: getCategory(item.label) }" [attr.aria-label]="'Browse ' + item.label">
            <img [src]="item.image" [alt]="item.alt">
            <span class="tile-caption">
              <b>{{ item.label }}</b>
              <small>{{ item.price }}</small>
            </span>
          </a>
        }
      </div>
    </section>
  `,
  styles: [`
  .mast { color: #ff9700; display: inline; }
  .hero-copy .eyebrow,
  .hero-copy h1 { font-family: var(--display-font); }
  .eyebrow{color: #ff9700;}
    .hero-section { min-height: calc(100vh - 106px); padding: clamp(2.5rem, 6vw, 5.4rem) clamp(1.2rem, 4vw, 3.2rem) 3.5rem; text-align: center; }
    .hero-copy { margin: 0 auto; max-width: 850px; position: relative; z-index: 2; }
    h1 { color: #111; font-size: clamp(3.3rem, 8vw, 7rem); font-weight: 900; letter-spacing: -0.02em; line-height: .9; margin: .7rem auto 1rem; text-wrap: balance; }
    .hero-subtitle { color: #2e2e2c; font-size: clamp(1rem, 1.5vw, 1.18rem); line-height: 1.55; margin: 0 auto 1.45rem; max-width: 620px; }
    .hero-actions { align-items: center; display: flex; gap: .8rem; justify-content: center; }
    .market-search { align-items: center; background: #fff; border: 1px solid rgba(17,17,17,.08); border-radius: 999px; box-shadow: 0 18px 42px rgba(0,0,0,.08); display: grid; gap: .65rem; grid-template-columns: auto 1fr auto; margin: 1.35rem auto .8rem; max-width: 650px; padding: .55rem .65rem .55rem 1rem; }
    .market-search span { color: #111; font-size: 1.1rem; font-weight: 900; }
    .market-search input { border: 0; color: #111; font: inherit; min-width: 0; outline: 0; }
    .market-search a { align-items: center; background: #111; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; display: inline-flex; height: 50px; justify-content: center; padding: 0; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; width: 50px; }
    .market-search svg { fill: none; height: 21px; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.4; width: 21px; }
    .market-search a:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .category-row { display: flex; flex-wrap: wrap; gap: .55rem; justify-content: center; margin: 0 auto; max-width: 720px; }
    .category-row a { background: #f4f4f1; border: 1px solid rgba(17,17,17,.06); border-radius: 999px; color: #111; font-size: .76rem; font-weight: 900; padding: .56rem .78rem; }
    .hero-collage { height: clamp(300px, 38vw, 450px); margin: -.2rem auto 0; max-width: 1000px; position: relative; }
    .collage-card { background: #ecebe8; border-radius: 20px; box-shadow: 0 28px 55px rgba(0,0,0,.16); cursor: pointer; display: block; height: clamp(145px, 20vw, 220px); left: 50%; margin: 0; overflow: hidden; position: absolute; text-decoration: none; top: 52%; transform-origin: center bottom; transition: box-shadow .28s ease, transform .28s ease; width: clamp(160px, 22vw, 245px); }
    .collage-card:hover { box-shadow: 0 34px 68px rgba(0,0,0,.2); transform: var(--final-transform) translateY(-16px) scale(1.02); }
    .collage-card:focus-visible { outline: 3px solid #ff9700; outline-offset: 4px; }
    .collage-card img { height: 100%; object-fit: cover; width: 100%; }
    .tile-caption { align-items: center; background: rgba(255,255,255,.92); border-radius: 999px; bottom: .65rem; display: flex; gap: .5rem; justify-content: space-between; left: .65rem; padding: .45rem .6rem; position: absolute; right: .65rem; }
    .collage-card b { color: #111; font-size: .72rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .collage-card small { color: #ff9700; font-size: .7rem; font-weight: 900; white-space: nowrap; }
    .card-1 { --card-delay: .28s; --final-transform: translate(-210%, -23%) rotate(-13deg); transform: var(--final-transform); }
    .card-2 { --card-delay: .38s; --final-transform: translate(-142%, -43%) rotate(-7deg); transform: var(--final-transform); }
    .card-3 { --card-delay: .48s; --final-transform: translate(-70%, -50%) rotate(-2deg); transform: var(--final-transform); }
    .card-4 { --card-delay: .58s; --final-transform: translate(-4%, -48%) rotate(3deg); transform: var(--final-transform); }
    .card-5 { --card-delay: .68s; --final-transform: translate(62%, -40%) rotate(8deg); transform: var(--final-transform); }
    .card-6 { --card-delay: .78s; --final-transform: translate(122%, -28%) rotate(13deg); transform: var(--final-transform); }
    .hero-collage:not(.collage-ready) .collage-card { opacity: 0; transform: translate(-50%, 24%) rotate(0) scale(.72) !important; }
    .hero-collage.collage-ready .collage-card { animation: fan-card-in .95s cubic-bezier(.2,.9,.2,1) var(--card-delay) backwards; }
    .handle { border-radius: 999px; color: #fff; font-size: .98rem; font-weight: 850; line-height: 1; padding: .62rem .82rem; position: absolute; z-index: 5; }
    .handle-blue { --handle-transform: rotate(-7deg); background: #2f6df2; left: 24%; top: 17%; transform: var(--handle-transform); }
    .handle-green { --handle-transform: rotate(10deg); background: #ff9700; right: 9%; top: 24%; transform: var(--handle-transform); }
    .hero-collage:not(.collage-ready) .handle { opacity: 0; transform: translateY(14px) scale(.82) !important; }
    .hero-collage.collage-ready .handle { animation: badge-pop .68s cubic-bezier(.2,.9,.2,1) .95s both; }
    .hero-collage.collage-ready .handle-green { animation-delay: 1.08s; }
    @keyframes fan-card-in {
      0% { opacity: 0; transform: translate(-50%, 28%) rotate(0) scale(.76); }
      45% { opacity: 1; }
      72% { opacity: 1; transform: var(--final-transform) scale(1.035); }
      100% { opacity: 1; transform: var(--final-transform) scale(1); }
    }
    @keyframes badge-pop {
      0% { opacity: 0; transform: translateY(14px) scale(.82); }
      72% { opacity: 1; transform: var(--handle-transform) scale(1.08); }
      100% { opacity: 1; transform: var(--handle-transform); }
    }
    @media (max-width: 900px) {
      .card-1 { --final-transform: translate(-150%, -18%) rotate(-12deg); transform: var(--final-transform); }
      .card-6 { --final-transform: translate(68%, -22%) rotate(12deg); transform: var(--final-transform); }
    }
    @media (max-width: 560px) {
      .hero-section { min-height: auto; padding-top: 2.5rem; }
      .hero-actions { flex-direction: column; }
      .market-search { grid-template-columns: auto 1fr auto; padding: .7rem; }
      .hero-collage { height: 320px; margin-top: .5rem; }
      .collage-card { height: 118px; width: 138px; }
      .card-1 { --final-transform: translate(-138%, -15%) rotate(-12deg); transform: var(--final-transform); }
      .card-2 { --final-transform: translate(-92%, -40%) rotate(-6deg); transform: var(--final-transform); }
      .card-3 { --final-transform: translate(-48%, -48%) rotate(-1deg); transform: var(--final-transform); }
      .card-4 { --final-transform: translate(-5%, -42%) rotate(4deg); transform: var(--final-transform); }
      .card-5 { --final-transform: translate(42%, -25%) rotate(9deg); transform: var(--final-transform); }
      .card-6 { display: none; }
      .handle-blue { left: 5%; top: 7%; }
      .handle-green { right: 2%; top: 12%; }
    }
  `]
})
export class HeroSectionComponent implements AfterViewInit {
  collageReady = false;

  readonly categories = ['Cameras', 'Lenses', 'Lighting', 'Audio', 'Studios', 'Creators'];
  readonly collage = [
    { image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', alt: 'Camera body close up', label: 'Canon R5 kit', price: '₹4.2k/d' },
    { image: 'https://images.unsplash.com/photo-1500634245200-e5245c7574ef?auto=format&fit=crop&w=800&q=80', alt: 'Sony mirrorless camera kit', label: 'Sony A7S III', price: '₹3.9k/d' },
    { image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=800&q=80', alt: 'Professional zoom lens', label: '24-70mm lens', price: '₹1.6k/d' },
    { image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=800&q=80', alt: 'Studio light equipment', label: 'Aputure 600D', price: '₹2.5k/d' },
    { image: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80', alt: 'Photography lens equipment', label: 'Prime lenses', price: '₹1.2k/d' },
    { image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80', alt: 'Wireless audio equipment', label: 'Audio kit', price: '₹900/d' }
  ];

  ngAfterViewInit(): void {
    window.setTimeout(() => {
      this.collageReady = true;
    }, 180);
  }

  getCategory(label: string): string {
    if (label.toLowerCase().includes('lens')) return 'Lenses';
    if (label.toLowerCase().includes('audio')) return 'Audio Equipment';
    if (label.toLowerCase().includes('aputure')) return 'Lighting';
    return 'Cameras';
  }
}
