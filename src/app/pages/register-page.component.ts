import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppButtonComponent } from '../shared/components/app-button.component';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatSnackBarModule, AppButtonComponent, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Register" />
    <section class="auth-wrap container">
      <form class="surface auth" [formGroup]="form" (ngSubmit)="submit()">
        <p class="eyebrow">Start renting</p>
        <h1>Create account</h1>
        <input class="form-control" placeholder="Name" formControlName="name">
        <input class="form-control" placeholder="Email" formControlName="email">
        <input class="form-control" placeholder="Mobile" formControlName="mobile">
        <input class="form-control" type="password" placeholder="Password" formControlName="password">
        <input class="form-control" type="password" placeholder="Confirm Password" formControlName="confirmPassword">
        <app-button type="submit">Register</app-button>
        <p class="muted">Already have an account? <a routerLink="/login">Login</a></p>
      </form>
    </section>
  `,
  styles: [`
    .auth-wrap { display: grid; min-height: 62vh; place-items: center; padding-bottom: 4rem; }
    .auth { display: grid; gap: 1rem; max-width: 520px; padding: 1.5rem; width: 100%; }
    h1 { font-weight: 950; }
    a { color: #ff9700; font-weight: 900; }
  `]
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.minLength(10)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  submit(): void {
    const matches = this.form.value.password === this.form.value.confirmPassword;
    this.snackBar.open(this.form.valid && matches ? 'Mock registration successful' : 'Please complete all fields and match passwords', 'Close', { duration: 2400 });
  }
}
