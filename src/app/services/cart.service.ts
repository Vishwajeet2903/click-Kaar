import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { CartItem, Product } from '../models/product.model';

const CART_STORAGE_KEY = 'clickkaar_cart';

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
};

const afterDays = (days: number) => {
  const date = tomorrow();
  date.setDate(date.getDate() + days);
  return date;
};

interface StoredCartItem {
  product: Product;
  startDate: string;
  endDate: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly items = signal<CartItem[]>(this.readCart());
  readonly count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotal = computed(() => this.items().reduce((sum, item) => sum + this.itemTotal(item), 0));
  readonly securityDeposit = computed(() => Math.round(this.subtotal() * 0.3));
  readonly tax = computed(() => Math.round(this.subtotal() * 0.18));
  readonly grandTotal = computed(() => this.subtotal() + this.securityDeposit() + this.tax());

  constructor() {
    effect(() => {
      this.saveCart(this.items());
    });
  }

  add(product: Product, startDate = tomorrow(), endDate = afterDays(3), quantity = 1): void {
    this.items.update((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        return items.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity, startDate, endDate } : item);
      }
      return [...items, { product, startDate, endDate, quantity }];
    });
  }

  updateQuantity(productId: number, quantity: number): void {
    this.items.update((items) => items.map((item) => item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item));
  }

  remove(productId: number): void {
    this.items.update((items) => items.filter((item) => item.product.id !== productId));
  }

  clear(): void {
    this.items.set([]);
  }

  duration(item: CartItem): number {
    const diff = item.endDate.getTime() - item.startDate.getTime();
    return Math.max(1, Math.ceil(diff / 86_400_000));
  }

  itemTotal(item: CartItem): number {
    return this.duration(item) * item.product.dailyPrice * item.quantity;
  }

  private readCart(): CartItem[] {
    if (!this.canUseStorage()) {
      return [];
    }

    const value = localStorage.getItem(CART_STORAGE_KEY);
    if (!value) {
      return [];
    }

    try {
      const items = JSON.parse(value) as StoredCartItem[];
      return items.map((item) => ({
        product: item.product,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        quantity: item.quantity
      }));
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  }

  private saveCart(items: CartItem[]): void {
    if (!this.canUseStorage()) {
      return;
    }

    if (!items.length) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }

    const storedItems: StoredCartItem[] = items.map((item) => ({
      product: item.product,
      startDate: item.startDate.toISOString(),
      endDate: item.endDate.toISOString(),
      quantity: item.quantity
    }));
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedItems));
  }

  private canUseStorage(): boolean {
    return isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined';
  }
}
