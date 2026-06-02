import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `<div class="spinner" aria-label="Loading"></div>`,
  styles: [`
    .spinner { animation: spin .85s linear infinite; border: 3px solid rgba(216,164,59,.25); border-radius: 50%; border-top-color: #ff9700; height: 42px; margin: 2rem auto; width: 42px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoadingSpinnerComponent {}
