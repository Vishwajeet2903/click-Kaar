import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

type DocumentKey = 'photo' | 'drivingLicense' | 'electricityBill' | 'rentAgreement';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatSnackBarModule, ScrollRevealDirective],
  template: `
    <section class="register-page">
      <div class="register-shell">
        <div class="visual-panel" appScrollReveal="slide-right">
          <figure class="hero-photo">
            <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1100&q=85" alt="">
          </figure>
          <div class="visual-copy">
            <p class="eyebrow">Join ClickKar</p>
            <h1>Create your verified rental profile.</h1>
            <p>Complete your profile once and keep bookings, rentals, and verification details ready for every shoot.</p>
          </div>
        </div>

        <form class="register-form" [formGroup]="form" (ngSubmit)="submit()" appScrollReveal="slide-left" [revealDelay]="120">
          <div class="form-head">
            <p class="eyebrow">Start renting</p>
            <h2>Create account</h2>
          </div>

          <section class="form-section">
            <h3>Personal details</h3>
            <div class="field-grid">
              <label>
                <span>First name</span>
                <input placeholder="First name" formControlName="firstName" autocomplete="given-name">
              </label>
              <label>
                <span>Last name</span>
                <input placeholder="Last name" formControlName="lastName" autocomplete="family-name">
              </label>
              <label>
                <span>Email</span>
                <input type="email" placeholder="you@example.com" formControlName="email" autocomplete="email">
              </label>
              <label>
                <span>Gender</span>
                <select formControlName="gender">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </label>
              <label>
                <span>Date of birth</span>
                <input type="date" formControlName="dob" autocomplete="bday">
              </label>
              <label>
                <span>Phone number</span>
                <input placeholder="10-digit phone" formControlName="phoneNumber" autocomplete="tel">
              </label>
              <label>
                <span>Alternate contact number</span>
                <input placeholder="Alternate number" formControlName="alternateContactNumber" autocomplete="tel">
              </label>
              <label>
                <span>Active social media profile</span>
                <input placeholder="Instagram, LinkedIn, website..." formControlName="socialMediaProfile">
              </label>
            </div>
          </section>

          <section class="form-section">
            <h3>Address</h3>
            <label>
              <span>Current address</span>
              <textarea placeholder="House number, street, area" formControlName="currentAddress" autocomplete="street-address"></textarea>
            </label>
            <div class="field-grid">
              <label>
                <span>City</span>
                <input placeholder="City" formControlName="city" autocomplete="address-level2">
              </label>
              <label>
                <span>State</span>
                <input placeholder="State" formControlName="state" autocomplete="address-level1">
              </label>
              <label>
                <span>Pincode</span>
                <input placeholder="Pincode" formControlName="pincode" autocomplete="postal-code">
              </label>
              <label>
                <span>Country</span>
                <input placeholder="Country" formControlName="country" autocomplete="country-name">
              </label>
              <label>
                <span>Residence type</span>
                <select formControlName="residenceType">
                  <option value="">Select residence</option>
                  <option value="Owned">Owned</option>
                  <option value="Rented">Rented</option>
                  <option value="Family home">Family home</option>
                  <option value="Company provided">Company provided</option>
                </select>
              </label>
            </div>
          </section>

          <section class="form-section">
            <h3>Work details</h3>
            <div class="field-grid">
              <label>
                <span>Occupation</span>
                <input placeholder="Photographer, filmmaker..." formControlName="occupation">
              </label>
              <label>
                <span>Company / organization</span>
                <input placeholder="Company or organization" formControlName="companyName">
              </label>
            </div>
          </section>

          <section class="form-section">
            <h3>Documents</h3>
            <div class="field-grid">
              <label class="file-field">
                <span>Photo</span>
                <input type="file" accept="image/*" (change)="setFile('photo', $event)">
                <b>{{ selectedFiles.photo?.name || 'Choose file' }}</b>
              </label>
              <label class="file-field">
                <span>Driving license</span>
                <input type="file" accept="image/*,.pdf" (change)="setFile('drivingLicense', $event)">
                <b>{{ selectedFiles.drivingLicense?.name || 'Choose file' }}</b>
              </label>
              <label class="file-field">
                <span>Electricity bill</span>
                <input type="file" accept="image/*,.pdf" (change)="setFile('electricityBill', $event)">
                <b>{{ selectedFiles.electricityBill?.name || 'Choose file' }}</b>
              </label>
              <label class="file-field">
                <span>Rent agreement</span>
                <input type="file" accept="image/*,.pdf" (change)="setFile('rentAgreement', $event)">
                <b>{{ selectedFiles.rentAgreement?.name || 'Choose file' }}</b>
              </label>
            </div>
          </section>

          <section class="form-section">
            <h3>Security</h3>
            <div class="field-grid">
              <label>
                <span>Password</span>
                <input type="password" placeholder="Create password" formControlName="password" autocomplete="new-password">
              </label>
              <label>
                <span>Confirm password</span>
                <input type="password" placeholder="Repeat password" formControlName="confirmPassword" autocomplete="new-password">
              </label>
            </div>
          </section>

          <button class="submit" type="submit" [disabled]="isSubmitting">{{ isSubmitting ? 'Creating account...' : 'Create account' }}</button>
          <p class="signin">Already have an account? <a routerLink="/login">Log in</a></p>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .register-page { background: #f4f4f2; min-height: calc(100vh - 96px); padding: clamp(.55rem, 1.2vw, 1rem) clamp(1rem, 2vw, 1.5rem) clamp(1rem, 2vw, 1.5rem); transform: translateY(-28px); }
    .register-shell { background: #fdfdfc; border-radius: 28px; box-shadow: 0 28px 80px rgba(20,20,20,.08); display: grid; gap: clamp(1.4rem, 3vw, 3rem); grid-template-columns: minmax(280px, .6fr) minmax(0, 1fr); min-height: calc(100vh - 112px); overflow: hidden; padding: clamp(1.1rem, 3vw, 3rem); position: relative; }
    .register-shell::before { background: radial-gradient(circle, rgba(255,151,0,.24), transparent 64%); content: ""; height: 420px; position: absolute; right: -130px; top: -150px; width: 420px; }
    .visual-panel, .register-form { position: relative; z-index: 1; }
    .visual-panel { display: flex; flex-direction: column; gap: 2rem; justify-content: space-between; min-height: 640px; }
    .hero-photo { border-radius: 24px; box-shadow: 0 28px 70px rgba(0,0,0,.18); height: min(48vh, 460px); margin: 0; overflow: hidden; }
    .hero-photo img { height: 100%; object-fit: cover; width: 100%; }
    .visual-copy p, .signin { color: #5e5e5a; line-height: 1.6; margin: 0; }
    .eyebrow { color: #111; font-size: .72rem; font-weight: 900; letter-spacing: .22rem; margin: 0 0 .8rem; text-transform: uppercase; }
    h1, h2, h3 { color: #111; letter-spacing: 0; margin: 0; }
    h1 { font-size: clamp(2.4rem, 4.8vw, 5.1rem); font-weight: 950; line-height: .98; }
    h2 { font-size: clamp(2rem, 3vw, 3.2rem); font-weight: 950; line-height: 1; }
    h3 { font-size: 1rem; font-weight: 950; margin-bottom: 1rem; }
    .visual-copy p { font-size: 1rem; margin-top: 1rem; max-width: 520px; }
    .register-form { align-self: start; background: #fff; border: 1px solid rgba(0,0,0,.06); border-radius: 24px; box-shadow: 0 18px 60px rgba(0,0,0,.08); max-height: calc(100vh - 150px); overflow: auto; padding: clamp(1.1rem, 2.5vw, 2.2rem); }
    .form-head { margin-bottom: 1.3rem; }
    .form-section { border-top: 1px solid rgba(17,17,17,.08); padding-top: 1.15rem; }
    .form-section + .form-section { margin-top: 1.15rem; }
    .field-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    label { color: #111; display: block; font-size: .82rem; font-weight: 800; margin-bottom: 1rem; }
    label span { display: block; margin-bottom: .55rem; }
    input, select, textarea { background: #f7f7f5; border: 1px solid transparent; border-radius: 14px; color: #111; display: block; font: inherit; font-weight: 600; min-height: 50px; outline: 0; padding: .9rem 1rem; transition: border-color .25s ease, box-shadow .25s ease, background .25s ease; width: 100%; }
    textarea { min-height: 94px; resize: vertical; }
    input:focus, select:focus, textarea:focus { background: #fff; border-color: rgba(255,151,0,.95); box-shadow: 0 0 0 4px rgba(255,151,0,.18); }
    input::placeholder, textarea::placeholder { color: #a7a7a1; }
    .file-field input { height: 1px; opacity: 0; padding: 0; position: absolute; width: 1px; }
    .file-field b { align-items: center; background: #f7f7f5; border: 1px dashed rgba(17,17,17,.22); border-radius: 14px; color: #5e5e5a; display: flex; font-size: .82rem; font-weight: 800; min-height: 50px; overflow: hidden; padding: .9rem 1rem; text-overflow: ellipsis; white-space: nowrap; }
    .file-field:hover b { border-color: rgba(255,151,0,.95); color: #111; }
    .submit { align-items: center; background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; cursor: pointer; display: inline-flex; font-size: .96rem; font-weight: 900; justify-content: center; margin-top: .4rem; min-height: 52px; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; width: 100%; }
    .submit:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #111; transform: translateY(-2px); }
    .submit:disabled, .submit:disabled:hover { background: #111; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; cursor: not-allowed; opacity: .68; transform: none; }
    .signin { margin-top: 1.2rem; text-align: center; }
    .signin a { color: #111; font-weight: 900; text-decoration: underline; text-underline-offset: 4px; }
    @media (max-width: 980px) {
      .register-shell { grid-template-columns: 1fr; min-height: auto; }
      .visual-panel { min-height: auto; }
      .register-form { max-height: none; }
    }
    @media (max-width: 620px) {
      .register-page { padding: .75rem; }
      .register-shell { border-radius: 20px; padding: 1.2rem; }
      .hero-photo { border-radius: 18px; height: 260px; }
      .field-grid { gap: 0; grid-template-columns: 1fr; }
      h1 { font-size: clamp(2.35rem, 13vw, 3.6rem); }
      .register-form { border-radius: 20px; }
    }
  `]
})
export class RegisterPageComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  isSubmitting = false;
  readonly selectedFiles: Partial<Record<DocumentKey, File>> = {};

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    gender: ['', Validators.required],
    dob: ['', Validators.required],
    phoneNumber: ['', [Validators.required, Validators.minLength(10)]],
    alternateContactNumber: [''],
    currentAddress: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', Validators.required],
    country: ['', Validators.required],
    residenceType: ['', Validators.required],
    occupation: ['', Validators.required],
    companyName: ['', Validators.required],
    socialMediaProfile: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  setFile(key: DocumentKey, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFiles[key] = file;
    }
  }

  submit(): void {
    const matches = this.form.value.password === this.form.value.confirmPassword;
    const hasDocuments = this.selectedFiles.photo && this.selectedFiles.drivingLicense && this.selectedFiles.electricityBill && this.selectedFiles.rentAgreement;
    if (this.form.invalid || !matches || !hasDocuments || this.isSubmitting) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please complete all fields, documents, and match passwords', 'Close', { duration: 2600 });
      return;
    }

    const { confirmPassword, ...details } = this.form.getRawValue();
    this.isSubmitting = true;
    this.authService.register({
      ...details,
      photo: this.selectedFiles.photo!,
      drivingLicense: this.selectedFiles.drivingLicense!,
      electricityBill: this.selectedFiles.electricityBill!,
      rentAgreement: this.selectedFiles.rentAgreement!
    })
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
