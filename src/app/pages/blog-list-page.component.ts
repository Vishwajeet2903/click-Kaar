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
    <section class="container blog-shell pb-5">
      <div class="d-flex justify-content-between align-items-end gap-3 flex-wrap mb-4">
        <div><p class="eyebrow">Production notes</p><h1 class="section-title">Click-Kaar Blog</h1></div>
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
                <p  class="eyebrow">{{ post.category }}</p>
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
  :host ::ng-deep section.container.blog-shell { border-radius: 32px !important; overflow: hidden; }
  .form-control.search::placeholder{color: #777;}
  .section-title{font-size: clamp(1.75rem, 3.4vw, 3rem); letter-spacing: 0; line-height: 1.08; text-align: left;}
  .eyebrow{color: #ff9700; font-size: .92rem; letter-spacing: .1em; line-height: 1.25;}
    .search { max-width: 320px; }
    .chips { display: flex; flex-wrap: wrap; gap: .7rem; margin-bottom: 1.4rem; }
    .chips button { background: #111; border: 0; border-radius: 999px; box-shadow: 0 14px 28px rgba(0,0,0,.18); color: #fff; font-size: .9rem; font-weight: 700; min-height: 46px; padding: .75rem 1.1rem; transition: transform .25s ease, box-shadow .25s ease, background .25s ease, color .25s ease; }
    .chips button:hover, .chips button.active { background: #ff9700; box-shadow: 0 16px 34px rgba(255,151,0,.22); color: #fff; transform: translateY(-2px); }
    .post { height: 100%; overflow: hidden; }
    .post img { aspect-ratio: 16/10; width: 100%; }
    .post div { padding: 1rem; }
    h2 { color: #111; font-size: 1.08rem; font-weight: 900; letter-spacing: 0; line-height: 1.28; margin: 0 0 .65rem; }
    .muted { color: #555; font-size: .94rem; font-weight: 500; line-height: 1.55; margin: 0; }
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
