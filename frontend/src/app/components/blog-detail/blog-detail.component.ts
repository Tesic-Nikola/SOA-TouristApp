import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { FollowerService } from '../../services/follower.service';
import { AuthService } from '../../services/auth.service';
import { Blog } from '../../models/blog.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.css',
  standalone: false
})
export class BlogDetailComponent implements OnInit {
  blog: Blog | null = null;
  author: User | null = null;
  loading = true;
  error = '';
  isFollowing = false;
  isOwnBlog = false;
  followLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    private followerService: FollowerService,
    private authService: AuthService,
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
        
        // Load author info
        this.authService.getUser(blog.authorId).subscribe({
          next: (user) => {
            this.author = user;
            this.cdr.detectChanges();
          }
        });
        
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          this.isOwnBlog = blog.authorId === currentUser.id;
          
          // If not own blog, check if following the author
          if (!this.isOwnBlog) {
            this.checkFollowStatus(blog.authorId);
          }
        }
        
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

  checkFollowStatus(authorId: string): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.isFollowing = false;
      this.cdr.detectChanges();
      return;
    }
    
    this.followerService.getFollowing(currentUser.id).subscribe({
      next: (data) => {
        this.isFollowing = data.following.includes(authorId);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isFollowing = false;
        this.cdr.detectChanges();
      }
    });
  }

  followAuthor(): void {
    if (!this.blog || this.followLoading) return;

    this.followLoading = true;
    this.cdr.detectChanges();

    this.followerService.followUser(this.blog.authorId).subscribe({
      next: () => {
        this.isFollowing = true;
        this.followLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.followLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewAuthorProfile(): void {
    if (this.blog) {
      this.router.navigate(['/profile', this.blog.authorId]);
    }
  }

  goBack(): void {
    this.router.navigate(['/blogs']);
  }

  formatDateTime(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  canViewFullBlog(): boolean {
    return this.isOwnBlog || this.isFollowing;
  }
}