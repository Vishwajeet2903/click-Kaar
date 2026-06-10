import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatSnackBarModule, ScrollRevealDirective],
  template: `
    <section class="register-page">
      <div class="register-shell">
        <div class="visual-panel" appScrollReveal="slide-right">
          <div class="photo-stack" aria-hidden="true">
            <figure class="hero-photo">
              <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1100&q=85" alt="">
            </figure>
            <article class="kit-card">
              <img src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=500&q=80" alt="">
              <div>
                <strong>Creator kit</strong>
                <span>Ready in 2 hours</span>
              </div>
            </article>
            <article class="stat-chip">
              <strong>48+</strong>
              <span>verified rental kits</span>
            </article>
          </div>

          <div class="visual-copy">
            <p class="eyebrow">Join ClickKar</p>
            <h1>Build your next shoot from one trusted rental desk.</h1>
            <p>Save your details once, reserve cameras faster, and keep every booking in your creator workspace.</p>
          </div>
        </div>

        <form class="register-form" [formGroup]="form" (ngSubmit)="submit()" appScrollReveal="slide-left" [revealDelay]="120">
          <p class="eyebrow">Start renting</p>
          <h2>Create account</h2>

          <div class="field-grid">
            <label>
              <span>Name</span>
              <input placeholder="Your full name" formControlName="name">
            </label>

            <label>
              <span>Mobile</span>
              <input placeholder="10-digit mobile" formControlName="mobile">
            </label>
          </div>

          <label>
            <span>Email</span>
            <input placeholder="you@example.com" formControlName="email">
          </label>

          <div class="field-grid">
            <label>
              <span>Password</span>
              <input type="password" placeholder="Create password" formControlName="password">
            </label>

            <label>
              <span>Confirm</span>
              <input type="password" placeholder="Repeat password" formControlName="confirmPassword">
            </label>
          </div>

          <button class="submit" type="submit" [disabled]="isSubmitting">{{ isSubmitting ? 'Creating account...' : 'Create account' }}</button>
          <p class="signin">Already have an account? <a routerLink="/login">Log in</a></p>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .register-page {
      background: #f4f4f2;
      min-height: calc(100vh - 96px);
      padding: clamp(.55rem, 1.2vw, 1rem) clamp(1rem, 2vw, 1.5rem) clamp(1rem, 2vw, 1.5rem);
      transform: translateY(-28px);
    }

    .register-shell {
      background: #fdfdfc;
      border-radius: 28px;
      box-shadow: 0 28px 80px rgba(20, 20, 20, .08);
      display: grid;
      gap: clamp(1.5rem, 4vw, 4rem);
      grid-template-columns: minmax(0, 1fr) minmax(390px, .86fr);
      min-height: calc(100vh - 112px);
      overflow: hidden;
      padding: clamp(1.1rem, 3.2vw, 3.4rem) clamp(1.4rem, 4vw, 4rem) clamp(1.4rem, 4vw, 4rem);
      position: relative;
    }

    .register-shell::before {
      background: radial-gradient(circle, rgba(255, 151, 0, .28), transparent 64%);
      content: "";
      height: 420px;
      position: absolute;
      right: -130px;
      top: -150px;
      width: 420px;
    }

    .visual-panel,
    .register-form {
      position: relative;
      z-index: 1;
    }

    .visual-panel {
      display: flex;
      flex-direction: column;
      gap: clamp(1.5rem, 4vw, 3rem);
      justify-content: space-between;
      min-height: 620px;
    }

    .photo-stack {
      min-height: 390px;
      position: relative;
    }

    .hero-photo {
      border-radius: 24px;
      box-shadow: 0 28px 70px rgba(0, 0, 0, .18);
      height: clamp(320px, 42vw, 460px);
      margin: 0;
      overflow: hidden;
      width: min(560px, 100%);
    }

    .hero-photo img,
    .kit-card img {
      height: 100%;
      object-fit: cover;
      width: 100%;
    }

    .kit-card,
    .stat-chip {
      background: rgba(255, 255, 255, .92);
      box-shadow: 0 22px 55px rgba(0, 0, 0, .16);
      position: absolute;
    }

    .kit-card {
      border-radius: 22px;
      bottom: 8px;
      display: grid;
      grid-template-columns: 92px 1fr;
      min-height: 108px;
      overflow: hidden;
      right: clamp(0rem, 4vw, 3rem);
      width: min(310px, 72vw);
    }

    .kit-card div {
      align-self: center;
      padding: .9rem 1rem;
    }

    .kit-card strong,
    .stat-chip strong {
      color: #111;
      display: block;
      font-weight: 950;
    }

    .kit-card span,
    .stat-chip span,
    .visual-copy p,
    .signin {
      color: #5e5e5a;
      line-height: 1.6;
      margin: 0;
    }

    .kit-card span {
      color: #ff9700;
      font-size: .82rem;
      font-weight: 900;
    }

    .stat-chip {
      border-radius: 999px;
      left: clamp(.8rem, 4vw, 3rem);
      padding: .95rem 1.25rem;
      top: clamp(1rem, 4vw, 2.5rem);
    }

    .stat-chip strong {
      font-size: 1.65rem;
      line-height: 1;
    }

    .stat-chip span {
      font-size: .78rem;
      font-weight: 800;
    }

    .eyebrow {
      color: #111;
      font-size: .72rem;
      font-weight: 900;
      letter-spacing: .22rem;
      margin: 0 0 .9rem;
      text-transform: uppercase;
    }

    h1,
    h2 {
      color: #111;
      letter-spacing: 0;
      margin: 0;
    }

    h1 {
      font-size: clamp(2.8rem, 6.2vw, 5.8rem);
      font-weight: 950;
      line-height: .98;
      max-width: 760px;
    }

    h2 {
      font-size: clamp(2.25rem, 3.8vw, 3.8rem);
      font-weight: 950;
      line-height: 1;
      margin-bottom: 1.45rem;
    }

    .visual-copy p {
      font-size: 1rem;
      margin-top: 1.1rem;
      max-width: 560px;
    }

    .register-form {
      align-self: center;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, .06);
      border-radius: 24px;
      box-shadow: 0 18px 60px rgba(0, 0, 0, .08);
      padding: clamp(1.1rem, 3vw, 2.4rem);
    }

    .field-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    label {
      color: #111;
      display: block;
      font-size: .82rem;
      font-weight: 800;
      margin-bottom: 1rem;
    }

    label span {
      display: block;
      margin-bottom: .55rem;
    }

    input {
      background: #f7f7f5;
      border: 1px solid transparent;
      border-radius: 16px;
      color: #111;
      display: block;
      font: inherit;
      font-weight: 600;
      min-height: 50px;
      outline: 0;
      padding: .95rem 1rem;
      transition: border-color .25s ease, box-shadow .25s ease, background .25s ease;
      width: 100%;
    }

    input:focus {
      background: #fff;
      border-color: rgba(255, 151, 0, .95);
      box-shadow: 0 0 0 4px rgba(255, 151, 0, .18);
    }

    input::placeholder {
      color: #a7a7a1;
    }

    .submit {
      align-items: center;
      background: #111;
      border: 0;
      border-radius: 999px;
      box-shadow: 0 14px 28px rgba(0, 0, 0, .18);
      color: #fff;
      cursor: pointer;
      display: inline-flex;
      font-size: .96rem;
      font-weight: 900;
      justify-content: center;
      margin-top: .4rem;
      min-height: 52px;
      transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease;
      width: 100%;
    }

    .submit:hover {
      background: #ff9700;
      box-shadow: 0 16px 34px rgba(255, 151, 0, .22);
      color: #111;
      transform: translateY(-2px);
    }

    .submit:disabled,
    .submit:disabled:hover {
      background: #111;
      box-shadow: 0 14px 28px rgba(0, 0, 0, .18);
      color: #fff;
      cursor: not-allowed;
      opacity: .68;
      transform: none;
    }

    .signin {
      margin-top: 1.2rem;
      text-align: center;
    }

    .signin a {
      color: #111;
      font-weight: 900;
      text-decoration: underline;
      text-underline-offset: 4px;
    }

    @media (max-width: 980px) {
      .register-shell {
        grid-template-columns: 1fr;
        min-height: auto;
      }

      .visual-panel {
        min-height: auto;
      }
    }

    @media (max-width: 620px) {
      .register-page {
        padding: .75rem;
      }

      .register-shell {
        border-radius: 20px;
        padding: 1.2rem;
      }

      .photo-stack {
        min-height: 300px;
      }

      .hero-photo {
        border-radius: 18px;
        height: 300px;
      }

      .kit-card {
        grid-template-columns: 78px 1fr;
        min-height: 92px;
        right: 0;
      }

      .stat-chip {
        left: .85rem;
        top: .85rem;
      }

      .field-grid {
        gap: 0;
        grid-template-columns: 1fr;
      }

      h1 {
        font-size: clamp(2.45rem, 14vw, 3.8rem);
      }

      .register-form {
        border-radius: 20px;
      }
    }
  `]
})
export class RegisterPageComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  isSubmitting = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.minLength(10)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  submit(): void {
    const matches = this.form.value.password === this.form.value.confirmPassword;
    if (this.form.invalid || !matches || this.isSubmitting) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please complete all fields and match passwords', 'Close', { duration: 2400 });
      return;
    }

    const { name, email, mobile, password } = this.form.getRawValue();
    this.isSubmitting = true;
    this.authService.register({ fullName: name, email, mobile, password })
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe({
        next: () => {
          this.snackBar.open('Registration successful', 'Close', { duration: 2400 });
          void this.router.navigateByUrl('/dashboard');
        },
        error: (error) => {
          this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 });
        }
      });
  }
}
