import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.css',
  standalone: false
})
export class ProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  user: User | null = null;
  loading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      bio: [''],
      motto: [''],
      profileImagePath: ['']
    });
  }

  ngOnInit(): void {
  const userId = this.route.snapshot.paramMap.get('id');
  const currentUser = this.authService.getCurrentUser();
  
  if (!currentUser || userId !== currentUser.id) {
    this.router.navigate(['/']);
    return;
  }

  this.authService.getUser(userId!).subscribe({
    next: (user) => {
      this.user = user;
      this.profileForm.patchValue({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        motto: user.motto || '',
        profileImagePath: user.profileImagePath || ''
      });
    },
    error: (err) => {
      this.router.navigate(['/']);
    }
  });
}

  onSubmit(): void {
    if (!this.user) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.updateProfile(this.user.id, this.profileForm.value).subscribe({
      next: (updatedUser) => {
        this.success = 'Profile updated successfully!';
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/profile', this.user!.id]);
        }, 1500);
      },
      error: (err) => {
        this.error = 'Failed to update profile';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    if (this.user) {
      this.router.navigate(['/profile', this.user.id]);
    }
  }
}