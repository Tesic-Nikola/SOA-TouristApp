import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TourService } from '../../services/tour.service';
import { Tour, Purchase } from '../../models/tour.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface PurchaseWithTour {
  purchase: Purchase;
  tour: Tour | null;
  showFullToken?: boolean;
}

@Component({
  selector: 'app-my-purchases',
  templateUrl: './my-purchases.component.html',
  styleUrl: './my-purchases.component.css',
  standalone: false
})
export class MyPurchasesComponent implements OnInit {
  purchases: PurchaseWithTour[] = [];
  loading = true;
  error: string | null = null;
  showSuccess = false;

  constructor(
    private tourService: TourService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Check if coming from successful checkout
    this.route.queryParams.subscribe(params => {
      if (params['success']) {
        this.showSuccess = true;
        setTimeout(() => {
          this.showSuccess = false;
          this.cdr.detectChanges();
        }, 5000);
      }
    });

    this.loadPurchases();
  }

  loadPurchases(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.tourService.getPurchases().subscribe({
      next: (purchases) => {
        if (purchases.length === 0) {
          this.purchases = [];
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        // Fetch tour details for each purchase
        const tourRequests = purchases.map(purchase => 
          this.tourService.getTourById(purchase.tourId).pipe(
            catchError(err => {
              console.error(`Failed to load tour ${purchase.tourId}:`, err);
              return of(null);
            })
          )
        );

        forkJoin(tourRequests).subscribe({
          next: (tours) => {
            this.purchases = purchases.map((purchase, index) => ({
              purchase,
              tour: tours[index]
            }));
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error loading tours:', err);
            this.error = 'Failed to load tour details';
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error loading purchases:', err);
        this.error = 'Failed to load purchases';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewTour(tourId: string): void {
    this.router.navigate(['/tours', tourId]);
  }

  startTour(tourId: string): void {
    this.tourService.startTour(tourId).subscribe({
      next: (execution) => {
        this.router.navigate(['/tour-execution', execution.id]);
      },
      error: (err) => {
        console.error('Error starting tour:', err);
        alert('Failed to start tour');
      }
    });
  }

  getDifficultyLabel(difficulty: number): string {
    switch (difficulty) {
      case 0: return 'Easy';
      case 1: return 'Medium';
      case 2: return 'Hard';
      default: return 'Unknown';
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  toggleToken(item: PurchaseWithTour): void {
    item.showFullToken = !item.showFullToken;
    this.cdr.detectChanges();
  }
}