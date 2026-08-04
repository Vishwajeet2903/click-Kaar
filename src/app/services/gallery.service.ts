import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { AuthService } from './auth.service';

export interface GalleryImage {
  id: number;
  imageUrl: string;
  altText: string;
  wide: boolean;
  tall: boolean;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImageRequest {
  imageUrl: string;
  altText: string;
  wide: boolean;
  tall: boolean;
  active: boolean;
  displayOrder: number;
}

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  getGallery(): Observable<GalleryImage[]> {
    return this.http.get<GalleryImage[]>(`${API_BASE_URL}/content/gallery`).pipe(
      map((images) => images.map((image) => this.resolveImageUrl(image)))
    );
  }

  getAdminGallery(): Observable<GalleryImage[]> {
    return this.http.get<GalleryImage[]>(`${API_BASE_URL}/admin/gallery`, {
      headers: this.authHeaders()
    }).pipe(
      map((images) => images.map((image) => this.resolveImageUrl(image)))
    );
  }

  createGalleryImage(request: GalleryImageRequest): Observable<GalleryImage> {
    return this.http.post<GalleryImage>(`${API_BASE_URL}/admin/gallery`, request, {
      headers: this.authHeaders()
    }).pipe(map((image) => this.resolveImageUrl(image)));
  }

  uploadGalleryImage(formData: FormData): Observable<GalleryImage> {
    return this.http.post<GalleryImage>(`${API_BASE_URL}/admin/gallery/upload`, formData, {
      headers: this.authHeaders()
    }).pipe(map((image) => this.resolveImageUrl(image)));
  }

  deleteGalleryImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/admin/gallery/${imageId}`, {
      headers: this.authHeaders()
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private resolveImageUrl(image: GalleryImage): GalleryImage {
    if (image.imageUrl.startsWith('/uploads/')) {
      return { ...image, imageUrl: `${API_ORIGIN}${image.imageUrl}` };
    }
    return image;
  }
}
