import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AdminService, EmployeeResponse } from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatSnackBarModule, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Admin" />
    <section class="container admin-page">
      @if (authService.isAdmin()) {
        <div class="admin-shell">
          <div class="admin-copy">
            <p class="eyebrow">Admin workspace</p>
            <h1>Register employees</h1>
            <p class="muted">Create staff accounts for team members who help manage rentals, catalogue work, and customer operations.</p>
          </div>

          <form class="surface employee-form" [formGroup]="form" (ngSubmit)="submit()">
            <h2>Employee details</h2>

            <label>
              <span>Full name</span>
              <input placeholder="Employee name" formControlName="fullName">
            </label>

            <div class="field-grid">
              <label>
                <span>Email</span>
                <input placeholder="employee@clickkar.com" formControlName="email">
              </label>

              <label>
                <span>Mobile</span>
                <input placeholder="10-digit mobile" formControlName="mobile">
              </label>
            </div>

            <label>
              <span>Temporary password</span>
              <input type="password" placeholder="Minimum 6 characters" formControlName="password">
            </label>

            <button type="submit" [disabled]="isSubmitting">{{ isSubmitting ? 'Creating employee...' : 'Create employee' }}</button>
          </form>
        </div>

        @if (createdEmployee) {
          <article class="surface created-card">
            <p class="eyebrow">Created</p>
            <h2>{{ createdEmployee.fullName }}</h2>
            <p class="muted">{{ createdEmployee.email }} - {{ createdEmployee.mobile }}</p>
            <span>{{ createdEmployee.roles.join(', ') }}</span>
          </article>
        }
      } @else {
        <div class="surface access-card">
          <p class="eyebrow">Admin access</p>
          <h1>Please log in as admin to register employees.</h1>
          <a routerLink="/login">Go to login</a>
        </div>
      }
    </section>
  `,
  styles: [`
    .admin-page { padding-bottom: 4rem; }
    .admin-shell { align-items: start; display: grid; gap: 1.25rem; grid-template-columns: minmax(0, .9fr) minmax(420px, 1fr); }
    .admin-copy { padding: clamp(1rem, 3vw, 2rem) 0; }
    .admin-copy h1 { font-size: clamp(3rem, 7vw, 6rem); font-weight: 950; letter-spacing: 0; line-height: .96; margin: 0 0 1rem; }
    .admin-copy p { max-width: 520px; }
    .employee-form, .created-card, .access-card { padding: clamp(1.2rem, 3vw, 2rem); }
    .employee-form { background: #fff; border-radius: 24px; box-shadow: 0 18px 60px rgba(0,0,0,.08); }
    h2 { font-weight: 950; margin: 0 0 1.25rem; }
    .field-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    label { color: #111; display: block; font-size: .82rem; font-weight: 800; margin-bottom: 1rem; }
    label span { display: block; margin-bottom: .55rem; }
    input { background: #f7f7f5; border: 1px solid transparent; border-radius: 16px; color: #111; display: block; font: inherit; font-weight: 600; min-height: 50px; outline: 0; padding: .95rem 1rem; width: 100%; }
    input:focus { background: #fff; border-color: rgba(128,210,198,.95); box-shadow: 0 0 0 4px rgba(128,210,198,.18); }
    button, .access-card a { align-items: center; background: #111; border: 0; border-radius: 999px; color: #fff; display: inline-flex; font-weight: 900; justify-content: center; min-height: 50px; padding: .85rem 1.25rem; width: 100%; }
    button:disabled { cursor: not-allowed; opacity: .68; }
    .created-card { margin-top: 1rem; }
    .created-card span { background: rgba(128,210,198,.2); border-radius: 999px; color: #148f7b; display: inline-flex; font-size: .78rem; font-weight: 900; padding: .4rem .7rem; }
    .access-card { margin: 0 auto; max-width: 680px; text-align: center; }
    .access-card a { margin-top: 1rem; width: auto; }
    @media (max-width: 900px) {
      .admin-shell { grid-template-columns: 1fr; }
    }
    @media (max-width: 620px) {
      .field-grid { gap: 0; grid-template-columns: 1fr; }
    }
  `]
})
export class AdminPageComponent {
  readonly authService = inject(AuthService);

  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  createdEmployee?: EmployeeResponse;
  isSubmitting = false;

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.minLength(10)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please complete valid employee details', 'Close', { duration: 2400 });
      return;
    }

    this.isSubmitting = true;
    this.adminService.createEmployee(this.form.getRawValue())
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe({
        next: (employee) => {
          this.createdEmployee = employee;
          this.form.reset();
          this.snackBar.open('Employee account created', 'Close', { duration: 2600 });
        },
        error: (error) => {
          this.snackBar.open(this.authService.getErrorMessage(error), 'Close', { duration: 3600 });
        }
      });
  }
}
