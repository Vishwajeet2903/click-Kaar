import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { CartItem, Product } from '../models/product.model';
import { discountedRentalPrice, rentalDiscountPercent } from './rental-pricing';

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
  readonly baseSubtotal = computed(() => this.items().reduce((sum, item) => sum + this.itemBaseTotal(item), 0));
  readonly subtotal = computed(() => this.items().reduce((sum, item) => sum + this.itemTotal(item), 0));
  readonly durationDiscountAmount = computed(() => this.baseSubtotal() - this.subtotal());
  readonly securityDeposit = computed(() => Math.round(this.subtotal() * 0.3));
  readonly grandTotal = computed(() => this.subtotal() + this.securityDeposit());

  constructor() {
    effect(() => {
      this.saveCart(this.items());
    });
  }

  add(product: Product, startDate = tomorrow(), endDate = afterDays(3), quantity = 1): boolean {
    if (!this.canAdd(product, startDate, endDate, quantity)) {
      return false;
    }

    this.items.update((items) => {
      const key = this.cartItemKey(product.id, startDate, endDate);
      const existing = items.find((item) => this.cartItemKey(item.product.id, item.startDate, item.endDate) === key);
      if (existing) {
        const nextQuantity = Math.min(this.availableStock(product), existing.quantity + quantity);
        return items.map((item) => this.cartItemKey(item.product.id, item.startDate, item.endDate) === key ? { ...item, product, quantity: nextQuantity, startDate, endDate } : item);
      }
      return [...items, { product, startDate, endDate, quantity: Math.min(this.availableStock(product), quantity) }];
    });
    return true;
  }

  updateQuantity(productId: number, startDate: Date, endDate: Date, quantity: number): void {
    const key = this.cartItemKey(productId, startDate, endDate);
    this.items.update((items) => items.map((item) => {
      if (this.cartItemKey(item.product.id, item.startDate, item.endDate) !== key) {
        return item;
      }
      return { ...item, quantity: Math.min(this.availableStock(item.product), Math.max(1, quantity)) };
    }));
  }

  quantityFor(productId: number, startDate: Date, endDate: Date): number {
    const key = this.cartItemKey(productId, startDate, endDate);
    return this.items().find((item) => this.cartItemKey(item.product.id, item.startDate, item.endDate) === key)?.quantity ?? 0;
  }

  canAdd(product: Product, startDate = tomorrow(), endDate = afterDays(3), quantity = 1): boolean {
    return !this.hasPastDate(startDate, endDate)
        && this.quantityFor(product.id, startDate, endDate) + quantity <= this.availableStock(product);
  }

  availableStock(product: Product): number {
    return Math.max(0, product.stock ?? (product.available ? 1 : 0));
  }

  itemKey(item: CartItem): string {
    return this.cartItemKey(item.product.id, item.startDate, item.endDate);
  }

  remove(productId: number): void {
    this.items.update((items) => items.filter((item) => item.product.id !== productId));
  }

  removeItem(productId: number, startDate: Date, endDate: Date): void {
    const key = this.cartItemKey(productId, startDate, endDate);
    this.items.update((items) => items.filter((item) => this.cartItemKey(item.product.id, item.startDate, item.endDate) !== key));
  }

  clear(): void {
    this.items.set([]);
  }

  removeExpiredItems(): void {
    this.items.update((items) => items.filter((item) => this.isCurrentRentalWindow(item.startDate, item.endDate)));
  }

  duration(item: CartItem): number {
    const diff = item.endDate.getTime() - item.startDate.getTime();
    return Math.max(1, Math.floor(diff / 86_400_000) + 1);
  }

  itemTotal(item: CartItem): number {
    return discountedRentalPrice(item.product.dailyPrice, this.duration(item), item.quantity);
  }

  itemBaseTotal(item: CartItem): number {
    return this.duration(item) * item.product.dailyPrice * item.quantity;
  }

  itemDiscountPercent(item: CartItem): number {
    return rentalDiscountPercent(this.duration(item));
  }

  itemDiscountAmount(item: CartItem): number {
    return this.itemBaseTotal(item) - this.itemTotal(item);
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
        quantity: Math.min(this.availableStock(item.product), Math.max(1, item.quantity))
      })).filter((item) => this.availableStock(item.product) > 0 && this.isCurrentRentalWindow(item.startDate, item.endDate));
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

  private cartItemKey(productId: number, startDate: Date, endDate: Date): string {
    return `${productId}:${this.dateKey(startDate)}:${this.dateKey(endDate)}`;
  }

  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  private isCurrentRentalWindow(startDate: Date, endDate: Date): boolean {
    return !this.hasPastDate(startDate, endDate);
  }

  private hasPastDate(startDate: Date, endDate: Date): boolean {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return start < today || end < today;
  }
}
