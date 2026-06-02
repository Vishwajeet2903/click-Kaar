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
    <section class="container pb-5">
      <div class="row g-4">
        <div class="col-lg-5">
          <p class="eyebrow">Talk to us</p>
          <h1 class="section-title">Plan a kit for your next shoot.</h1>
          <div class="surface contact-card">
            <p><strong>Email</strong><span>hello&#64;clickkaar.local</span></p>
            <p><strong>Mobile</strong><span>+91 99999 99999</span></p>
            <p><strong>Studio</strong><span>Mumbai · Bengaluru · Delhi NCR</span></p>
          </div>
        </div>
        <div class="col-lg-7">
          <form class="surface form" [formGroup]="form" (ngSubmit)="submit()">
            <input class="form-control" placeholder="Name" formControlName="name">
            <input class="form-control" placeholder="Email" formControlName="email">
            <input class="form-control" placeholder="Shoot type" formControlName="subject">
            <textarea class="form-control" rows="5" placeholder="Message" formControlName="message"></textarea>
            <app-button type="submit">Send Mock Message</app-button>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .contact-card, .form { padding: 1.2rem; }
    .contact-card p { border-bottom: 1px solid rgba(148,163,184,.15); display: grid; gap: .2rem; padding: .8rem 0; }
    .contact-card span { color: #777; }
    .form { display: grid; gap: 1rem; }
  `]
})
export class ContactPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', Validators.required]
  });

  submit(): void {
    this.snackBar.open(this.form.valid ? 'Message received in mock mode' : 'Please complete the form', 'Close', { duration: 2200 });
  }
}
