import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TourService } from '../../services/tour.service';
import { Tour, Purchase, TourExecution } from '../../models/tour.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface PurchaseWithTour {
  purchase: Purchase;
  tour: Tour | null;
  showFullToken?: boolean;
  lastExecution?: TourExecution;
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
  executionsMap: Map<string, TourExecution> = new Map();

  constructor(
    private tourService: TourService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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

    // Load purchases and executions in parallel
    forkJoin({
      purchases: this.tourService.getPurchases(),
      executions: this.tourService.getExecutions()
    }).subscribe({
      next: ({ purchases, executions }) => {
        if (purchases.length === 0) {
          this.purchases = [];
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        // Build executions map - get latest execution for each tour
        executions.forEach(exec => {
          const existing = this.executionsMap.get(exec.tourId);
          if (!existing || new Date(exec.startedAt) > new Date(existing.startedAt)) {
            this.executionsMap.set(exec.tourId, exec);
          }
        });

        // Fetch tour details
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
              tour: tours[index],
              lastExecution: this.executionsMap.get(purchase.tourId)
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
        console.error('Error loading data:', err);
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
    const lastExecution = this.executionsMap.get(tourId);
    
    // Check if there's an active (not completed, not abandoned) session
    if (lastExecution && !lastExecution.completedAt && !lastExecution.abandonedAt) {
      // Resume active session
      this.router.navigate(['/tour-execution', lastExecution.id]);
    } else {
      // Start new session (first time or restart)
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
  }

  getButtonText(item: PurchaseWithTour): string {
    const exec = item.lastExecution;
    
    if (!exec) {
      return 'Start Tour';
    }
    
    if (!exec.completedAt && !exec.abandonedAt) {
      return 'Resume Tour';
    }
    
    return 'Restart Tour';
  }

  getButtonIcon(item: PurchaseWithTour): string {
    const exec = item.lastExecution;
    
    if (!exec) {
      return 'bi-play-circle';
    }
    
    if (!exec.completedAt && !exec.abandonedAt) {
      return 'bi-play-circle';
    }
    
    return 'bi-arrow-clockwise';
  }

  getButtonClass(item: PurchaseWithTour): string {
    const exec = item.lastExecution;
    
    if (!exec) {
      return 'btn-success'; // Green for Start
    }
    
    if (!exec.completedAt && !exec.abandonedAt) {
      return 'btn-primary'; // Blue for Resume
    }
    
    if (exec.completedAt) {
      return 'btn-warning'; // Orange for completed Restart
    }
    
    if (exec.abandonedAt) {
      return 'btn-danger'; // Red for abandoned Restart
    }
    
    return 'btn-primary';
  }

  getSessionStatus(item: PurchaseWithTour): string | null {
    const exec = item.lastExecution;
    
    if (!exec) {
      return null;
    }
    
    if (!exec.completedAt && !exec.abandonedAt) {
      return null; // Active session, no status message
    }
    
    if (exec.completedAt) {
      return `Last session: Completed on ${this.formatDateTime(exec.completedAt)}`;
    }
    
    if (exec.abandonedAt) {
      return `Last session: Abandoned on ${this.formatDateTime(exec.abandonedAt)}`;
    }
    
    return null;
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
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  toggleToken(item: PurchaseWithTour): void {
    item.showFullToken = !item.showFullToken;
    this.cdr.detectChanges();
  }
}