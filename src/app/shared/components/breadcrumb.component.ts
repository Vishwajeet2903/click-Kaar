import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="crumbs container">
      <a routerLink="/">Home</a>
      <span>/</span>
      <span>{{ label() }}</span>
    </nav>
  `,
  styles: [`
    .crumbs { color: #777; display: flex; gap: .55rem; padding-bottom: 1rem; padding-top: 1.25rem; }
    a { color: #ff9700; }
  `]
})
export class BreadcrumbComponent {
  readonly label = input.required<string>();
}
