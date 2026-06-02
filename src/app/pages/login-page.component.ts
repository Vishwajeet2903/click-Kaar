import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppButtonComponent } from '../shared/components/app-button.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatSnackBarModule, AppButtonComponent],
  template: `
    <section class="login-page">
      <div class="login-brand"><span>ck</span> ClickKar</div>
      <form class="login-form" [formGroup]="form" (ngSubmit)="submit()">
        <h1>Welcome Back, Ojas</h1>
        <p>Welcome back please enter your details.</p>
        <button class="google" type="button"><span>G</span> Log in with Google</button>
        <div class="divider"><span>or</span></div>
        <input placeholder="Email" formControlName="email">
        <input type="password" placeholder="Password" formControlName="password">
        <a class="forgot" routerLink="/faq">Forgot Password?</a>
        <app-button type="submit">Log in</app-button>
        <p class="signup">Don't have account? <a routerLink="/register">Sign up for free</a></p>
      </form>
      <div class="login-art" aria-hidden="true">
        <div class="login-blob"></div>
        <div class="person-shape"></div>
      </div>
    </section>
  `,
  styles: [`
    .login-page { background: #fff; min-height: 100vh; overflow: hidden; position: relative; }
    .login-brand { align-items: center; color: #d99411; display: flex; font-size: 1.1rem; font-weight: 700; gap: .75rem; left: 10vw; letter-spacing: .42rem; position: absolute; top: 3rem; z-index: 2; }
    .login-brand span { align-items: center; background: #ff9700; color: #fff; display: inline-flex; height: 44px; justify-content: center; letter-spacing: 0; width: 44px; }
    .login-form { left: 10vw; max-width: 520px; position: absolute; top: 26vh; width: 34vw; z-index: 2; }
    h1 { color: #171717; font-size: clamp(2rem, 3vw, 2.7rem); font-weight: 600; margin: 0 0 .65rem; }
    h1::after { background: #d8a43b; content: ""; display: inline-block; height: 1px; margin-left: .7rem; vertical-align: middle; width: 90px; }
    p { color: #777; font-size: .9rem; margin-bottom: 2rem; }
    .google { align-items: center; background: #fff; border: 1px solid #d8a43b; color: #171717; display: flex; font-size: 1.05rem; gap: .7rem; justify-content: center; min-height: 46px; width: 100%; }
    .google span { color: #4285f4; font-weight: 900; }
    .divider { align-items: center; color: #777; display: grid; gap: 1rem; grid-template-columns: 1fr auto 1fr; margin: 1.6rem 0 2.4rem; }
    .divider::before, .divider::after { background: #dddddd; content: ""; height: 1px; }
    input { border: 0; border-bottom: 1px solid #171717; color: #171717; display: block; font-size: 1rem; margin-bottom: 1.8rem; outline: 0; padding: .55rem .1rem; width: 100%; }
    input::placeholder { color: #d7bd79; }
    .forgot { color: #171717; display: inline-block; font-size: .82rem; margin: -.8rem 0 2rem; }
    .signup { color: #777; margin-top: 1rem; text-align: center; }
    .signup a { color: #171717; font-weight: 700; text-decoration: underline; }
    .login-art { bottom: 0; position: absolute; right: 0; top: 0; width: 55vw; }
    .login-blob { background: #ff9700; clip-path: polygon(38% 0, 100% 0, 100% 100%, 22% 100%, 10% 62%, 18% 36%); inset: 0; position: absolute; }
    .person-shape { background: #050505; bottom: 0; clip-path: polygon(39% 5%, 51% 4%, 60% 12%, 61% 27%, 56% 40%, 64% 52%, 76% 100%, 49% 100%, 45% 70%, 37% 100%, 20% 100%, 28% 57%, 24% 45%, 16% 43%, 15% 35%, 28% 31%, 34% 20%); height: 72vh; left: 10vw; position: absolute; width: 34vw; }
    .person-shape::before { background: #050505; clip-path: polygon(0 38%, 58% 0, 100% 28%, 78% 100%, 0 72%); content: ""; height: 13vh; left: -9vw; position: absolute; top: 24vh; width: 14vw; }
    @media (max-width: 900px) {
      .login-form { left: 6vw; top: 19vh; width: 88vw; }
      .login-brand { left: 6vw; }
      .login-art { opacity: .12; width: 100vw; }
    }
  `]
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    this.snackBar.open(this.form.valid ? 'Mock login successful' : 'Please enter valid login details', 'Close', { duration: 2200 });
  }
}
