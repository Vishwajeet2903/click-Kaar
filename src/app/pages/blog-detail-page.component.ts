import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BlogPost } from '../models/blog.model';
import { BlogService } from '../services/blog.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-blog-detail-page',
  standalone: true,
  imports: [BreadcrumbComponent],
  template: `
    @if (post()) {
      <app-breadcrumb [label]="post()!.title" />
      <article class="container blog blog-shell pb-5">
        <img class="blog-cover" [src]="post()!.cover" [alt]="post()!.title">
        <p class="eyebrow">{{ post()!.category }} · {{ post()!.date }}</p>
        <h1>{{ post()!.title }}</h1>
        <p class="muted">By {{ post()!.author }}</p>
        @for (paragraph of post()!.content; track paragraph) { <p>{{ paragraph }}</p> }
      </article>
    }
  `,
  styles: [`
    :host ::ng-deep article.container.blog-shell { border-radius: 32px !important; overflow: hidden; }
    .blog { max-width: 95vw; }
    img { aspect-ratio: 16/9; border-radius: 18px; margin-bottom: 1.5rem; width: 100%; }
    h1 { color: #111; font-size: clamp(2rem, 4.5vw, 3.6rem); font-weight: 950; letter-spacing: 0; line-height: 1.08; margin: 0 0 .65rem; }
    p { color: #333; font-size: 1rem; font-weight: 500; line-height: 1.75; }
    .eyebrow { color: #ff9700; font-size: .92rem; letter-spacing: .1em; line-height: 1.25; }
    .muted { color: #666; }
  `]
})
export class BlogDetailPageComponent {
  readonly post = signal<BlogPost | undefined>(undefined);
  constructor() {
    const slug = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';
    inject(BlogService).getBySlug(slug).subscribe((post) => this.post.set(post));
  }
}
