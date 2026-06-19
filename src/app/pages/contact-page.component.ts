import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppButtonComponent } from '../shared/components/app-button.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatSnackBarModule, AppButtonComponent, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Contact Us" />
    <section class="container contact-page">
      <div class="contact-hero">
        <div class="contact-copy">
          <p class="eyebrow">Contact Clickkaar</p>
          <h1>Plan the right kit before shoot day.</h1>
          <p class="intro">Tell us what you are filming, where you are shooting, and when you need the gear. We will help you shape a rental setup that fits the job.</p>
        </div>

        <div class="surface quick-card">
          <span>Fast support</span>
          <strong>Same-day gear guidance</strong>
          <p>For cameras, lenses, lighting, audio, studios, and creator packages.</p>
        </div>
      </div>

      <div class="contact-layout">
        <aside class="contact-side">
          <div class="surface contact-card">
            <div>
              <small>Email</small>
              <strong>support&#64;clickkaar.com</strong>
              <span>Send requirements, references, and booking questions.</span>
            </div>
            <div>
              <small>Mobile</small>
              <strong>+91 9096820033</strong>
              <span>Call or WhatsApp for urgent rental planning.</span>
            </div>
            <div>
              <small>Studio network</small>
              <strong>Pune</strong>
              <span>Pickup and coordination support for active cities.</span>
            </div>
          </div>

          <div class="support-grid" aria-label="Common contact topics">
            <span>Camera kits</span>
            <span>Lighting plans</span>
            <span>Audio rentals</span>
            <span>Studio setup</span>
          </div>
        </aside>

        <form class="surface contact-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-head">
            <span>Rental enquiry</span>
            <h2>Share your shoot details</h2>
          </div>
          @if (formError) {
            <p class="form-alert" role="alert">{{ formError }}</p>
          }
          <div class="form-grid">
            <label>
              Name
              <input class="form-control" placeholder="Your name" formControlName="name">
            </label>
            <label>
              Email
              <input class="form-control" placeholder="you@example.com" formControlName="email">
            </label>
          </div>
          <label>
            Shoot type
            <input class="form-control" placeholder="Wedding, product shoot, podcast, event..." formControlName="subject">
          </label>
          <label>
            Message
            <textarea class="form-control" rows="6" placeholder="Tell us the dates, location, gear you need, and any references." formControlName="message"></textarea>
          </label>
          <div class="form-actions">
            <app-button type="submit">Send Message</app-button>
            <p>Mock mode for now. Backend persistence can be connected when the contact endpoint is ready.</p>
          </div>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .contact-page { display: grid; gap: clamp(1.2rem, 3vw, 2rem); padding-bottom: 4rem !important; }
    .contact-hero { align-items: end; display: grid; gap: 1.2rem; grid-template-columns: minmax(0, 1fr) minmax(260px, 360px); }
    .contact-copy { max-width: 760px; }
    h1 { color: #111; font-size: clamp(2.6rem, 6vw, 5.8rem); font-weight: 950; letter-spacing: 0; line-height: .92; margin: .35rem 0 1rem; word-spacing: .06em; }
    .intro { color: #4a4a47; font-size: clamp(1rem, 1.5vw, 1.12rem); line-height: 1.7; margin: 0; max-width: 660px; }
    .quick-card { background: #111; color: #fff; padding: 1.15rem; }
    .quick-card span { color: #ff9700; display: block; font-size: .72rem; font-weight: 950; letter-spacing: .18em; text-transform: uppercase; }
    .quick-card strong { display: block; font-size: clamp(1.35rem, 2.5vw, 2rem); line-height: 1; margin: .65rem 0; }
    .quick-card p { color: rgba(255,255,255,.72); line-height: 1.55; margin: 0; }
    .contact-layout { align-items: start; display: grid; gap: 1rem; grid-template-columns: .85fr 1.15fr; }
    .contact-side { display: grid; gap: 1rem; }
    .contact-card { display: grid; gap: .75rem; padding: 1rem; }
    .contact-card div { background: #fff; border: 1px solid rgba(17,17,17,.07); border-radius: 16px; display: grid; gap: .32rem; padding: 1rem; }
    .contact-card small, .form-head span { color: #ff9700; font-size: .72rem; font-weight: 950; letter-spacing: .16em; text-transform: uppercase; }
    .contact-card strong { color: #111; font-size: 1.08rem; line-height: 1.18; overflow-wrap: anywhere; word-spacing: .06em; }
    .contact-card span { color: #666; line-height: 1.5; }
    .support-grid { display: grid; gap: .65rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .support-grid span { background: #fff7ec; border: 1px solid rgba(255,151,0,.24); border-radius: 999px; color: #111; font-size: .82rem; font-weight: 900; min-height: 42px; padding: .65rem .75rem; text-align: center; }
    .contact-form { display: grid; gap: 1rem; padding: clamp(1rem, 2.4vw, 1.5rem); }
    .form-head { margin-bottom: .1rem; }
    .form-head h2 { color: #111; font-size: clamp(1.8rem, 3.2vw, 3rem); font-weight: 950; line-height: 1; margin: .35rem 0 0; word-spacing: .06em; }
    .form-alert { background: #fff4f2; border: 1px solid rgba(180,35,24,.24); border-radius: 14px; color: #b42318; font-size: .9rem; font-weight: 800; line-height: 1.45; margin: 0; padding: .85rem 1rem; }
    .form-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    label { color: #111; display: grid; font-size: .8rem; font-weight: 900; gap: .42rem; }
    .form-control { border-radius: 16px; font-weight: 700; min-height: 52px; padding: .9rem 1rem; }
    .form-control::placeholder { color: #8a8a86; opacity: 1; }
    textarea.form-control { resize: vertical; }
    .form-actions { align-items: center; display: flex; gap: 1rem; justify-content: space-between; }
    .form-actions p { color: #777; font-size: .82rem; line-height: 1.45; margin: 0; max-width: 360px; }
    @media (max-width: 900px) {
      .contact-hero, .contact-layout { grid-template-columns: 1fr; }
      .quick-card { max-width: 480px; }
    }
    @media (max-width: 560px) {
      .form-grid, .support-grid { grid-template-columns: 1fr; }
      .form-actions { align-items: stretch; flex-direction: column; }
      .form-actions p { max-width: none; }
    }
  `]
})
export class ContactPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  formError = '';
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', Validators.required]
  });

  submit(): void {
    this.formError = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = 'Please complete the form.';
      return;
    }

    this.snackBar.open('Message received in mock mode', 'Close', {
      duration: 2200,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-success-top']
    });
  }
}
