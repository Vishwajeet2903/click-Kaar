import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

type DocumentKey = 'photo' | 'drivingLicense' | 'electricityBill' | 'rentAgreement' | 'companyBonafideLetter';
type RegisterControlName =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'gender'
  | 'dob'
  | 'phoneNumber'
  | 'alternateContactNumber'
  | 'currentAddress'
  | 'city'
  | 'state'
  | 'pincode'
  | 'country'
  | 'residenceType'
  | 'occupation'
  | 'companyName'
  | 'socialMediaProfile'
  | 'password'
  | 'confirmPassword';

interface PostalPincodeResponse {
  Status: string;
  PostOffice?: Array<{
    District: string;
    State: string;
  }>;
}

const namePattern = /^[A-Za-z][A-Za-z .'-]*$/;
const locationPattern = /^[A-Za-z][A-Za-z .'-]*$/;
const phonePattern = /^[6-9]\d{9}$/;
const pincodePattern = /^\d{6}$/;
const socialProfilePattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$|^@?[A-Za-z0-9._-]{2,}$/;
const emailPattern = /^(?!.*\.\.)[A-Za-z0-9_%+-]+(?:\.[A-Za-z0-9_%+-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,64}$/;

function minimumAge(years: number) {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return { invalidDate: true };
    }

    const latestAllowedDate = new Date();
    latestAllowedDate.setFullYear(latestAllowedDate.getFullYear() - years);
    latestAllowedDate.setHours(0, 0, 0, 0);
    return date <= latestAllowedDate ? null : { minimumAge: { years } };
  };
}

function notFutureDate(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }

  const date = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) || date > today ? { futureDate: true } : null;
}

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
            <p class="eyebrow">Join Click-Kaar</p>
            <h1>Create your verified rental profile.</h1>
            <p>Complete your profile once and keep bookings, rentals, and verification details ready for every shoot.</p>
          </div>
        </div>

        <form class="register-form" [formGroup]="form" (ngSubmit)="submit()" appScrollReveal="slide-left" [revealDelay]="120">
          <div class="form-head">
            <p class="eyebrow">Start renting</p>
            <h2>Create account</h2>
          </div>

          @if (formError) {
            <p class="form-alert" role="alert">{{ formError }}</p>
          }

          <section class="form-section">
            <h3>Personal details</h3>
            <div class="field-grid">
              <label>
                <span>First name</span>
                <input placeholder="First name" formControlName="firstName" autocomplete="given-name">
                @if (fieldError('firstName')) {
                  <small class="field-error">{{ fieldError('firstName') }}</small>
                }
              </label>
              <label>
                <span>Last name</span>
                <input placeholder="Last name" formControlName="lastName" autocomplete="family-name">
                @if (fieldError('lastName')) {
                  <small class="field-error">{{ fieldError('lastName') }}</small>
                }
              </label>
              <label>
                <span>Email</span>
                <input type="email" placeholder="you@example.com" formControlName="email" autocomplete="email">
                @if (fieldError('email')) {
                  <small class="field-error">{{ fieldError('email') }}</small>
                }
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
                @if (fieldError('gender')) {
                  <small class="field-error">{{ fieldError('gender') }}</small>
                }
              </label>
              <label>
                <span>Date of birth</span>
                <input type="date" formControlName="dob" autocomplete="bday" [max]="latestDobDate">
                @if (fieldError('dob')) {
                  <small class="field-error">{{ fieldError('dob') }}</small>
                }
              </label>
              <label>
                <span>Phone number</span>
                <input placeholder="10-digit phone" formControlName="phoneNumber" autocomplete="tel">
                @if (fieldError('phoneNumber')) {
                  <small class="field-error">{{ fieldError('phoneNumber') }}</small>
                }
              </label>
              <label>
                <span>Alternate contact number</span>
                <input placeholder="Alternate number" formControlName="alternateContactNumber" autocomplete="tel">
              </label>
              <label>
                <span>Active social media profile</span>
                <input placeholder="Instagram, LinkedIn, website..." formControlName="socialMediaProfile">
                @if (fieldError('socialMediaProfile')) {
                  <small class="field-error">{{ fieldError('socialMediaProfile') }}</small>
                }
              </label>
            </div>
          </section>

          <section class="form-section">
            <h3>Address</h3>
            <label>
              <span>Current address</span>
              <textarea placeholder="House number, street, area" formControlName="currentAddress" autocomplete="street-address"></textarea>
              @if (fieldError('currentAddress')) {
                <small class="field-error">{{ fieldError('currentAddress') }}</small>
              }
            </label>
            <div class="field-grid">
              <label>
                <span>Country</span>
                <select formControlName="country" autocomplete="country-name">
                  @for (country of countries; track country) {
                    <option [value]="country">{{ country }}</option>
                  }
                </select>
                @if (fieldError('country')) {
                  <small class="field-error">{{ fieldError('country') }}</small>
                }
              </label>
              <label>
                <span>State</span>
                <select formControlName="state" autocomplete="address-level1">
                  <option value="">Select state</option>
                  @for (state of states; track state) {
                    <option [value]="state">{{ state }}</option>
                  }
                </select>
                @if (fieldError('state')) {
                  <small class="field-error">{{ fieldError('state') }}</small>
                }
              </label>
              <label>
                <span>Pincode</span>
                <input placeholder="Pincode" formControlName="pincode" autocomplete="postal-code" (input)="lookupCityByPincode()">
                @if (fieldError('pincode')) {
                  <small class="field-error">{{ fieldError('pincode') }}</small>
                } @else if (pincodeLookupMessage) {
                  <small class="field-hint" [class.error]="pincodeLookupError">{{ pincodeLookupMessage }}</small>
                }
              </label>
              <label>
                <span>City</span>
                <input placeholder="City" formControlName="city" autocomplete="address-level2">
                @if (fieldError('city')) {
                  <small class="field-error">{{ fieldError('city') }}</small>
                }
              </label>
              <label>
                <span>Residence type</span>
                <select formControlName="residenceType">
                  <option value="">Select residence</option>
                  <option value="Owned">Owned</option>
                  <option value="Rented">Rented</option>
                  <option value="Family owned">Family owned</option>
                  <option value="Company provided">Company provided</option>
                </select>
                @if (fieldError('residenceType')) {
                  <small class="field-error">{{ fieldError('residenceType') }}</small>
                }
              </label>
            </div>
          </section>

          <section class="form-section">
            <h3>Work details</h3>
            <div class="field-grid">
              <label>
                <span>Occupation</span>
                <input placeholder="Photographer, filmmaker..." formControlName="occupation">
                @if (fieldError('occupation')) {
                  <small class="field-error">{{ fieldError('occupation') }}</small>
                }
              </label>
              <label>
                <span>Company / organization</span>
                <input placeholder="Company or organization" formControlName="companyName">
                @if (fieldError('companyName')) {
                  <small class="field-error">{{ fieldError('companyName') }}</small>
                }
              </label>
            </div>
          </section>

          <section class="form-section">
            <h3>Documents</h3>
            <div class="field-grid">
              <label class="file-field" [class.invalid-file]="formSubmitted && !selectedFiles.photo">
                <span>Photo</span>
                <input type="file" accept="image/*" (change)="setFile('photo', $event)">
                <b>{{ selectedFiles.photo?.name || 'Choose file' }}</b>
                @if (documentError('photo')) {
                  <small class="field-error">{{ documentError('photo') }}</small>
                }
              </label>
              <label class="file-field" [class.invalid-file]="formSubmitted && !selectedFiles.drivingLicense">
                <span>Driving license</span>
                <input type="file" accept="image/*,.pdf" (change)="setFile('drivingLicense', $event)">
                <b>{{ selectedFiles.drivingLicense?.name || 'Choose file' }}</b>
                @if (documentError('drivingLicense')) {
                  <small class="field-error">{{ documentError('drivingLicense') }}</small>
                }
              </label>
              @if (residenceProofKey()) {
                <label class="file-field" [class.invalid-file]="formSubmitted && !selectedFiles[residenceProofKey()!]">
                  <span>{{ residenceProofLabel() }}</span>
                  <input type="file" accept="image/*,.pdf" (change)="setFile(residenceProofKey()!, $event)">
                  <b>{{ selectedFiles[residenceProofKey()!]?.name || 'Choose file' }}</b>
                  @if (documentError(residenceProofKey()!)) {
                    <small class="field-error">{{ documentError(residenceProofKey()!) }}</small>
                  }
                </label>
              }
            </div>
          </section>

          <section class="form-section">
            <h3>Security</h3>
            <div class="field-grid">
              <label>
                <span>Password</span>
                <input type="password" placeholder="Create password" formControlName="password" autocomplete="new-password">
                @if (fieldError('password')) {
                  <small class="field-error">{{ fieldError('password') }}</small>
                }
              </label>
              <label [class.password-mismatch]="formSubmitted && !passwordsMatch()">
                <span>Confirm password</span>
                <input type="password" placeholder="Repeat password" formControlName="confirmPassword" autocomplete="new-password">
                @if (fieldError('confirmPassword') || passwordMismatchError()) {
                  <small class="field-error">{{ fieldError('confirmPassword') || passwordMismatchError() }}</small>
                }
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
    .register-page { background: #f5f5f2; color: #111; min-height: calc(100vh - 96px); padding: clamp(.8rem, 1.6vw, 1.4rem) clamp(1rem, 2.2vw, 1.6rem) clamp(1.2rem, 2.4vw, 1.8rem); }
    .register-shell { align-items: stretch; background: #fdfdfc; border: 1px solid rgba(17,17,17,.08); border-radius: 24px; box-shadow: 0 22px 60px rgba(17,17,17,.07); display: grid; gap: clamp(1rem, 2vw, 1.6rem); grid-template-columns: minmax(280px, 420px) minmax(0, 1fr); margin: 0 auto; max-width: 1280px; min-height: calc(100vh - 130px); overflow: hidden; padding: clamp(.9rem, 1.9vw, 1.5rem); }
    .visual-panel, .register-form { min-width: 0; }
    .visual-panel { align-content: stretch; background: #fff; border: 1px solid rgba(17,17,17,.08); border-radius: 18px; color: #111; display: grid; gap: 1rem; grid-template-rows: minmax(260px, 1fr) auto; overflow: hidden; padding: .8rem; }
    .hero-photo { border-radius: 12px; box-shadow: none; height: 100%; margin: 0; min-height: 320px; overflow: hidden; }
    .hero-photo img { height: 100%; object-fit: cover; width: 100%; }
    .visual-copy { display: grid; gap: .75rem; padding: .55rem .4rem .25rem; }
    .visual-copy p, .signin { color: #5e5e5a; line-height: 1.6; margin: 0; }
    .visual-copy p { color: #5e5e5a; font-size: .96rem; font-weight: 650; max-width: 42ch; }
    .eyebrow { color: #ff9700; font-size: .74rem; font-weight: 950; letter-spacing: .12em; line-height: 1.35; margin: 0; text-transform: uppercase; }
    h1, h2, h3 { color: #111; letter-spacing: 0; margin: 0; overflow-wrap: anywhere; }
    .visual-copy h1 { color: #111; font-size: clamp(2rem, 3.5vw, 3.8rem); font-weight: 950; line-height: 1.02; max-width: 10ch; }
    h2 { font-size: clamp(1.55rem, 2.2vw, 2.25rem); font-weight: 950; line-height: 1.08; }
    h3 { align-items: center; color: #111; display: flex; font-size: .95rem; font-weight: 950; gap: .55rem; line-height: 1.25; margin: 0 0 .85rem; }
    h3::before { background: #ff9700; border-radius: 999px; content: ""; height: 8px; width: 8px; }
    .register-form { align-self: stretch; background: #fff; border: 1px solid rgba(17,17,17,.08); border-radius: 18px; box-shadow: none; display: flex; flex-direction: column; height: 100%; min-height: 100%; max-height: calc(100vh - 150px); overflow: auto; padding: clamp(1rem, 2vw, 1.45rem); scrollbar-color: rgba(17,17,17,.24) transparent; }
    .form-head { border-bottom: 1px solid rgba(17,17,17,.08); display: grid; gap: .35rem; margin-bottom: 1rem; padding-bottom: 1rem; }
    .form-alert { background: #fff4f2; border: 1px solid rgba(180,35,24,.24); border-radius: 8px; color: #b42318; font-size: .88rem; font-weight: 850; line-height: 1.45; margin: 0 0 1rem; padding: .78rem .9rem; }
    .form-section { background: #fff; border: 1px solid rgba(17,17,17,.08); border-radius: 12px; padding: 1rem; }
    .form-section + .form-section { margin-top: .9rem; }
    .field-grid { display: grid; gap: .85rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    label { color: #202020; display: block; font-size: .8rem; font-weight: 850; line-height: 1.35; margin: 0; min-width: 0; }
    label span { color: #333; display: block; margin-bottom: .42rem; }
    input, select, textarea { background: #f8f8f6; border: 1px solid rgba(17,17,17,.1); border-radius: 8px; color: #111; display: block; font: inherit; font-size: .92rem; font-weight: 650; line-height: 1.4; min-height: 46px; outline: 0; padding: .72rem .82rem; transition: border-color .2s ease, box-shadow .2s ease, background .2s ease; width: 100%; }
    textarea { min-height: 96px; resize: vertical; }
    input:focus, select:focus, textarea:focus { background: #fff; border-color: rgba(255,151,0,.92); box-shadow: 0 0 0 3px rgba(255,151,0,.16); }
    input.ng-invalid.ng-touched, select.ng-invalid.ng-touched, textarea.ng-invalid.ng-touched, .password-mismatch input { background: #fff8f7; border-color: rgba(180,35,24,.72); box-shadow: 0 0 0 3px rgba(180,35,24,.11); }
    input.ng-invalid.ng-touched::placeholder, textarea.ng-invalid.ng-touched::placeholder { color: rgba(180,35,24,.68); }
    label:has(input.ng-invalid.ng-touched) span, label:has(select.ng-invalid.ng-touched) span, label:has(textarea.ng-invalid.ng-touched) span, .file-field.invalid-file span, .password-mismatch span { color: #b42318; }
    .field-error, .field-hint { display: block; font-size: .74rem; font-weight: 850; line-height: 1.35; margin-top: .36rem; }
    .field-error { color: #b42318; }
    .field-hint { color: #027a48; }
    .field-hint.error { color: #b42318; }
    input::placeholder, textarea::placeholder { color: #85857f; font-weight: 600; }
    .file-field { cursor: pointer; position: relative; }
    .file-field input { height: 1px; opacity: 0; padding: 0; position: absolute; width: 1px; }
    .file-field b { align-items: center; background: #f8f8f6; border: 1px dashed rgba(17,17,17,.26); border-radius: 8px; color: #444; display: flex; font-size: .82rem; font-weight: 850; line-height: 1.3; min-height: 46px; min-width: 0; overflow: hidden; padding: .72rem .82rem; text-overflow: ellipsis; white-space: nowrap; }
    .file-field:hover b { background: #fffaf2; border-color: rgba(255,151,0,.9); color: #111; }
    .file-field.invalid-file b { background: #fff8f7; border-color: rgba(180,35,24,.72); box-shadow: 0 0 0 3px rgba(180,35,24,.11); color: #b42318; }
    .submit { align-items: center; background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; cursor: pointer; display: inline-flex; font-size: .95rem; font-weight: 950; justify-content: center; margin-top: 1rem; min-height: 50px; padding: .8rem 1.2rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; width: 100%; }
    .submit:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #fff; transform: translateY(-2px); }
    .submit:disabled, .submit:disabled:hover { background: #111; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; cursor: not-allowed; opacity: .68; transform: none; }
    .signin { color: #555; font-size: .92rem; font-weight: 650; margin-top: 1rem; text-align: center; }
    .signin a { color: #111; font-weight: 950; text-decoration: underline; text-underline-offset: 4px; }
    @media (max-width: 980px) {
      .register-page { padding: .85rem; }
      .register-shell { grid-template-columns: 1fr; min-height: auto; }
      .visual-panel { grid-template-columns: minmax(180px, .72fr) minmax(0, 1fr); grid-template-rows: none; min-height: 0; }
      .hero-photo { min-height: 220px; }
      .visual-copy { align-content: end; padding: .75rem; }
      .visual-copy h1 { max-width: 14ch; }
      .register-form { max-height: none; }
    }
    @media (max-width: 620px) {
      .register-page { padding: .55rem; }
      .register-shell { border-radius: 16px; gap: .75rem; padding: .65rem; }
      .visual-panel { border-radius: 12px; grid-template-columns: 1fr; padding: .6rem; }
      .hero-photo { border-radius: 8px; height: 190px; min-height: 190px; }
      .visual-copy { gap: .5rem; padding: .35rem .15rem .05rem; }
      .visual-copy h1 { font-size: clamp(1.75rem, 8vw, 2.35rem); line-height: 1.06; max-width: 16ch; }
      .visual-copy p { font-size: .9rem; line-height: 1.5; }
      .register-form { border-radius: 12px; box-shadow: 0 12px 32px rgba(17,17,17,.06); padding: .85rem; }
      .form-head { margin-bottom: .85rem; padding-bottom: .85rem; }
      h2 { font-size: 1.45rem; }
      h3 { font-size: .9rem; margin-bottom: .75rem; }
      .form-section { border-radius: 10px; padding: .82rem; }
      .form-section + .form-section { margin-top: .75rem; }
      .field-grid { gap: .72rem; grid-template-columns: 1fr; }
      label { font-size: .78rem; }
      input, select, textarea, .file-field b { border-radius: 8px; font-size: .9rem; min-height: 44px; padding: .68rem .75rem; }
      .submit { min-height: 48px; }
    }
  `]
})
export class RegisterPageComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  isSubmitting = false;
  formSubmitted = false;
  formError = '';
  isFetchingPincode = false;
  pincodeLookupError = false;
  pincodeLookupMessage = '';
  private lastLookedUpPincode = '';
  readonly latestDobDate = this.dateInputValue(this.yearsAgo(15));
  readonly selectedFiles: Partial<Record<DocumentKey, File>> = {};
  readonly countries = ['India'];
  readonly states = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry'
  ];
  private readonly fieldLabels: Record<RegisterControlName, string> = {
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    gender: 'Gender',
    dob: 'Date of birth',
    phoneNumber: 'Phone number',
    alternateContactNumber: 'Alternate contact number',
    currentAddress: 'Current address',
    city: 'City',
    state: 'State',
    pincode: 'Pincode',
    country: 'Country',
    residenceType: 'Residence type',
    occupation: 'Occupation',
    companyName: 'Company / organization',
    socialMediaProfile: 'Social media profile',
    password: 'Password',
    confirmPassword: 'Confirm password'
  };

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.pattern(namePattern)]],
    lastName: ['', [Validators.required, Validators.pattern(namePattern)]],
    email: ['', [Validators.required, Validators.pattern(emailPattern)]],
    gender: ['', Validators.required],
    dob: ['', [Validators.required, notFutureDate, minimumAge(15)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(phonePattern)]],
    alternateContactNumber: ['', Validators.pattern(phonePattern)],
    currentAddress: ['', Validators.required],
    city: ['', [Validators.required, Validators.pattern(locationPattern)]],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(pincodePattern)]],
    country: ['India', Validators.required],
    residenceType: ['', Validators.required],
    occupation: ['', [Validators.required, Validators.pattern(locationPattern)]],
    companyName: ['', Validators.required],
    socialMediaProfile: ['', [Validators.required, Validators.pattern(socialProfilePattern)]],
    password: ['', [Validators.required, Validators.pattern(passwordPattern)]],
    confirmPassword: ['', Validators.required]
  });

  setFile(key: DocumentKey, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFiles[key] = file;
    }
  }

  lookupCityByPincode(): void {
    const pincode = this.form.controls.pincode.value.trim();
    this.pincodeLookupMessage = '';
    this.pincodeLookupError = false;

    if (pincode.length !== 6 || !pincodePattern.test(pincode) || pincode === this.lastLookedUpPincode) {
      return;
    }

    this.lastLookedUpPincode = pincode;
    this.isFetchingPincode = true;
    this.pincodeLookupMessage = 'Fetching city from pincode...';

    fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      .then((response) => response.json())
      .then((data: PostalPincodeResponse[]) => {
        const result = data[0];
        const postOffice = result?.PostOffice?.[0];
        if (result?.Status !== 'Success' || !postOffice) {
          this.pincodeLookupError = true;
          this.pincodeLookupMessage = 'No city found for this pincode.';
          return;
        }

        this.form.patchValue({
          city: postOffice.District || this.form.controls.city.value,
          state: this.states.includes(postOffice.State) ? postOffice.State : this.form.controls.state.value
        });
        this.form.controls.city.markAsTouched();
        this.form.controls.state.markAsTouched();
        this.pincodeLookupMessage = `City found: ${postOffice.District}.`;
      })
      .catch(() => {
        this.pincodeLookupError = true;
        this.pincodeLookupMessage = 'Could not fetch city right now. Please enter it manually.';
      })
      .finally(() => {
        this.isFetchingPincode = false;
      });
  }

  passwordsMatch(): boolean {
    return this.form.value.password === this.form.value.confirmPassword;
  }

  private yearsAgo(years: number): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
  }

  private dateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  fieldError(controlName: RegisterControlName): string {
    const control = this.form.controls[controlName];
    if (!control.invalid || (!control.touched && !this.formSubmitted)) {
      return '';
    }

    const label = this.fieldLabels[controlName];
    if (control.hasError('required')) {
      return `${label} is required.`;
    }
    if (control.hasError('pattern')) {
      return this.patternError(controlName);
    }
    if (control.hasError('futureDate')) {
      return 'Date of birth cannot be in the future.';
    }
    if (control.hasError('minimumAge')) {
      return 'You must be at least 15 years old to register.';
    }
    if (control.hasError('invalidDate')) {
      return 'Enter a valid date of birth.';
    }
    if (control.hasError('minlength')) {
      const requiredLength = control.getError('minlength')?.requiredLength;
      return `${label} must be at least ${requiredLength} characters.`;
    }
    return `${label} is invalid.`;
  }

  private patternError(controlName: RegisterControlName): string {
    const messages: Partial<Record<RegisterControlName, string>> = {
      firstName: 'First name can only contain letters, spaces, apostrophes, hyphens, and periods.',
      lastName: 'Last name can only contain letters, spaces, apostrophes, hyphens, and periods.',
      email: 'Enter a valid email address, for example name@example.com.',
      phoneNumber: 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
      alternateContactNumber: 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
      city: 'City can only contain letters, spaces, apostrophes, hyphens, and periods.',
      pincode: 'Enter a valid 6-digit pincode.',
      occupation: 'Occupation can only contain letters, spaces, apostrophes, hyphens, and periods.',
      socialMediaProfile: 'Enter a valid profile link or handle.',
      password: 'Password must be 8-64 characters and include uppercase, lowercase, number, and special character.'
    };
    return messages[controlName] ?? `${this.fieldLabels[controlName]} is invalid.`;
  }

  documentError(key: DocumentKey): string {
    if (!this.formSubmitted || this.selectedFiles[key] || !this.isRequiredDocument(key)) {
      return '';
    }

    const labels: Record<DocumentKey, string> = {
      photo: 'Photo',
      drivingLicense: 'Driving license',
      electricityBill: 'Electricity bill',
      rentAgreement: 'Rent agreement',
      companyBonafideLetter: 'Company bonafide letter'
    };
    return `${labels[key]} is required.`;
  }

  residenceProofKey(): DocumentKey | null {
    const residenceType = this.form.controls.residenceType.value;
    if (residenceType === 'Rented') {
      return 'rentAgreement';
    }
    if (residenceType === 'Owned' || residenceType === 'Family owned' || residenceType === 'Family home') {
      return 'electricityBill';
    }
    if (residenceType === 'Company provided') {
      return 'companyBonafideLetter';
    }
    return null;
  }

  residenceProofLabel(): string {
    const labels: Partial<Record<DocumentKey, string>> = {
      electricityBill: 'Electricity bill',
      rentAgreement: 'Rent agreement',
      companyBonafideLetter: 'Company bonafide letter'
    };
    const key = this.residenceProofKey();
    return key ? labels[key] ?? 'Residence proof' : 'Residence proof';
  }

  passwordMismatchError(): string {
    return this.formSubmitted && this.form.controls.confirmPassword.valid && !this.passwordsMatch()
      ? 'Passwords must match.'
      : '';
  }

  submit(): void {
    this.formSubmitted = true;
    this.formError = '';
    const matches = this.passwordsMatch();
    const residenceProofKey = this.residenceProofKey();
    const hasDocuments = this.selectedFiles.photo && this.selectedFiles.drivingLicense && residenceProofKey && this.selectedFiles[residenceProofKey];
    if (this.form.invalid || !matches || !hasDocuments || this.isSubmitting) {
      this.form.markAllAsTouched();
      this.formError = 'Please complete all fields, documents, and match passwords.';
      return;
    }

    const { confirmPassword, ...details } = this.form.getRawValue();
    this.isSubmitting = true;
    this.authService.register({
      ...details,
      photo: this.selectedFiles.photo!,
      drivingLicense: this.selectedFiles.drivingLicense!,
      electricityBill: this.selectedFiles.electricityBill,
      rentAgreement: this.selectedFiles.rentAgreement,
      companyBonafideLetter: this.selectedFiles.companyBonafideLetter
    })
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe({
        next: () => {
          this.snackBar.open('Registration submitted for admin verification', 'Close', {
            duration: 3200,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['snackbar-screen-center']
          });
          void this.router.navigateByUrl('/login');
        },
        error: (error) => {
          this.snackBar.open(this.authService.getErrorMessage(error), 'Close', {
            duration: 3600,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['snackbar-screen-center']
          });
        }
      });
  }

  private isRequiredDocument(key: DocumentKey): boolean {
    return key === 'photo' || key === 'drivingLicense' || key === this.residenceProofKey();
  }
}



