import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FollowerService } from '../../services/follower.service';
import { User } from '../../models/user.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  standalone: false
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  currentUser: User | null = null;
  loading = true;
  error = '';
  isFollowing = false;
  followLoading = false;
  followersCount = 0;
  followingCount = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private followerService: FollowerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    
    if (!userId) {
      this.error = 'No user ID provided';
      this.loading = false;
      return;
    }
    
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.cdr.detectChanges();
      });
    
    this.loadUser(userId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUser(id: string): void {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.authService.getUser(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.loading = false;
          this.cdr.detectChanges();
          
          // Load follow stats
          this.loadFollowStats(id);
          
          // Check if current user follows this user
          if (this.currentUser && !this.isOwnProfile()) {
            this.checkFollowStatus(id);
          }
        },
        error: (err) => {
          this.error = 'User not found';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  loadFollowStats(userId: string): void {
    this.followerService.getFollowers(userId).subscribe({
      next: (data) => {
        this.followersCount = data.followers.length;
        this.cdr.detectChanges();
      }
    });

    this.followerService.getFollowing(userId).subscribe({
      next: (data) => {
        this.followingCount = data.following.length;
        this.cdr.detectChanges();
      }
    });
  }

  checkFollowStatus(userId: string): void {
    if (!this.currentUser) return;
    
    this.followerService.getFollowing(this.currentUser.id).subscribe({
      next: (data) => {
        this.isFollowing = data.following.includes(userId);
        this.cdr.detectChanges();
      }
    });
  }

  toggleFollow(): void {
    if (!this.user || !this.currentUser || this.followLoading) return;

    this.followLoading = true;
    this.cdr.detectChanges();

    if (this.isFollowing) {
      this.followerService.unfollowUser(this.user.id).subscribe({
        next: () => {
          this.isFollowing = false;
          this.followersCount--;
          this.followLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.followLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.followerService.followUser(this.user.id).subscribe({
        next: () => {
          this.isFollowing = true;
          this.followersCount++;
          this.followLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.followLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  isOwnProfile(): boolean {
    return this.currentUser?.id === this.user?.id;
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