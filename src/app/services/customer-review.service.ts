import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

const API_URL = `${API_BASE_URL}/content/reviews`;

export interface CustomerReview {
  id: number;
  quote: string;
  name: string;
  role: string;
  rating: number;
  avatar?: string | null;
  createdAt: string;
}

export interface CustomerReviewRequest {
  quote: string;
  name: string;
  role: string;
  rating: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerReviewService {
  private readonly http = inject(HttpClient);

  getReviews(): Observable<CustomerReview[]> {
    return this.http.get<CustomerReview[]>(API_URL);
  }

  createReview(request: CustomerReviewRequest): Observable<CustomerReview> {
    return this.http.post<CustomerReview>(API_URL, request);
  }
}
