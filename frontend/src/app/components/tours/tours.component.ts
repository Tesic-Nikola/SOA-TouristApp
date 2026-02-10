import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TourService } from '../../services/tour.service';
import { AuthService } from '../../services/auth.service';
import { Tour } from '../../models/tour.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-tours',
  templateUrl: './tours.component.html',
  styleUrl: './tours.component.css',
  standalone: false
})
export class ToursComponent implements OnInit {
  tours: Tour[] = [];
  filteredTours: Tour[] = [];
  authors: Map<string, User> = new Map();
  loading = true;
  error = '';
  currentUser: User | null = null;
  
  // Filters
  searchTerm = '';
  selectedDifficulty: string = 'all';
  selectedTag: string = 'all';
  allTags: string[] = [];

  constructor(
    private tourService: TourService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });

    this.loadTours();
  }

  loadTours(): void {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.tourService.getAllTours().subscribe({
      next: (tours) => {
        this.tours = tours;
        this.filteredTours = tours;
        
        // Extract all unique tags
        const tagSet = new Set<string>();
        tours.forEach(tour => tour.tags.forEach(tag => tagSet.add(tag)));
        this.allTags = Array.from(tagSet).sort();
        
        // Load author info for each tour
        tours.forEach(tour => {
          if (!this.authors.has(tour.authorId)) {
            this.authService.getUser(tour.authorId).subscribe({
              next: (user) => {
                this.authors.set(tour.authorId, user);
                this.cdr.detectChanges();
              }
            });
          }
        });
        
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

  applyFilters(): void {
    this.filteredTours = this.tours.filter(tour => {
      const matchesSearch = !this.searchTerm || 
        tour.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tour.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesDifficulty = this.selectedDifficulty === 'all' || 
        tour.difficulty === parseInt(this.selectedDifficulty);
      
      const matchesTag = this.selectedTag === 'all' || 
        tour.tags.includes(this.selectedTag);
      
      return matchesSearch && matchesDifficulty && matchesTag;
    });
    
    this.cdr.detectChanges();
  }

  viewTour(tourId: string): void {
    this.router.navigate(['/tours', tourId]);
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