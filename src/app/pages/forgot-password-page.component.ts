import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

type ResetPasswordField = 'code' | 'newPassword' | 'confirmPassword';
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,64}$/;

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatSnackBarModule, ScrollRevealDirective],
  template: `
    <section class="auth-wrap">
      <div class="reset-shell" appScrollReveal="fade-up">
        <div class="reset-copy">
          <p class="eyebrow">Account recovery</p>
          <h1>Reset your password</h1>
          <p class="muted">Enter your registered email to receive a reset code, then set a fresh password.</p>
        </div>

        @if (formError) {
          <p class="form-alert" role="alert">{{ formError }}</p>
        }

        <form [formGroup]="requestForm" (ngSubmit)="requestCode()">
          <label>
            <span>Email</span>
            <input type="email" placeholder="you@example.com" formControlName="email">
          </label>
          <button class="submit" type="submit" [disabled]="isRequesting">
            {{ isRequesting ? 'Sending code...' : 'Send reset code' }}
          </button>
        </form>

        @if (codeRequested) {
          <form class="reset-form" [formGroup]="resetForm" (ngSubmit)="resetPassword()">
            <label>
              <span>Reset code</span>
              <input placeholder="Enter 6-digit code" formControlName="code">
              @if (resetFieldError('code')) {
                <small class="field-error">{{ resetFieldError('code') }}</small>
              }
            </label>
            <label>
              <span>New password</span>
              <input type="password" placeholder="8+ chars with A-z, 0-9, symbol" formControlName="newPassword">
              @if (resetFieldError('newPassword')) {
                <small class="field-error">{{ resetFieldError('newPassword') }}</small>
              }
            </label>
            <label [class.password-mismatch]="resetSubmitted && !passwordsMatch()">
              <span>Confirm password</span>
              <input type="password" placeholder="Re-enter new password" formControlName="confirmPassword">
              @if (resetFieldError('confirmPassword') || passwordMismatchError()) {
                <small class="field-error">{{ resetFieldError('confirmPassword') || passwordMismatchError() }}</small>
              }
            </label>
            <button class="submit" type="submit" [disabled]="isResetting">
              {{ isResetting ? 'Resetting...' : 'Reset password' }}
            </button>
          </form>
        }

        <a class="back-link" routerLink="/login">Back to login</a>
      </div>
    </section>
  `,
  styles: [`
    .reset-shell {
      background: #fff;
      border: 1px solid rgba(0,0,0,.07);
      border-radius: 24px;
      box-shadow: 0 24px 70px rgba(0,0,0,.09);
      margin: 0 auto;
      max-width: 560px;
      padding: clamp(1.35rem, 4vw, 2.6rem);
    }
    .reset-copy { margin-bottom: 1.4rem; }
    h1 { color: #111; font-size: clamp(2.2rem, 6vw, 4.2rem); letter-spacing: 0; line-height: 1; margin: 0 0 .75rem; }
    .muted { font-size: 1rem; line-height: 1.65; margin: 0; }
    .form-alert {
      background: #fff4f2;
      border: 1px solid rgba(180, 35, 24, .24);
      border-radius: 14px;
      color: #b42318;
      font-size: .9rem;
      font-weight: 800 !important;
      line-height: 1.45;
      margin: 0 0 1rem;
      padding: .85rem 1rem;
    }
    form { display: grid; gap: 1rem; }
    .reset-form { border-top: 1px solid rgba(0,0,0,.08); margin-top: 1.25rem; padding-top: 1.25rem; }
    label { color: #111; display: block; font-size: .82rem; font-weight: 800; }
    label span { display: block; margin-bottom: .55rem; }
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
    input:focus { background: #fff; border-color: rgba(255,151,0,.95); box-shadow: 0 0 0 4px rgba(255,151,0,.18); }
    input.ng-invalid.ng-touched, .password-mismatch input { background: #fff4f2; border-color: rgba(180,35,24,.72); box-shadow: 0 0 0 4px rgba(180,35,24,.12); }
    label:has(input.ng-invalid.ng-touched) span, .password-mismatch span { color: #b42318; }
    .field-error { color: #b42318; display: block; font-size: .78rem; font-weight: 850; line-height: 1.35; margin-top: .45rem; }
    .submit {
      align-items: center;
      background: #111;
      border: 0;
      border-radius: 999px;
      box-shadow: 0 14px 28px rgba(0,0,0,.18);
      color: #fff;
      cursor: pointer;
      display: inline-flex;
      font-size: .96rem;
      font-weight: 800;
      justify-content: center;
      min-height: 50px;
      transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease;
      width: 100%;
    }
    .submit:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #fff; transform: translateY(-2px); }
    .submit:disabled, .submit:disabled:hover { background: #111; color: #fff; cursor: not-allowed; opacity: .68; transform: none; }
    .back-link { color: #111; display: inline-block; font-weight: 900; margin-top: 1.25rem; text-decoration: underline; text-underline-offset: 4px; }
  `]
})
export class ForgotPasswordPageComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isRequesting = false;
  isResetting = false;
  codeRequested = false;
  resetSubmitted = false;
  formError = '';

  readonly requestForm = this.fb.nonNullable.group({
    email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]]
  });

  readonly resetForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.pattern(passwordPattern)]],
    confirmPassword: ['', [Validators.required]]
  });

  requestCode(): void {
    this.formError = '';
    if (this.requestForm.invalid || this.isRequesting) {
      this.requestForm.markAllAsTouched();
      this.formError = 'Please enter your registered email.';
      return;
    }

    this.isRequesting = true;
    this.authService.requestPasswordReset(this.requestForm.getRawValue())
      .pipe(finalize(() => {
        this.isRequesting = false;
      }))
      .subscribe({
        next: (message) => {
          this.codeRequested = true;
          this.snackBar.open(message, 'Close', {
            duration: 4200,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['snackbar-screen-center']
          });
        },
        error: (error) => this.showError(error)
      });
  }

  resetPassword(): void {
    this.resetSubmitted = true;
    this.formError = '';
    const passwordsMatch = this.resetForm.controls.newPassword.value === this.resetForm.controls.confirmPassword.value;
    if (this.resetForm.invalid || !passwordsMatch || this.isResetting) {
      this.resetForm.markAllAsTouched();
      this.formError = passwordsMatch ? 'Please enter the reset code and a valid new password.' : 'New password and confirm password must match.';
      return;
    }

    this.isResetting = true;
    const { code, newPassword } = this.resetForm.getRawValue();
    this.authService.resetPassword({ email: this.requestForm.controls.email.value, code, newPassword })
      .pipe(finalize(() => {
        this.isResetting = false;
      }))
      .subscribe({
        next: (message) => {
          this.resetSubmitted = false;
          this.snackBar.open(message, 'Close', {
            duration: 3200,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['snackbar-screen-center']
          });
          void this.router.navigateByUrl('/login');
        },
        error: (error) => this.showError(error)
      });
  }

  resetFieldError(field: ResetPasswordField): string {
    const control = this.resetForm.controls[field];
    if (!control || (!control.touched && !this.resetSubmitted) || control.valid) {
      return '';
    }

    if (control.hasError('required')) {
      return field === 'code' ? 'Reset code is required.' : `${this.resetFieldLabel(field)} is required.`;
    }

    if (control.hasError('pattern')) {
      return 'Password must be 8-64 characters and include uppercase, lowercase, number, and special character.';
    }

    return '';
  }

  passwordsMatch(): boolean {
    return this.resetForm.controls.newPassword.value === this.resetForm.controls.confirmPassword.value;
  }

  passwordMismatchError(): string {
    return this.resetSubmitted && this.resetForm.controls.confirmPassword.valid && !this.passwordsMatch()
      ? 'Passwords must match.'
      : '';
  }

  private showError(error: unknown): void {
    const message = this.authService.getErrorMessage(error);
    this.formError = message;
    this.snackBar.open(message, 'Close', {
      duration: 3600,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-screen-center']
    });
  }

  private resetFieldLabel(field: ResetPasswordField): string {
    return field === 'newPassword' ? 'New password' : 'Confirm password';
  }
}
