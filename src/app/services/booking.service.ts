import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Booking } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  getBookings(): Observable<Booking[]> {
    return of([
      { id: 'CK-2048', productName: 'Canon EOS R5 Cinema Kit', dateRange: 'Jun 3 - Jun 7, 2026', status: 'Active', total: 19824 },
      { id: 'CK-1981', productName: 'Aputure LS 600D Pro', dateRange: 'May 10 - May 12, 2026', status: 'Past', total: 7670 },
      { id: 'CK-2077', productName: 'DJI RS 4 Pro Gimbal', dateRange: 'Jun 12 - Jun 15, 2026', status: 'Upcoming', total: 8496 }
    ]);
  }
}
