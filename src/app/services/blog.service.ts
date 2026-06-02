import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BlogPost } from '../models/blog.model';

const cover = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'camera-kit-for-weddings',
    title: 'Building a Reliable Wedding Camera Kit',
    category: 'Guides',
    cover: cover('photo-1519741497674-611481863552'),
    author: 'Clickkaar Studio Team',
    date: 'May 18, 2026',
    excerpt: 'A practical rental checklist for hybrid wedding shooters.',
    content: ['Start with two bodies, fast standard glass, and enough lighting control to handle unpredictable venues.', 'Renting lets you match each wedding brief without over-investing in gear that sits idle between seasons.']
  },
  {
    id: 2,
    slug: 'lighting-interview-setups',
    title: 'Three Interview Lighting Setups That Travel Well',
    category: 'Lighting',
    cover: cover('photo-1492691527719-9d1e07e534b4'),
    author: 'Aarav Mehta',
    date: 'May 7, 2026',
    excerpt: 'Compact lighting packages for corporate, documentary, and creator shoots.',
    content: ['A key light, compact fill, and controllable background accent can transform small rooms.', 'Choose battery-ready fixtures when locations are uncertain or fast-moving.']
  },
  {
    id: 3,
    slug: 'choose-lens-for-portraits',
    title: 'How to Choose the Right Portrait Lens',
    category: 'Lenses',
    cover: cover('photo-1524504388940-b1c1722653e1'),
    author: 'Nisha Rao',
    date: 'April 29, 2026',
    excerpt: 'Focal length, compression, aperture, and the look your client actually needs.',
    content: ['The best portrait lens depends on distance, background, light, and the mood of the shoot.', 'An 85mm prime is flattering, but a fast 35mm can be stronger for environmental portraits.']
  }
];

@Injectable({ providedIn: 'root' })
export class BlogService {
  getPosts(): Observable<BlogPost[]> {
    return of(POSTS);
  }

  getBySlug(slug: string): Observable<BlogPost | undefined> {
    return of(POSTS.find((post) => post.slug === slug));
  }
}
