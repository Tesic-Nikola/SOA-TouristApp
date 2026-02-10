import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TourService } from '../../services/tour.service';
import { Tour, ShoppingCart } from '../../models/tour.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
  standalone: false
})
export class CartComponent implements OnInit {
  cart: ShoppingCart | null = null;
  cartTours: Tour[] = [];
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
    // Check if coming from checkout success
    this.route.queryParams.subscribe(params => {
      if (params['success']) {
        this.showSuccess = true;
        setTimeout(() => {
          this.showSuccess = false;
          this.cdr.detectChanges();
        }, 5000);
      }
    });

    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.tourService.getCart().subscribe({
      next: (cart) => {
        this.cart = cart;
        
        if (cart.tourIds.length === 0) {
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        // Fetch tour details for each tour ID
        const tourRequests = cart.tourIds.map(id => this.tourService.getTourById(id));
        
        forkJoin(tourRequests).subscribe({
          next: (tours) => {
            this.cartTours = tours;
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
        console.error('Error loading cart:', err);
        this.error = 'Failed to load cart';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  removeFromCart(tourId: string): void {
    if (!confirm('Remove this tour from cart?')) return;

    this.tourService.removeFromCart(tourId).subscribe({
      next: () => {
        // Remove from local state
        this.cartTours = this.cartTours.filter(t => t.id !== tourId);
        if (this.cart) {
          this.cart.tourIds = this.cart.tourIds.filter(id => id !== tourId);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error removing from cart:', err);
        alert('Failed to remove tour from cart');
      }
    });
  }

  getTotalPrice(): number {
    return this.cartTours.reduce((sum, tour) => sum + tour.price, 0);
  }

  checkout(): void {
    if (!this.cart || this.cart.tourIds.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!confirm(`Proceed to checkout? Total: $${this.getTotalPrice()}`)) return;

    this.loading = true;
    this.cdr.detectChanges();
    this.tourService.checkout().subscribe({
      next: (response) => {
        this.router.navigate(['/purchases'], { queryParams: { success: 'true' } });
      },
      error: (err) => {
        console.error('Checkout error:', err);
        alert('Failed to complete checkout');
        this.loading = false;
        this.cdr.detectChanges();
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

  continueShopping(): void {
    this.router.navigate(['/tours']);
  }
}