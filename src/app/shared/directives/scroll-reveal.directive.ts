import { AfterViewInit, Directive, ElementRef, Input, inject } from '@angular/core';

type RevealAnimation = 'fade-up' | 'slide-left' | 'slide-right' | 'scale';

const AOS_ANIMATION: Record<RevealAnimation, string> = {
  'fade-up': 'fade-up',
  'slide-left': 'fade-right',
  'slide-right': 'fade-left',
  scale: 'zoom-in'
};

@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements AfterViewInit {
  @Input('appScrollReveal') animation: RevealAnimation = 'fade-up';
  @Input() revealDelay = 0;
  @Input() revealStagger = 0;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  ngAfterViewInit(): void {
    const nativeElement = this.element.nativeElement;
    nativeElement.setAttribute('data-aos', AOS_ANIMATION[this.animation]);
    nativeElement.setAttribute('data-aos-delay', String(this.revealDelay + this.revealStagger));
    nativeElement.setAttribute('data-aos-duration', '850');
    nativeElement.setAttribute('data-aos-easing', 'ease-out-cubic');
    nativeElement.setAttribute('data-aos-once', 'true');
  }
}
