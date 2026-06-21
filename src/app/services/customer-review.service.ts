import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:8080/api/content/reviews';

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
