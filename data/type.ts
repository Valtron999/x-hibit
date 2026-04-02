export interface Post {
  id: string;
  userId: string;

  image: string;
  width: number;
  height: number;
  aspectRatio: number;
  type: "image";

  description: string;
  title: string;
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

export type User = {
  id: string;
  uid?: string; // firebase later

  name: string;
  username: string;
  email: string;
  phoneNumber?: string;

  profilePicture: string;
  bio?: string;

  category: "artist" | "designer" | "photographer" | "model";
  gender?: "male" | "female" | "other";

  followersCount: number;
  followingCount: number;

  followers: string[]; // mock only
  following: string[];

  posts: string[]; // post IDs
  savedPosts: string[];

  isVerified?: boolean;
  isPrivate?: boolean;

  createdAt: string;
  updatedAt?: string;

  // For algorithm (future)
  interests?: string[]; // ["art", "fashion"]
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  likes: number;
};