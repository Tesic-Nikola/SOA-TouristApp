import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Blog, CreateBlogRequest } from '../models/blog.model';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = `${environment.apiUrl}/blogs`;

  constructor(private http: HttpClient) {}

  getAllBlogs(): Observable<Blog[]> {
    return this.http.get<Blog[]>(this.apiUrl);
  }

  getBlogById(id: string): Observable<Blog> {
    return this.http.get<Blog>(`${this.apiUrl}/${id}`);
  }

  getBlogsByAuthor(authorId: string): Observable<Blog[]> {
    return this.http.get<Blog[]>(`${this.apiUrl}/author/${authorId}`);
  }

  createBlog(request: CreateBlogRequest): Observable<Blog> {
    return this.http.post<Blog>(this.apiUrl, request);
  }
}