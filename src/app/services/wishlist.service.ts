import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Product } from '../models/product.model';

const WISHLIST_STORAGE_KEY = 'clickkaar_wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly products = signal<Product[]>(this.readWishlist());

  toggle(product: Product): boolean {
    const exists = this.products().some((item) => item.id === product.id);
    this.products.update((items) => exists ? items.filter((item) => item.id !== product.id) : [...items, product]);
    this.saveWishlist();
    return !exists;
  }

  has(id: number): boolean {
    return this.products().some((item) => item.id === id);
  }

  clear(): void {
    this.products.set([]);
    if (this.canUseStorage()) {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    }
  }

  private saveWishlist(): void {
    if (this.canUseStorage()) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(this.products()));
    }
  }

  private readWishlist(): Product[] {
    if (!this.canUseStorage()) {
      return [];
    }

    const value = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!value) {
      return [];
    }

    try {
      const products = JSON.parse(value);
      return Array.isArray(products) ? products as Product[] : [];
    } catch {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
      return [];
    }
  }

  private canUseStorage(): boolean {
    return isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined';
  }
}
