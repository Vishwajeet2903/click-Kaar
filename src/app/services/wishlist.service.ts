import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  readonly products = signal<Product[]>([]);

  toggle(product: Product): boolean {
    const exists = this.products().some((item) => item.id === product.id);
    this.products.update((items) => exists ? items.filter((item) => item.id !== product.id) : [...items, product]);
    return !exists;
  }

  has(id: number): boolean {
    return this.products().some((item) => item.id === id);
  }

  clear(): void {
    this.products.set([]);
  }
}
