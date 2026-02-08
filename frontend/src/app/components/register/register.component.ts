import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  standalone: false
})
export class RegisterComponent {
  registerForm: FormGroup;
  error: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [0, [Validators.required]] // 0 = Tourist (default)
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Registration error:', err);
        
        if (err.status === 409) {
          // Conflict - username or email already exists
          if (err.error?.error && err.error.error.includes('Username')) {
            this.error = 'This username is already taken. Please choose another.';
          } else if (err.error?.error && err.error.error.includes('Email')) {
            this.error = 'This email is already registered. Please use another or login.';
          } else {
            this.error = 'Username or email already exists.';
          }
        } else if (err.status === 400) {
          this.error = err.error?.error || 'Please check your information and try again.';
        } else if (err.status === 0) {
          this.error = 'Unable to connect to server. Please check your connection.';
        } else if (err.status === 500) {
          this.error = 'Server error. Please try again later.';
        } else if (err.error?.error) {
          this.error = err.error.error;
        } else {
          this.error = 'Registration failed. Please try again.';
        }
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}