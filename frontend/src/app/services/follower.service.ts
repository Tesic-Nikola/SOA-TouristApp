import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserRecommendation {
  userId: string;
  score: number;
}

@Injectable({
  providedIn: 'root'
})
export class FollowerService {
  private apiUrl = `${environment.apiUrl}/followers`;

  constructor(private http: HttpClient) {}

  followUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/follow/${userId}`, {});
  }

  unfollowUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/unfollow/${userId}`);
  }

  getFollowers(userId: string): Observable<{ followers: string[] }> {
    return this.http.get<{ followers: string[] }>(`${this.apiUrl}/followers/${userId}`);
  }

  getFollowing(userId: string): Observable<{ following: string[] }> {
    return this.http.get<{ following: string[] }>(`${this.apiUrl}/following/${userId}`);
  }

  getRecommendations(): Observable<{ recommendations: UserRecommendation[] }> {
    return this.http.get<{ recommendations: UserRecommendation[] }>(`${this.apiUrl}/recommendations`);
  }
}