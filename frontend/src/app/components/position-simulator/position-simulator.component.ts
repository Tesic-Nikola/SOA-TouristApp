import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { TourService } from '../../services/tour.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import * as L from 'leaflet';

@Component({
  selector: 'app-position-simulator',
  templateUrl: './position-simulator.component.html',
  styleUrl: './position-simulator.component.css',
  standalone: false
})
export class PositionSimulatorComponent implements OnInit, AfterViewInit {
  map: L.Map | null = null;
  currentMarker: L.Marker | null = null;
  currentPosition: { latitude: number, longitude: number } | null = null;
  loading = false;
  message = '';

  constructor(
    private tourService: TourService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const user = this.authService.getCurrentUser();
    if (user?.role !== 0) { // Only tourists
      this.router.navigate(['/']);
      return;
    }

    this.loadCurrentPosition();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  initMap(): void {
    // Initialize map centered on Belgrade
    this.map = L.map('map').setView([44.8176, 20.4633], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add click handler
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setPosition(e.latlng.lat, e.latlng.lng);
    });
  }

  loadCurrentPosition(): void {
    this.tourService.getPosition().subscribe({
      next: (position) => {
        this.currentPosition = {
          latitude: position.latitude,
          longitude: position.longitude
        };
        
        if (this.map) {
          // Center map on current position
          this.map.setView([position.latitude, position.longitude], 15);
          this.addMarker(position.latitude, position.longitude);
        }
        
        this.cdr.detectChanges();
      },
      error: () => {
        // No position set yet, that's fine
        this.message = 'Click anywhere on the map to set your position';
        this.cdr.detectChanges();
      }
    });
  }

  setPosition(lat: number, lng: number): void {
    this.loading = true;
    this.message = '';
    this.cdr.detectChanges();

    this.tourService.setPosition(lat, lng).subscribe({
      next: () => {
        this.currentPosition = { latitude: lat, longitude: lng };
        this.addMarker(lat, lng);
        this.message = `Position updated: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.message = 'Failed to update position';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  addMarker(lat: number, lng: number): void {
    if (!this.map) return;

    // Remove existing marker
    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    // Add new marker
    const icon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.currentMarker = L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bindPopup('Your current position')
      .openPopup();
  }
}