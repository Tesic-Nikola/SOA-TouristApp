import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
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
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
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
        },
        error: (err) => {
          this.error = 'User not found';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
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