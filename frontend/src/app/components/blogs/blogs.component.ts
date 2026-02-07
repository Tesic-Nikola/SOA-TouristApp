import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import { Blog } from '../../models/blog.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-blogs',
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.css',
  standalone: false
})
export class BlogsComponent implements OnInit {
  blogs: Blog[] = [];
  loading = true;
  error = '';
  currentUser: User | null = null;

  constructor(
    private blogService: BlogService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });

    this.loadBlogs();
  }

  loadBlogs(): void {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.blogService.getAllBlogs().subscribe({
      next: (blogs) => {
        this.blogs = blogs;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load blogs';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewBlog(blogId: string): void {
    this.router.navigate(['/blogs', blogId]);
  }

  createBlog(): void {
    this.router.navigate(['/blogs/create']);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}