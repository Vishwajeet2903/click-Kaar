import { Injectable, computed, signal } from '@angular/core';
import { CartItem, Product } from '../models/product.model';

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

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>([]);
  readonly count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotal = computed(() => this.items().reduce((sum, item) => sum + this.itemTotal(item), 0));
  readonly securityDeposit = computed(() => Math.round(this.subtotal() * 0.3));
  readonly tax = computed(() => Math.round(this.subtotal() * 0.18));
  readonly grandTotal = computed(() => this.subtotal() + this.securityDeposit() + this.tax());

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
}
