import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-blog-create',
  templateUrl: './blog-create.component.html',
  styleUrl: './blog-create.component.css',
  standalone: false
})
export class BlogCreateComponent implements OnInit {
  blogForm: FormGroup;
  loading = false;
  error = '';
  imageUrls: string[] = [];

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private authService: AuthService,
    private router: Router
  ) {
    this.blogForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  addImage(): void {
    const imageUrl = this.blogForm.get('imageUrl')?.value;
    if (imageUrl && imageUrl.trim()) {
      this.imageUrls.push(imageUrl.trim());
      this.blogForm.patchValue({ imageUrl: '' });
    }
  }

  removeImage(index: number): void {
    this.imageUrls.splice(index, 1);
  }

  onSubmit(): void {
    if (this.blogForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    const request = {
      title: this.blogForm.value.title,
      description: this.blogForm.value.description,
      images: this.imageUrls.length > 0 ? this.imageUrls : undefined
    };

    this.blogService.createBlog(request).subscribe({
      next: (blog) => {
        setTimeout(() => {
          this.router.navigate(['/blogs']);
        }, 500);
      },
      error: (err) => {
        this.error = 'Failed to create blog. Please try again.';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/blogs']);
  }
}