export interface Blog {
  id: string;
  authorId: string;
  title: string;
  description: string;
  createdAt: Date;
  images?: string[];
}

export interface CreateBlogRequest {
  title: string;
  description: string;
  images?: string[];
}