import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './api.config';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export interface KitProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  dailyPrice: number;
}

export interface Kit {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  rent: number;
  active: boolean;
  products: KitProduct[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class KitService {
  private readonly http = inject(HttpClient);

  getKits(): Observable<Kit[]> {
    return this.http.get<Kit[]>(`${API_BASE_URL}/content/kits`).pipe(
      map((kits) => kits.map((kit) => this.resolveImageUrl(kit)))
    );
  }

  private resolveImageUrl(kit: Kit): Kit {
    if (kit.imageUrl.startsWith('/uploads/')) {
      return { ...kit, imageUrl: `${API_ORIGIN}${kit.imageUrl}` };
    }
    return kit;
  }
}