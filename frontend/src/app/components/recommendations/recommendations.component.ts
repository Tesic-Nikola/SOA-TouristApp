import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FollowerService, UserRecommendation } from '../../services/follower.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrl: './recommendations.component.css',
  standalone: false
})
export class RecommendationsComponent implements OnInit {
  recommendations: UserRecommendation[] = [];
  users: Map<string, User> = new Map();
  loading = true;
  error = '';

  constructor(
    private followerService: FollowerService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadRecommendations();
  }

  loadRecommendations(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.followerService.getRecommendations().subscribe({
      next: (data) => {
        this.recommendations = data.recommendations || [];
        
        // Only load user details if we have recommendations
        if (this.recommendations && this.recommendations.length > 0) {
          this.recommendations.forEach(rec => {
            this.authService.getUser(rec.userId).subscribe({
              next: (user) => {
                this.users.set(rec.userId, user);
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error('Failed to load user:', err);
              }
            });
          });
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load recommendations:', err);
        this.recommendations = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }

  getRoleDisplay(role: number): string {
    const roles: { [key: number]: string } = {
      0: 'Tourist',
      1: 'Guide',
      2: 'Administrator'
    };
    return roles[role] || 'Unknown';
  }
}