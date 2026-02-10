import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TourService } from '../../services/tour.service';
import { AuthService } from '../../services/auth.service';
import { Tour } from '../../models/tour.model';
import { User } from '../../models/user.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-tour-detail',
  templateUrl: './tour-detail.component.html',
  styleUrl: './tour-detail.component.css',
  standalone: false
})
export class TourDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  tour: Tour | null = null;
  author: User | null = null;
  currentUser: User | null = null;
  loading = true;
  error = '';
  map: L.Map | null = null;
  isAuthor = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tourService: TourService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });

    const tourId = this.route.snapshot.paramMap.get('id');
    if (!tourId) {
      this.error = 'No tour ID provided';
      this.loading = false;
      return;
    }

    this.loadTour(tourId);
  }

  ngAfterViewInit(): void {
    // Map will be initialized after tour loads
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  loadTour(id: string): void {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.tourService.getTourById(id).subscribe({
      next: (tour) => {
        this.tour = tour;
        
        // Check if current user is the author
        this.isAuthor = this.currentUser?.id === tour.authorId;
        
        // Load author info
        this.authService.getUser(tour.authorId).subscribe({
          next: (user) => {
            this.author = user;
            this.cdr.detectChanges();
          }
        });
        
        this.loading = false;
        this.cdr.detectChanges();
        
        // Initialize map after view is ready
        setTimeout(() => this.initMap(), 100);
      },
      error: (err) => {
        this.error = 'Tour not found';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  initMap(): void {
    if (!this.tour || this.tour.waypoints.length === 0) return;

    const firstWaypoint = this.tour.waypoints[0];
    
    this.map = L.map('tour-map').setView([firstWaypoint.latitude, firstWaypoint.longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add markers for all waypoints (or just first if not purchased)
    const visibleWaypoints = this.canSeeAllWaypoints() 
      ? this.tour.waypoints 
      : [this.tour.waypoints[0]];

    visibleWaypoints.forEach((waypoint, index) => {
      const icon = L.icon({
        iconUrl: index === 0 
          ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
          : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const marker = L.marker([waypoint.latitude, waypoint.longitude], { icon })
        .addTo(this.map!)
        .bindPopup(`
          <strong>${waypoint.name}</strong><br>
          ${waypoint.description}
          ${waypoint.imagePath ? `<br><img src="${waypoint.imagePath}" style="max-width: 200px; margin-top: 5px;">` : ''}
        `);

      if (index === 0) {
        marker.openPopup();
      }
    });

    // Draw route if all waypoints visible
    if (this.canSeeAllWaypoints() && this.tour.waypoints.length > 1) {
      const latlngs = this.tour.waypoints.map(w => [w.latitude, w.longitude] as [number, number]);
      L.polyline(latlngs, { color: '#007bff', weight: 3 }).addTo(this.map);
      
      // Fit bounds to show all waypoints
      this.map.fitBounds(latlngs);
    }
  }

  canSeeAllWaypoints(): boolean {
    if (!this.tour) return false;
    // Authors, guides, and tourists who purchased can see all waypoints
    return this.currentUser?.role !== 0 || this.tour.isPurchased || this.tour.authorId === this.currentUser?.id;
  }

  addToCart(): void {
    if (!this.tour) return;
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.tourService.addToCart(this.tour.id).subscribe({
      next: () => {
        alert('Tour added to cart!');
      },
      error: (err) => {
        alert('Failed to add tour to cart');
      }
    });
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  viewAuthorProfile(): void {
    if (this.author) {
      this.router.navigate(['/profile', this.author.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/tours']);
  }

  editTour(): void {
    if (this.tour) {
      this.router.navigate(['/tours', this.tour.id, 'edit']);
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