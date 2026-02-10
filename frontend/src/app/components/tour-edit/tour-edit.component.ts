import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TourService } from '../../services/tour.service';
import { AuthService } from '../../services/auth.service';
import { Tour, Waypoint } from '../../models/tour.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-tour-edit',
  templateUrl: './tour-edit.component.html',
  styleUrl: './tour-edit.component.css',
  standalone: false
})
export class TourEditComponent implements OnInit, AfterViewInit, OnDestroy {
  tourForm: FormGroup;
  tour: Tour | null = null;
  isEditMode = false;
  loading = false;
  error = '';
  success = '';
  
  map: L.Map | null = null;
  markers: L.Marker[] = [];
  routeLine: L.Polyline | null = null;
  tempMarker: L.Marker | null = null;
  
  waypoints: Waypoint[] = [];
  selectedWaypointIndex: number | null = null;
  isAddingWaypoint = false;
  
  waypointForm: FormGroup;
  showWaypointForm = false;
  editingWaypointIndex: number | null = null;

  readonly MAX_WAYPOINTS = 2;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private tourService: TourService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.tourForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      difficulty: ['Easy', [Validators.required]],
      tags: [''],
      price: [0, [Validators.required, Validators.min(0)]]
    });

    this.waypointForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      imagePath: [''],
      latitude: [{ value: '', disabled: true }],
      longitude: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 1) {
      this.router.navigate(['/']);
      return;
    }

    const tourId = this.route.snapshot.paramMap.get('id');
    if (tourId) {
      this.isEditMode = true;
      this.loadTour(tourId);
    }

    window.addEventListener('editWaypoint', this.handleEditWaypoint.bind(this));
    window.addEventListener('deleteWaypoint', this.handleDeleteWaypoint.bind(this));
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    window.removeEventListener('editWaypoint', this.handleEditWaypoint.bind(this));
    window.removeEventListener('deleteWaypoint', this.handleDeleteWaypoint.bind(this));
    if (this.map) {
      this.map.remove();
    }
  }

  handleEditWaypoint(event: any): void {
    const index = event.detail;
    this.editWaypoint(index);
  }

  handleDeleteWaypoint(event: any): void {
    const index = event.detail;
    this.deleteWaypointAtIndex(index);
  }

  loadTour(id: string): void {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.tourService.getTourById(id).subscribe({
      next: (tour) => {
        const currentUser = this.authService.getCurrentUser();
        if (tour.authorId !== currentUser?.id) {
          this.router.navigate(['/my-tours']);
          return;
        }

        this.tour = tour;
        this.waypoints = [...tour.waypoints];

        const difficultyMap: { [key: number]: string } = {
          0: 'Easy',
          1: 'Medium',
          2: 'Hard'
        };

        this.tourForm.patchValue({
          name: tour.name,
          description: tour.description,
          difficulty: difficultyMap[tour.difficulty] || 'Easy',
          tags: tour.tags.join(', '),
          price: tour.price
        });

        this.loading = false;
        this.cdr.detectChanges();
        
        if (this.map && this.waypoints.length > 0) {
          this.redrawMap();
        }
      },
      error: (err) => {
        this.error = 'Failed to load tour';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  initMap(): void {
    this.map = L.map('edit-map').setView([44.8176, 20.4633], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.isAddingWaypoint) {
        this.setWaypointLocation(e.latlng.lat, e.latlng.lng);
      }
    });

    if (this.waypoints.length > 0) {
      this.redrawMap();
    }
  }

  redrawMap(): void {
    if (!this.map) return;

    this.markers.forEach(m => m.remove());
    this.markers = [];
    
    if (this.routeLine) {
      this.routeLine.remove();
      this.routeLine = null;
    }

    if (this.waypoints.length === 0) return;

    this.waypoints.forEach((waypoint, index) => {
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
          <div style="min-width: 150px;">
            <strong>${waypoint.name}</strong><br>
            ${waypoint.description}<br>
            <button onclick="window.dispatchEvent(new CustomEvent('editWaypoint', {detail: ${index}}))" 
                    style="margin-top: 8px;" class="btn btn-sm btn-primary">Edit</button>
          </div>
        `);

      this.markers.push(marker);
    });

    if (this.waypoints.length > 1) {
      const latlngs = this.waypoints.map(w => [w.latitude, w.longitude] as [number, number]);
      this.map.fitBounds(latlngs);
    } else {
      this.map.setView([this.waypoints[0].latitude, this.waypoints[0].longitude], 14);
    }
  }

  startAddingWaypoint(): void {
    if (this.waypoints.length >= this.MAX_WAYPOINTS) {
      alert(`Maximum ${this.MAX_WAYPOINTS} waypoints allowed!`);
      return;
    }

    this.isAddingWaypoint = true;
    this.showWaypointForm = true;
    this.editingWaypointIndex = null;
    this.waypointForm.reset();
    this.removeTempMarker();
    this.cdr.detectChanges();
  }

  setWaypointLocation(lat: number, lng: number): void {
    this.waypointForm.patchValue({
      latitude: lat,
      longitude: lng
    });
    
    this.removeTempMarker();
    
    const tempIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    this.tempMarker = L.marker([lat, lng], { icon: tempIcon })
      .addTo(this.map!)
      .bindPopup('New waypoint location');
    
    this.cdr.detectChanges();
  }

  removeTempMarker(): void {
    if (this.tempMarker) {
      this.tempMarker.remove();
      this.tempMarker = null;
    }
  }

  saveWaypoint(): void {
    if (this.waypointForm.invalid) {
      return;
    }

    const lat = this.waypointForm.getRawValue().latitude;
    const lng = this.waypointForm.getRawValue().longitude;

    if (!lat || !lng) {
      alert('Please click on the map to select a location');
      return;
    }

    const waypoint: Waypoint = {
      name: this.waypointForm.value.name,
      description: this.waypointForm.value.description,
      imagePath: this.waypointForm.value.imagePath || undefined,
      latitude: lat,
      longitude: lng
    };

    if (this.editingWaypointIndex !== null) {
      if (this.isEditMode && this.tour) {
        const oldWaypoint = this.waypoints[this.editingWaypointIndex];
        if (oldWaypoint.id) {
          this.tourService.updateWaypoint(this.tour.id, oldWaypoint.id, waypoint).subscribe({
            next: (updated) => {
              this.waypoints[this.editingWaypointIndex!] = { ...waypoint, id: oldWaypoint.id };
              this.finishWaypointEdit();
            },
            error: (err) => {
              alert('Failed to update waypoint');
            }
          });
        }
      } else {
        this.waypoints[this.editingWaypointIndex] = waypoint;
        this.finishWaypointEdit();
      }
    } else {
      if (this.isEditMode && this.tour) {
        this.tourService.addWaypoint(this.tour.id, waypoint).subscribe({
          next: (added) => {
            this.waypoints.push({ ...waypoint, id: added.id });
            this.finishWaypointEdit();
          },
          error: (err) => {
            alert('Failed to add waypoint');
          }
        });
      } else {
        this.waypoints.push(waypoint);
        this.finishWaypointEdit();
      }
    }
  }

  finishWaypointEdit(): void {
    this.showWaypointForm = false;
    this.isAddingWaypoint = false;
    this.editingWaypointIndex = null;
    this.waypointForm.reset();
    this.removeTempMarker();
    this.redrawMap();
    this.calculateDistance();
    this.cdr.detectChanges();
  }

  deleteWaypointAtIndex(index: number): void {
    if (!confirm('Delete this waypoint?')) return;

    if (this.isEditMode && this.tour) {
      const waypoint = this.waypoints[index];
      if (waypoint.id) {
        this.tourService.deleteWaypoint(this.tour.id, waypoint.id).subscribe({
          next: () => {
            this.waypoints.splice(index, 1);
            this.redrawMap();
            this.cdr.detectChanges();
          },
          error: (err) => {
            alert('Failed to delete waypoint');
          }
        });
      }
    } else {
      this.waypoints.splice(index, 1);
      this.redrawMap();
      this.cdr.detectChanges();
    }
  }

  calculateDistance(): void {
    if (this.waypoints.length >= 2) {
      let total = 0;
      for (let i = 0; i < this.waypoints.length - 1; i++) {
        const dist = this.haversineDistance(
          this.waypoints[i].latitude, this.waypoints[i].longitude,
          this.waypoints[i + 1].latitude, this.waypoints[i + 1].longitude
        );
        total += dist;
      }
      if (this.tour) {
        this.tour.lengthKm = Math.round(total * 10) / 10; // Round to 1 decimal
      }
      this.cdr.detectChanges();
    }
  }

  haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  cancelWaypointEdit(): void {
    this.showWaypointForm = false;
    this.isAddingWaypoint = false;
    this.editingWaypointIndex = null;
    this.waypointForm.reset();
    this.removeTempMarker();
    this.cdr.detectChanges();
  }

  editWaypoint(index: number): void {
    const waypoint = this.waypoints[index];
    this.editingWaypointIndex = index;
    this.isAddingWaypoint = true;
    this.showWaypointForm = true;
    
    this.waypointForm.patchValue({
      name: waypoint.name,
      description: waypoint.description,
      imagePath: waypoint.imagePath || '',
      latitude: waypoint.latitude,
      longitude: waypoint.longitude
    });
    
    this.setWaypointLocation(waypoint.latitude, waypoint.longitude);
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.tourForm.invalid) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    this.cdr.detectChanges();

    const tags = this.tourForm.value.tags 
      ? this.tourForm.value.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
      : [];

    if (this.isEditMode && this.tour) {
      const updateRequest = {
        name: this.tourForm.value.name,
        description: this.tourForm.value.description,
        difficulty: this.tourForm.value.difficulty,
        tags: tags,
        price: this.tourForm.value.price
      };

      this.tourService.updateTour(this.tour.id, updateRequest).subscribe({
        next: (updated) => {
          this.success = 'Tour updated successfully!';
          this.loading = false;
          this.cdr.detectChanges();
          setTimeout(() => {
            this.router.navigate(['/my-tours']);
          }, 1500);
        },
        error: (err) => {
          console.error('Update error:', err);
          this.error = err.error?.error || 'Failed to update tour';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      const createRequest = {
        name: this.tourForm.value.name,
        description: this.tourForm.value.description,
        difficulty: this.tourForm.value.difficulty,
        tags: tags
      };

      // Validate minimum waypoints for new tours
      if (this.waypoints.length < 2) {
        this.error = 'Please add at least 2 waypoints before creating the tour';
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      this.tourService.createTour(createRequest).subscribe({
        next: (created) => {
          this.success = 'Tour created! Redirecting to edit...';
          this.loading = false;
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.router.navigate(['/tours', created.id, 'edit']);
          }, 1000);
        },
        error: (err) => {
          console.error('Create error:', err);
          this.error = err.error?.error || err.error?.title || 'Failed to create tour';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/my-tours']);
  }

  canAddMoreWaypoints(): boolean {
    return this.waypoints.length < this.MAX_WAYPOINTS;
  }
}