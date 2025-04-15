export interface Article {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorId: string;
  status: 'draft' | 'published';
  createdAt: string | any;
  updatedAt: string | any;
  publishedAt?: string | any; // New field: when the article was published
  shortDescription?: string;   // New field: summary text
  imageUrl?: string | null;    // URL of the main image (if any)
  categories?: string[];
  tags?: string[];
}
