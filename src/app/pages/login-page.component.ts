import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatSnackBarModule, ScrollRevealDirective],
  template: `
    <section class="login-page">
      <div class="auth-shell">
        <div class="auth-copy" appScrollReveal="slide-right">
          <h1>Welcome to our creator hub.</h1>
          <p class="intro">Manage saved kits, rental bookings, orders, and creator activity from one clean workspace.</p>

          <div class="market-strip" aria-hidden="true">
            <article class="gear-card gear-card-one">
              <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80" alt="">
              <div>
                <strong>Canon R5 kit</strong>
                <span>Live stock</span>
              </div>
            </article>
            <article class="gear-card gear-card-two">
              <img src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80" alt="">
              <div>
                <strong>Prime lenses</strong>
                <span>From INR 899/day</span>
              </div>
            </article>
            <article class="gear-card gear-card-three">
              <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80" alt="">
              <div>
                <strong>Outdoor kits</strong>
                <span>Ready today</span>
              </div>
            </article>
          </div>
        </div>

        <form class="login-form" [formGroup]="form" (ngSubmit)="submit()" appScrollReveal="slide-left" [revealDelay]="120">
          <!-- <p class="eyebrow">Account access</p> -->
          <h2>Log in</h2>

          <button class="google" type="button"><span>G</span> Continue with Google</button>
          <div class="divider"><span>or use email</span></div>

          <label>
            <span>Email</span>
            <input placeholder="you@example.com" formControlName="email">
          </label>

          <label>
            <span>Password</span>
            <input type="password" placeholder="Enter password" formControlName="password">
          </label>

          <a class="forgot" routerLink="/faq">Forgot password?</a>
          <button class="submit" type="submit" [disabled]="isSubmitting">{{ isSubmitting ? 'Logging in...' : 'Log in' }}</button>
          <p class="signup">New to ClickKar? <a routerLink="/register">Create an account</a></p>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .login-page {
      background: #f4f4f2;
      min-height: calc(100vh - 96px);
      padding: clamp(.55rem, 1.2vw, 1rem) clamp(1rem, 2vw, 1.5rem) clamp(1rem, 2vw, 1.5rem);
      transform: translateY(-28px);
    }

    .auth-shell {
      align-items: stretch;
      background: #fdfdfc;
      border-radius: 28px;
      box-shadow: 0 28px 80px rgba(20, 20, 20, .08);
      display: grid;
      gap: clamp(1.5rem, 4vw, 4rem);
      grid-template-columns: minmax(0, 1.1fr) minmax(360px, .8fr);
      min-height: calc(100vh - 112px);
      overflow: hidden;
      padding: clamp(1.1rem, 3.2vw, 3.4rem) clamp(1.4rem, 4vw, 4rem) clamp(1.4rem, 4vw, 4rem);
      position: relative;
    }

    .auth-shell::before {
      background: radial-gradient(circle, rgba(128, 210, 198, .28), transparent 64%);
      content: "";
      height: 420px;
      position: absolute;
      right: -130px;
      top: -150px;
      width: 420px;
    }

    .auth-copy,
    .login-form {
      position: relative;
      z-index: 1;
    }

    .auth-copy {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 620px;
    }

    .eyebrow {
      color: #161616;
      font-size: .78rem;
      font-weight: 800;
      letter-spacing: .22rem;
      margin: 0 0 1rem;
      text-transform: uppercase;
    }

    h1,
    h2 {
      color: #111;
      letter-spacing: 0;
      line-height: .98;
      margin: 0;
    }

    h1 {
      font-size: clamp(3.1rem, 7vw, 6.5rem);
      max-width: 760px;
    }

    h2 {
      font-size: clamp(2.4rem, 4vw, 4rem);
      margin-bottom: 1rem;
    }

    .intro,
    .form-copy,
    .signup {
      color: #5e5e5a;
      font-size: 1rem;
      line-height: 1.65;
      margin: 0;
    }

    .intro {
      margin-top: 1.25rem;
      max-width: 540px;
    }

    .market-strip {
      height: 280px;
      margin-top: 3rem;
      position: relative;
    }

    .gear-card {
      background: #fff;
      border-radius: 24px;
      box-shadow: 0 22px 55px rgba(0, 0, 0, .18);
      height: 230px;
      overflow: hidden;
      position: absolute;
      transition: transform .35s ease, box-shadow .35s ease;
      width: min(300px, 44vw);
    }

    .gear-card:hover {
      box-shadow: 0 28px 70px rgba(0, 0, 0, .22);
      transform: translateY(-8px) rotate(var(--tilt));
    }

    .gear-card img {
      height: 100%;
      object-fit: cover;
      width: 100%;
    }

    .gear-card div {
      align-items: center;
      background: rgba(255, 255, 255, .88);
      border-radius: 999px;
      bottom: 14px;
      display: flex;
      gap: .8rem;
      justify-content: space-between;
      left: 14px;
      padding: .8rem 1rem;
      position: absolute;
      right: 14px;
    }

    .gear-card strong {
      color: #111;
      font-size: .95rem;
    }

    .gear-card span {
      color: #148f7b;
      font-size: .8rem;
      font-weight: 800;
    }

    .gear-card-one {
      --tilt: -8deg;
      left: 0;
      top: 36px;
      transform: rotate(-8deg);
      z-index: 1;
    }

    .gear-card-two {
      --tilt: 3deg;
      left: 24%;
      top: 0;
      transform: rotate(3deg);
      z-index: 2;
    }

    .gear-card-three {
      --tilt: -2deg;
      left: 49%;
      top: 48px;
      transform: rotate(-2deg);
      z-index: 3;
    }

    .login-form {
      align-self: start;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, .06);
      border-radius: 24px;
      box-shadow: 0 18px 60px rgba(0, 0, 0, .08);
      margin-top: clamp(.55rem, 4vw, 3.3rem);
      padding: clamp(.55rem, 3vw, 2.4rem);
    }

    .google,
    .submit {
      align-items: center;
      border: 0;
      border-radius: 999px;
      cursor: pointer;
      display: inline-flex;
      font-size: .96rem;
      font-weight: 800;
      gap: .7rem;
      justify-content: center;
      min-height: 50px;
      transition: transform .25s ease, box-shadow .25s ease, background .25s ease;
      width: 100%;
    }

    .google {
      background: #f6f6f4;
      color: #111;
      margin-top: 1.5rem;
    }

    .google span {
      color: #4285f4;
      font-size: 1.1rem;
      font-weight: 900;
    }

    .google:hover,
    .submit:hover {
      transform: translateY(-2px);
    }

    .submit {
      background: #111;
      box-shadow: 0 14px 28px rgba(0, 0, 0, .18);
      color: #fff;
      margin-top: 1rem;
    }

    .submit:disabled {
      cursor: not-allowed;
      opacity: .68;
      transform: none;
    }

    .submit:hover {
      background: #80d2c6;
      box-shadow: 0 16px 34px rgba(20, 143, 123, .22);
      color: #111;
    }

    .divider {
      align-items: center;
      color: #888;
      display: grid;
      font-size: .82rem;
      gap: 1rem;
      grid-template-columns: 1fr auto 1fr;
      margin: 1.5rem 0;
    }

    .divider::before,
    .divider::after {
      background: #e7e7e2;
      content: "";
      height: 1px;
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
      outline: 0;
      padding: .95rem 1rem;
      transition: border-color .25s ease, box-shadow .25s ease, background .25s ease;
      width: 100%;
    }

    input:focus {
      background: #fff;
      border-color: rgba(128, 210, 198, .95);
      box-shadow: 0 0 0 4px rgba(128, 210, 198, .18);
    }

    input::placeholder {
      color: #a7a7a1;
    }

    .forgot {
      color: #111;
      display: inline-block;
      font-size: .86rem;
      font-weight: 800;
      margin: .1rem 0 .6rem;
      text-decoration: none;
    }

    .signup {
      margin-top: 1.2rem;
      text-align: center;
    }

    .signup a {
      color: #111;
      font-weight: 900;
      text-decoration: underline;
      text-underline-offset: 4px;
    }

    @media (max-width: 900px) {
      .auth-shell {
        grid-template-columns: 1fr;
        min-height: auto;
      }

      .auth-copy {
        min-height: auto;
      }

      .market-strip {
        height: 250px;
      }

      .gear-card {
        width: min(260px, 62vw);
      }

      .gear-card-two {
        left: 28%;
      }

      .gear-card-three {
        left: 48%;
      }
    }

    @media (max-width: 620px) {
      .login-page {
        padding: .75rem;
      }

      .auth-shell {
        border-radius: 20px;
        padding: 1.2rem;
      }

      h1 {
        font-size: clamp(2.6rem, 15vw, 4rem);
      }

      .market-strip {
        height: 220px;
        margin-top: 2rem;
      }

      .gear-card {
        border-radius: 18px;
        height: 190px;
        width: 220px;
      }

      .gear-card div {
        align-items: flex-start;
        border-radius: 16px;
        flex-direction: column;
        gap: .15rem;
      }

      .gear-card-one {
        left: -18px;
      }

      .gear-card-two {
        left: 24%;
      }

      .gear-card-three {
        display: none;
      }

      .login-form {
        border-radius: 20px;
      }
    }
  `]
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  isSubmitting = false;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please enter valid login details', 'Close', { duration: 2200 });
      return;
    }

    this.isSubmitting = true;
    this.authService.login(this.form.getRawValue())
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe({
        next: () => {
          this.snackBar.open('Login successful', 'Close', { duration: 2200 });
          void this.router.navigateByUrl('/dashboard');
        },
        error: (error) => {
          this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3200 });
        }
      });
  }
}
