import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  standalone: false
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  currentUser: User | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      if (user && userId === user.id) {
        this.user = user;
        this.loading = false;
      }
    });
    
    if (userId) {
      this.loadUser(userId);
    } else {
      this.error = 'No user ID provided';
      this.loading = false;
    }
  }

  loadUser(id: string): void {
    if (this.user && this.user.id === id) {
      return;
    }
    
    this.authService.getUser(id).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'User not found';
        this.loading = false;
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