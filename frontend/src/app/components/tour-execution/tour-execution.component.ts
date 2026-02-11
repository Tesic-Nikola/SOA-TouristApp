import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TourService } from '../../services/tour.service';
import { Tour, TourExecution, PositionSimulator, Waypoint } from '../../models/tour.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-tour-execution',
  templateUrl: './tour-execution.component.html',
  styleUrl: './tour-execution.component.css',
  standalone: false
})
export class TourExecutionComponent implements OnInit, AfterViewInit, OnDestroy {
  execution: TourExecution | null = null;
  tour: Tour | null = null;
  currentPosition: PositionSimulator | null = null;
  loading = true;
  error = '';
  
  map: L.Map | null = null;
  waypointMarkers: Map<string, L.Marker> = new Map();
  positionMarker: L.Marker | null = null;
  routeLine: L.Polyline | null = null;
  
  checkInterval: any = null;
  
  isCompleted = false;
  isAbandoned = false;
  
  showPositionOverlay = false;
  positionUpdating = false;
  
  selectedWaypoint: Waypoint | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tourService: TourService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const executionId = this.route.snapshot.paramMap.get('id');
    if (!executionId) {
      this.error = 'No execution ID provided';
      this.loading = false;
      return;
    }

    this.loadExecution(executionId);
  }

  ngAfterViewInit(): void {
    // Map initialized after data loads
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.map) {
      this.map.remove();
    }
  }

  loadExecution(id: string): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.tourService.checkProgress(id).subscribe({
      next: (execution) => {
        this.execution = execution;
        
        if (execution.completedAt) {
          this.isCompleted = true;
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
        
        if (execution.abandonedAt) {
          this.isAbandoned = true;
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        this.tourService.getTourById(execution.tourId).subscribe({
          next: (tour) => {
            this.tour = tour;
            this.loading = false;
            this.cdr.detectChanges();
            
            setTimeout(() => {
              this.initMap();
              this.startAutoCheck();
            }, 100);
          },
          error: (err) => {
            this.error = 'Failed to load tour details';
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.error = 'Failed to load tour execution';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  initMap(): void {
    if (!this.tour || this.tour.waypoints.length === 0) return;

    const firstWaypoint = this.tour.waypoints[0];
    this.map = L.map('execution-map').setView([firstWaypoint.latitude, firstWaypoint.longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.showPositionOverlay) {
        this.setPosition(e.latlng.lat, e.latlng.lng);
      }
    });

    this.tour.waypoints.forEach((waypoint, index) => {
      const isCompleted = this.isWaypointCompleted(waypoint.id);
      
      const icon = L.divIcon({
        html: `<div class="waypoint-marker ${isCompleted ? 'completed' : ''}">
                 <span>${index + 1}</span>
               </div>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      const marker = L.marker([waypoint.latitude, waypoint.longitude], { icon })
        .addTo(this.map!);
      
      marker.bindPopup(`
        <strong>${waypoint.name}</strong><br>
        ${waypoint.description}<br>
        ${isCompleted ? '<span class="text-success">✓ Completed</span>' : '<span class="text-muted">Not reached</span>'}
      `);
      
      marker.on('click', () => {
        this.selectedWaypoint = waypoint;
        this.cdr.detectChanges();
      });
      
      this.waypointMarkers.set(waypoint.id!, marker);
    });

    const coords = this.tour.waypoints.map(w => [w.latitude, w.longitude] as [number, number]);
    this.routeLine = L.polyline(coords, { color: '#0d6efd', weight: 3 }).addTo(this.map);

    this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });

    this.updatePosition();
  }

  togglePositionOverlay(): void {
    this.showPositionOverlay = !this.showPositionOverlay;
    this.cdr.detectChanges();
  }

  setPosition(lat: number, lng: number): void {
    this.positionUpdating = true;
    this.cdr.detectChanges();

    this.tourService.setPosition(lat, lng).subscribe({
      next: () => {
        this.currentPosition = { 
          id: '', 
          touristId: '', 
          latitude: lat, 
          longitude: lng, 
          updatedAt: new Date() 
        };
        this.updatePositionMarker(lat, lng);
        this.positionUpdating = false;
        this.showPositionOverlay = false;
        this.checkProgressNow();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to set position:', err);
        this.positionUpdating = false;
        this.cdr.detectChanges();
      }
    });
  }

  startAutoCheck(): void {
    this.checkProgressNow();

    this.checkInterval = setInterval(() => {
      this.checkProgressNow();
    }, 10000);
  }

  checkProgressNow(): void {
    if (!this.execution || this.isCompleted || this.isAbandoned) return;

    // Step 1: Get position from simulator
    this.tourService.getPosition().subscribe({
      next: (position) => {
        this.currentPosition = position;
        this.updatePositionMarker(position.latitude, position.longitude);

        // Step 2: Send check request to backend
        this.tourService.checkProgress(this.execution!.id).subscribe({
          next: (updatedExecution) => {
            const prevCompletedCount = this.execution!.completedWaypoints.length;
            this.execution = updatedExecution;

            if (updatedExecution.completedWaypoints.length > prevCompletedCount) {
              this.updateWaypointMarkers();
            }

            if (updatedExecution.completedAt) {
              this.isCompleted = true;
              clearInterval(this.checkInterval);
            }

            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Failed to get position:', err);
      }
    });
  }

  updatePosition(): void {
    this.tourService.getPosition().subscribe({
      next: (position) => {
        this.currentPosition = position;
        this.updatePositionMarker(position.latitude, position.longitude);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to get position:', err);
      }
    });
  }

  updatePositionMarker(lat: number, lng: number): void {
    if (!this.map) return;

    if (this.positionMarker) {
      this.positionMarker.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({
        html: '<div class="position-marker"><i class="bi bi-geo-alt-fill"></i></div>',
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      this.positionMarker = L.marker([lat, lng], { icon }).addTo(this.map);
      this.positionMarker.bindPopup('<strong>Your Position</strong>');
    }
  }

  updateWaypointMarkers(): void {
    if (!this.tour || !this.execution) return;

    this.tour.waypoints.forEach((waypoint, index) => {
      const isCompleted = this.isWaypointCompleted(waypoint.id);
      const marker = this.waypointMarkers.get(waypoint.id!);
      
      if (marker) {
        const icon = L.divIcon({
          html: `<div class="waypoint-marker ${isCompleted ? 'completed' : ''}">
                   <span>${index + 1}</span>
                 </div>`,
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });
        
        marker.setIcon(icon);
        marker.setPopupContent(`
          <strong>${waypoint.name}</strong><br>
          ${waypoint.description}<br>
          ${isCompleted ? '<span class="text-success">✓ Completed</span>' : '<span class="text-muted">Not reached</span>'}
        `);
      }
    });
  }

  abandonTour(): void {
    if (!this.execution) return;

    if (!confirm('Are you sure you want to abandon this tour?')) return;

    this.tourService.abandonTour(this.execution.id).subscribe({
      next: () => {
        this.isAbandoned = true;
        clearInterval(this.checkInterval);
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Failed to abandon tour');
      }
    });
  }

  restartTour(): void {
    if (!this.execution) return;
    
    this.tourService.startTour(this.execution.tourId).subscribe({
      next: (execution) => {
        window.location.href = `/#/tour-execution/${execution.id}`;
        window.location.reload();
      },
      error: (err) => {
        alert('Failed to restart tour');
      }
    });
  }

  getProgressPercentage(): number {
    if (!this.tour || !this.execution) return 0;
    return Math.round((this.execution.completedWaypoints.length / this.tour.waypoints.length) * 100);
  }

  formatDateTime(date: Date | string): string {
    const d = new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
        return 'Invalid date';
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

  getLastCompletedWaypoint(): { name: string, time: Date } | null {
    if (!this.execution || !this.tour || this.execution.completedWaypoints.length === 0) {
      return null;
    }

    const lastCompleted = this.execution.completedWaypoints[this.execution.completedWaypoints.length - 1];
    const waypoint = this.tour.waypoints.find(w => w.id === lastCompleted.waypointId);
    
    if (waypoint && lastCompleted.completedAt) {
      return {
        name: waypoint.name,
        time: lastCompleted.completedAt
      };
    }
    
    return null;
  }

  isWaypointCompleted(waypointId?: string): boolean {
    if (!waypointId || !this.execution) return false;
    return this.execution.completedWaypoints.some(c => c.waypointId === waypointId);
  }

  closeWaypointPreview(): void {
    this.selectedWaypoint = null;
    this.cdr.detectChanges();
  }
}