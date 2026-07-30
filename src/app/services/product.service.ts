import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, concatMap, from, map, of, reduce, startWith, switchMap } from 'rxjs';
import { Product } from '../models/product.model';
import { API_BASE_URL } from './api.config';

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
const PRODUCT_IMAGE_FALLBACK = '/clickkaar-logo.png';

export function productFallbackImage(): string {
  return PRODUCT_IMAGE_FALLBACK;
}

export function useProductImageFallback(event: Event): void {
  const image = event.target as HTMLImageElement | null;
  if (!image) {
    return;
  }

  const fallback = productFallbackImage();
  if (image.src !== fallback) {
    image.src = fallback;
  }
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Canon EOS R5 Cinema Kit',
    category: 'Cameras',
    brand: 'Canon',
    image: img('photo-1516035069371-29a1b244cc32'),
    gallery: [img('photo-1516035069371-29a1b244cc32'), img('photo-1502920917128-1aa500764cbd'), img('photo-1495707902641-75cac588d2e9')],
    description: 'A high-resolution mirrorless workhorse for commercial stills, hybrid shoots, and crisp 8K capture.',
    specifications: { Sensor: '45MP full-frame CMOS', Video: '8K RAW', Mount: 'RF', Stabilization: 'In-body 5-axis' },
    dailyPrice: 4200,
    weeklyPrice: 21800,
    available: true,
    rating: 4.9,
    stock: 4,
    popularity: 98,
    createdAt: '2026-05-09'
  },
  {
    id: 2,
    name: 'Sony Alpha A7S III',
    category: 'Cameras',
    brand: 'Sony',
    image: img('photo-1500634245200-e5245c7574ef'),
    gallery: [img('photo-1500634245200-e5245c7574ef'), img('photo-1495121553079-4c61bcce1894')],
    description: 'Low-light video favorite with fast autofocus, deep dynamic range, and compact rigging options.',
    specifications: { Sensor: '12.1MP full-frame', Video: '4K 120p', Profiles: 'S-Log3, HLG', Slots: 'Dual CFexpress/SD' },
    dailyPrice: 3900,
    weeklyPrice: 19900,
    available: true,
    rating: 4.8,
    stock: 3,
    popularity: 95,
    createdAt: '2026-05-15'
  },
  {
    id: 3,
    name: 'Nikon Z 24-70mm f/2.8 S',
    category: 'Lenses',
    brand: 'Nikon',
    image: img('photo-1617005082133-548c4dd27f35'),
    gallery: [img('photo-1617005082133-548c4dd27f35'), img('photo-1585829365295-ab7cd400c167')],
    description: 'Fast, sharp standard zoom for portraits, events, documentaries, and travel assignments.',
    specifications: { Mount: 'Nikon Z', Aperture: 'f/2.8', Range: '24-70mm', WeatherSealed: 'Yes' },
    dailyPrice: 1600,
    weeklyPrice: 8200,
    available: true,
    rating: 4.7,
    stock: 6,
    popularity: 89,
    createdAt: '2026-04-28'
  },
  {
    id: 4,
    name: 'Sigma 85mm f/1.4 Art',
    category: 'Lenses',
    brand: 'Sigma',
    image: img('photo-1512790182412-b19e6d62bc39'),
    gallery: [img('photo-1512790182412-b19e6d62bc39'), img('photo-1542038784456-1ea8e935640e')],
    description: 'Portrait prime with creamy falloff, high contrast, and beautiful subject separation.',
    specifications: { Mount: 'E / RF / Z', Aperture: 'f/1.4', Elements: '14 elements', Focus: 'HSM AF' },
    dailyPrice: 1200,
    weeklyPrice: 5900,
    available: false,
    rating: 4.8,
    stock: 0,
    popularity: 84,
    createdAt: '2026-03-22'
  },
  {
    id: 5,
    name: 'Aputure LS 600D Pro',
    category: 'Lighting',
    brand: 'Aputure',
    image: img('photo-1554048612-b6a482bc67e5'),
    gallery: [img('photo-1554048612-b6a482bc67e5'), img('photo-1520299607509-dcd935f9a839')],
    description: 'Daylight-balanced LED fixture with serious punch for interviews, sets, and location work.',
    specifications: { Output: '600W LED', Color: '5600K', Control: 'DMX, Sidus Link', Power: 'AC / V-mount' },
    dailyPrice: 2500,
    weeklyPrice: 12800,
    available: true,
    rating: 4.6,
    stock: 5,
    popularity: 82,
    createdAt: '2026-05-20'
  },
  {
    id: 6,
    name: 'Rode Wireless PRO Kit',
    category: 'Audio Equipment',
    brand: 'Rode',
    image: img('photo-1590602847861-f357a9332bbc'),
    gallery: [img('photo-1590602847861-f357a9332bbc'), img('photo-1516280440614-37939bbacd81')],
    description: 'Compact dual-channel wireless audio system with onboard recording and creator-friendly controls.',
    specifications: { Channels: '2', Recording: '32-bit float', Range: '260m line-of-sight', Battery: 'Up to 7 hours' },
    dailyPrice: 900,
    weeklyPrice: 4300,
    available: true,
    rating: 4.5,
    stock: 8,
    popularity: 76,
    createdAt: '2026-04-18'
  },
  {
    id: 7,
    name: 'Manfrotto 504X Fluid Video Tripod',
    category: 'Tripods',
    brand: 'Manfrotto',
    image: img('photo-1607462109225-6b64ae2dd3cb'),
    gallery: [img('photo-1607462109225-6b64ae2dd3cb'), img('photo-1606983340126-99ab4feaa64a')],
    description: 'Stable video support with smooth pans, counterbalance, and fast field setup.',
    specifications: { Payload: '12kg', Head: 'Fluid', Legs: 'Aluminum twin', Plate: '504PLONGR' },
    dailyPrice: 850,
    weeklyPrice: 4100,
    available: true,
    rating: 4.4,
    stock: 7,
    popularity: 71,
    createdAt: '2026-02-02'
  },
  {
    id: 8,
    name: 'DJI RS 4 Pro Gimbal',
    category: 'Accessories',
    brand: 'DJI',
    image: img('photo-1520549233664-03f65c1d1327'),
    gallery: [img('photo-1520549233664-03f65c1d1327'), img('photo-1516724562728-afc824a36e84')],
    description: 'Professional stabilization for mirrorless and cinema cameras with fast balancing and tracking support.',
    specifications: { Payload: '4.5kg', Axis: '3-axis', Runtime: '13 hours', Features: 'LiDAR-ready' },
    dailyPrice: 1800,
    weeklyPrice: 8800,
    available: true,
    rating: 4.7,
    stock: 4,
    popularity: 88,
    createdAt: '2026-05-24'
  }
];

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  readonly categories = signal(['Cameras', 'Lenses', 'Lighting', 'Audio Equipment', 'Tripods', 'Accessories']);

  getProducts(): Observable<Product[]> {
    return this.http.get<ApiProduct[]>(`${API_BASE_URL}/products`).pipe(
      switchMap((products) => products.length ? of(this.toProducts(products)) : this.getProductsByCategoryFallback()),
      catchError(() => this.getProductsByCategoryFallback())
    );
  }

  getProduct(id: number): Observable<Product | undefined> {
    return this.http.get<ApiProduct>(`${API_BASE_URL}/products/${id}`).pipe(
      map((product) => this.toProduct(product)),
      catchError(() => of(PRODUCTS.find((product) => product.id === id)))
    );
  }

  getFeatured(): Observable<Product[]> {
    return this.getProducts().pipe(
      map((products) => {
        const availableProducts = products.filter((product) => product.available);
        const featuredProducts = availableProducts.length ? availableProducts : products;
        return featuredProducts.slice(0, 4);
      }),
      startWith(PRODUCTS.filter((product) => product.available).slice(0, 4))
    );
  }

  private toProduct(product: ApiProduct): Product {
    const category = displayCategory(product.category);
    const directImages = [product.imageLink, product.link1, product.link2].filter((image): image is string => !!image);
    const gallery = uniqueImages([...(product.images ?? []), ...directImages].map(normalizeProductImagePath));
    const productGallery = gallery.length ? gallery : [productFallbackImage()];
    return {
      id: product.id,
      name: product.name,
      category,
      brand: product.brand,
      image: productGallery[0],
      gallery: productGallery,
      description: product.fullDescription || product.shortDescription || '',
      specifications: parseSpecs(product.specs),
      dailyPrice: Number(product.dailyPrice),
      weeklyPrice: Number(product.weeklyPrice),
      warrantyDate: product.warrantyDate,
      invoiceUrl: product.invoiceUrl,
      availabilityStatus: product.availabilityStatus,
      available: !product.availabilityStatus || product.availabilityStatus === 'AVAILABLE',
      rating: 4.6,
      stock: !product.availabilityStatus || product.availabilityStatus === 'AVAILABLE' ? 1 : 0,
      popularity: 80,
      createdAt: '2026-01-01'
    };
  }

  private getProductsByCategoryFallback(): Observable<Product[]> {
    return from(API_CATEGORIES).pipe(
      concatMap((category) => this.http.get<ApiProduct[]>(`${API_BASE_URL}/products/category/${category}`).pipe(
        catchError(() => of([] as ApiProduct[]))
      )),
      reduce((all, products) => [...all, ...products], [] as ApiProduct[]),
      map((products) => products.length ? this.toProducts(products) : PRODUCTS)
    );
  }

  private toProducts(products: ApiProduct[]): Product[] {
    return products.map((product) => this.toProduct(product));
  }
}

