export interface Product {
  id: number;
  name: string;
  category: string;
  brand: string;
  image: string;
  gallery: string[];
  description: string;
  specifications: Record<string, string>;
  dailyPrice: number;
  weeklyPrice: number;
  warrantyDate?: string;
  invoiceUrl?: string;
  available: boolean;
  rating: number;
  stock: number;
  popularity: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  startDate: Date;
  endDate: Date;
  quantity: number;
}

export interface Booking {
  id: string;
  productName: string;
  dateRange: string;
  status: 'Active' | 'Past' | 'Upcoming';
  total: number;
}
