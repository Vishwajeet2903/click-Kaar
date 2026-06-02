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
      <article class="container blog pb-5">
        <img class="blog-cover" [src]="post()!.cover" [alt]="post()!.title">
        <p class="eyebrow">{{ post()!.category }} · {{ post()!.date }}</p>
        <h1>{{ post()!.title }}</h1>
        <p class="muted">By {{ post()!.author }}</p>
        @for (paragraph of post()!.content; track paragraph) { <p>{{ paragraph }}</p> }
      </article>
    }
  `,
  styles: [`
    .blog { max-width: 880px; }
    img { aspect-ratio: 16/9; border-radius: 8px; margin-bottom: 1.5rem; width: 100%; }
    h1 { font-size: clamp(2.2rem, 6vw, 4rem); font-weight: 950; }
    p { color: #dbeafe; font-size: 1.08rem; line-height: 1.8; }
  `]
})
export class BlogDetailPageComponent {
  readonly post = signal<BlogPost | undefined>(undefined);
  constructor() {
    const slug = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';
    inject(BlogService).getBySlug(slug).subscribe((post) => this.post.set(post));
  }
}
