export interface Post {
  id: string;
  userId: string;

  image: string;
  width: number;
  height: number;
  aspectRatio: number;
  type: "image";

  description: string;
  category: string;
  tags: string[];

  likes: number;
  commentsCount: number;
  views?: number;
  isLiked?: boolean;
  isSaved?: boolean;

  isTrending?: boolean;
  isFeatured?: boolean;
  location?: string;

  createdAt: string;
  updatedAt?: string;
}