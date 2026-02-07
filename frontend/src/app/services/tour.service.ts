import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Tour, 
  CreateTourRequest, 
  Waypoint, 
  ShoppingCart, 
  Purchase, 
  TourExecution,
  PositionSimulator 
} from '../models/tour.model';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private apiUrl = `${environment.apiUrl}/tours`;

  constructor(private http: HttpClient) {}

  getAllTours(): Observable<Tour[]> {
    return this.http.get<Tour[]>(this.apiUrl);
  }

  getTourById(id: string): Observable<Tour> {
    return this.http.get<Tour>(`${this.apiUrl}/${id}`);
  }

  getToursByAuthor(authorId: string): Observable<Tour[]> {
    return this.http.get<Tour[]>(`${this.apiUrl}/author/${authorId}`);
  }

  createTour(request: CreateTourRequest): Observable<Tour> {
    return this.http.post<Tour>(this.apiUrl, request);
  }

  addWaypoint(tourId: string, waypoint: Waypoint): Observable<Waypoint> {
    return this.http.post<Waypoint>(`${this.apiUrl}/${tourId}/waypoints`, waypoint);
  }

  deleteWaypoint(tourId: string, waypointId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tourId}/waypoints/${waypointId}`);
  }

  setPosition(latitude: number, longitude: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/position`, { latitude, longitude });
  }

  getPosition(): Observable<PositionSimulator> {
    return this.http.get<PositionSimulator>(`${this.apiUrl}/position`);
  }

  addToCart(tourId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cart/add/${tourId}`, {});
  }

  getCart(): Observable<ShoppingCart> {
    return this.http.get<ShoppingCart>(`${this.apiUrl}/cart`);
  }

  removeFromCart(tourId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cart/remove/${tourId}`);
  }

  checkout(): Observable<{ purchases: Purchase[] }> {
    return this.http.post<{ purchases: Purchase[] }>(`${this.apiUrl}/checkout`, {});
  }

  getPurchases(): Observable<Purchase[]> {
    return this.http.get<Purchase[]>(`${this.apiUrl}/purchases`);
  }

  startTour(tourId: string): Observable<TourExecution> {
    return this.http.post<TourExecution>(`${this.apiUrl}/execute/${tourId}`, {});
  }

  checkProgress(executionId: string): Observable<TourExecution> {
    return this.http.post<TourExecution>(`${this.apiUrl}/execute/${executionId}/check`, {});
  }

  abandonTour(executionId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/execute/${executionId}/abandon`, {});
  }

  getExecutions(): Observable<TourExecution[]> {
    return this.http.get<TourExecution[]>(`${this.apiUrl}/executions`);
  }
}