import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BlogPost } from '../models/blog.model';
import { BlogService } from '../services/blog.service';
import { BreadcrumbComponent } from '../shared/components/breadcrumb.component';

@Component({
  selector: 'app-blog-list-page',
  standalone: true,
  imports: [FormsModule, RouterLink, BreadcrumbComponent],
  template: `
    <app-breadcrumb label="Blog" />
    <section class="container pb-5">
      <div class="d-flex justify-content-between align-items-end gap-3 flex-wrap mb-4">
        <div><p class="eyebrow">Production notes</p><h1 class="section-title">Clickkaar Blog</h1></div>
        <input class="form-control search" placeholder="Search articles" [ngModel]="query()" (ngModelChange)="query.set($event)">
      </div>
      <div class="chips">
        @for (category of categories(); track category) { <button (click)="selected.set(category)" [class.active]="selected() === category">{{ category }}</button> }
      </div>
      <div class="row g-4">
        @for (post of filtered(); track post.id) {
          <div class="col-md-4">
            <article class="surface post">
              <img class="blog-cover" [src]="post.cover" [alt]="post.title">
              <div>
                <p class="eyebrow">{{ post.category }}</p>
                <h2><a [routerLink]="['/blog', post.slug]">{{ post.title }}</a></h2>
                <p class="muted">{{ post.excerpt }}</p>
              </div>
            </article>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .search { max-width: 320px; }
    .chips { display: flex; flex-wrap: wrap; gap: .7rem; margin-bottom: 1.4rem; }
    .chips button { background: #fff; border: 1px solid rgba(216,164,59,.45); border-radius: 5%; color: #171717; font-weight: 800; padding: .55rem .9rem; }
    .chips button.active { background: #ff9700; color: #fff; }
    .post { height: 100%; overflow: hidden; }
    .post img { aspect-ratio: 16/10; width: 100%; }
    .post div { padding: 1rem; }
    h2 { font-size: 1.2rem; font-weight: 900; }
  `]
})
export class BlogListPageComponent {
  readonly query = signal('');
  readonly selected = signal('All');
  readonly posts = signal<BlogPost[]>([]);
  readonly categories = computed(() => ['All', ...new Set(this.posts().map((post) => post.category))]);
  readonly filtered = computed(() => this.posts().filter((post) => (this.selected() === 'All' || post.category === this.selected()) && (!this.query() || post.title.toLowerCase().includes(this.query().toLowerCase()))));

  constructor() {
    inject(BlogService).getPosts().subscribe((posts) => this.posts.set(posts));
  }
}
