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
      background: #111;
      border: 0;
      border-radius: 999px;
      box-shadow: 0 14px 28px rgba(0, 0, 0, .18);
      color: #ffffff;
      display: inline-flex;
      cursor: pointer;
      font-size: .96rem;
      font-weight: 800;
      gap: .7rem;
      justify-content: center;
      min-height: 50px;
      padding: .85rem 1.25rem;
      transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease;
      width: 100%;
    }
    .ck-btn:hover { background: #ff9700; box-shadow: 0 16px 34px rgba(255, 151, 0, .22); color: #111; transform: translateY(-2px); }
    .ck-btn:disabled,
    .ck-btn:disabled:hover { background: #111; box-shadow: 0 14px 28px rgba(0, 0, 0, .18); color: #ffffff; cursor: not-allowed; opacity: .68; transform: none; }
    .ck-btn.secondary { background: #111; color: #ffffff; }
    .ck-btn.secondary:hover { background: #ff9700; color: #111; }
  `]
})
export class AppButtonComponent {
  readonly disabled = input(false);
  readonly variant = input<'primary' | 'secondary'>('primary');
  readonly type = input<'button' | 'submit'>('button');
}