const API_CATEGORIES: ApiProduct['category'][] = ['CAMERAS', 'LENSES', 'LIGHTING', 'AUDIO', 'TRIPODS_SUPPORT', 'ACCESSORIES'];

interface ApiProduct {
  id: number;
  name: string;
  brand: string;
  category: 'CAMERAS' | 'LENSES' | 'LIGHTING' | 'AUDIO' | 'TRIPODS_SUPPORT' | 'ACCESSORIES';
  shortDescription?: string;
  fullDescription?: string;
  specs?: string;
  dailyPrice: number | string;
  weeklyPrice: number | string;
  warrantyDate?: string;
  invoiceUrl?: string;
  imageLink?: string;
  link1?: string;
  link2?: string;
  availabilityStatus?: 'AVAILABLE' | 'UNAVAILABLE' | 'ON_RENT' | 'MAINTENANCE';
  images?: string[];
}

function uniqueImages(images: string[]): string[] {
  return [...new Set(images.filter(Boolean))];
}

function normalizeProductImagePath(image: string): string {
  if (image.startsWith('/products/')) {
    return image.replace(/:/g, '_');
  }

  return image;
}

function displayCategory(category: ApiProduct['category']): string {
  return {
    CAMERAS: 'Cameras',
    LENSES: 'Lenses',
    LIGHTING: 'Lighting',
    AUDIO: 'Audio Equipment',
    TRIPODS_SUPPORT: 'Tripods',
    ACCESSORIES: 'Accessories'
  }[category];
}

function parseSpecs(specs?: string): Record<string, string> {
  if (!specs) {
    return {};
  }

  return specs.split('\n').reduce<Record<string, string>>((result, line) => {
    const separator = line.indexOf(':');
    if (separator > 0) {
      result[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
    return result;
  }, {});
}
