import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, LoginRequest, LoginResponse, RegisterRequest, UpdateProfileRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = this.getToken();
    if (token) {
      this.loadCurrentUser();
    }
  }

  register(request: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/users/register`, request);
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/users/login`, request)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  logout(): void {
    this.deleteCookie('auth_token');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return this.getCookie('auth_token');
  }

  setToken(token: string): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000));
    document.cookie = `auth_token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private deleteCookie(name: string): void {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: number): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/${id}`);
  }

  updateProfile(id: string, request: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/users/${id}`, request)
      .pipe(
        tap(user => {
          if (this.getCurrentUser()?.id === id) {
            this.currentUserSubject.next(user);
          }
        })
      );
  }

  private loadCurrentUser(): void {
    const token = this.getToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      
      if (!userId) {
        this.logout();
        return;
      }
      
      this.getUser(userId).subscribe({
        next: user => {
          this.currentUserSubject.next(user);
        },
        error: (err) => {
          if (err.status === 401) {
            this.logout();
          }
        }
      });
    } catch (error) {
      this.logout();
    }
  }
}