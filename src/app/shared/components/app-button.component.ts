import { Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button [type]="type()" class="ck-btn" [class.secondary]="variant() === 'secondary'" [disabled]="disabled()">
      <ng-content />
    </button>
  `,
  styles: [`
    .ck-btn {
      align-items: center;
      background: linear-gradient(90deg, #ff9700, #ffc36d);
      border: 0;
      border-radius: 5%;
      color: #fff;
      display: inline-flex;
      font-weight: 700;
      gap: .5rem;
      justify-content: center;
      min-height: 46px;
      padding: .72rem 1.1rem;
      transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
      width: 100%;
    }
    .ck-btn:hover { box-shadow: 0 12px 22px rgba(255, 151, 0, .22); transform: translateY(-1px); }
    .ck-btn:disabled { cursor: not-allowed; opacity: .68; transform: none; }
    .ck-btn.secondary { background: #fff; border: 1px solid #d8a43b; color: #171717; }
  `]
})
export class AppButtonComponent {
  readonly disabled = input(false);
  readonly variant = input<'primary' | 'secondary'>('primary');
  readonly type = input<'button' | 'submit'>('button');
}
