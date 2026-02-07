import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { Blog } from '../../models/blog.model';

@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.css',
  standalone: false
})
export class BlogDetailComponent implements OnInit {
  blog: Blog | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const blogId = this.route.snapshot.paramMap.get('id');
    
    if (!blogId) {
      this.error = 'No blog ID provided';
      this.loading = false;
      return;
    }

    this.loadBlog(blogId);
  }

  loadBlog(id: string): void {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.blogService.getBlogById(id).subscribe({
      next: (blog) => {
        this.blog = blog;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Blog not found';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/blogs']);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}