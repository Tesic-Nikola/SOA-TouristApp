import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TourService } from '../../services/tour.service';
import { AuthService } from '../../services/auth.service';
import { Tour } from '../../models/tour.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-my-tours',
  templateUrl: './my-tours.component.html',
  styleUrl: './my-tours.component.css',
  standalone: false
})
export class MyToursComponent implements OnInit {
  tours: Tour[] = [];
  currentUser: User | null = null;
  loading = true;
  error = '';

  constructor(
    private tourService: TourService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      
      if (!user || user.role !== 1) {
        this.router.navigate(['/']);
        return;
      }
      
      this.loadMyTours();
      this.cdr.detectChanges();
    });
  }

  loadMyTours(): void {
    if (!this.currentUser) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    this.tourService.getToursByAuthor(this.currentUser.id).subscribe({
      next: (tours) => {
        this.tours = tours;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load tours';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createTour(): void {
    this.router.navigate(['/tours/create']);
  }

  editTour(tourId: string): void {
    this.router.navigate(['/tours', tourId, 'edit']);
  }

  viewTour(tourId: string): void {
    this.router.navigate(['/tours', tourId]);
  }

  deleteTour(tour: Tour, event: Event): void {
    event.stopPropagation();
    
    if (confirm(`Delete "${tour.name}"? This cannot be undone.`)) {
      this.tourService.deleteTour(tour.id).subscribe({
        next: () => {
          this.tours = this.tours.filter(t => t.id !== tour.id);
          this.cdr.detectChanges();
          alert('Tour deleted successfully!');
        },
        error: (err) => {
          alert('Failed to delete tour');
        }
      });
    }
  }

  getDifficultyBadgeClass(difficulty: number): string {
    switch (difficulty) {
      case 0: return 'bg-success';
      case 1: return 'bg-warning';
      case 2: return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getDifficultyLabel(difficulty: number): string {
    switch (difficulty) {
      case 0: return 'Easy';
      case 1: return 'Medium';
      case 2: return 'Hard';
      default: return 'Unknown';
    }
  }
}