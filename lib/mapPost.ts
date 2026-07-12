import type { Post } from "../data/type"; // adjust to wherever your Post/User/Comment types live

export type PostRow = {
  id: string;
  user_id: string;
  image: string;
  width: number;
  height: number;
  aspect_ratio: number;
  type: "image";
  description: string | null;
  title: string;
  category: string;
  tags: string[];
  likes: number;
  comments_count: number;
  views: number | null;
  is_trending: boolean | null;
  is_featured: boolean | null;
  location: string | null;
  created_at: string;
  updated_at: string | null;
  // Present only when the query joins profiles, e.g. .select("*, profiles(username, profile_picture)")
  profiles?: {
    username: string;
    profile_picture: string;
  } | null;
};

export function mapRowToPost(row: PostRow): Post {
  return {
    id: row.id,
    userId: row.user_id,
    image: row.image,
    width: row.width,
    height: row.height,
    aspectRatio: row.aspect_ratio,
    type: "image",
    description: row.description ?? "",
    title: row.title,
    category: row.category,
    tags: row.tags ?? [],
    likes: row.likes,
    commentsCount: row.comments_count,
    views: row.views ?? undefined,
    isTrending: row.is_trending ?? undefined,
    isFeatured: row.is_featured ?? undefined,
    location: row.location ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    // isLiked / isSaved are per-viewer and computed separately (likes/saved_posts
    // join tables), not stored on the post row itself
  };
}

// Extends Post with author display info pulled in via a join with profiles —
// avoids a separate per-card lookup/fetch in list UIs like PostCard
export type PostWithAuthor = Post & {
  authorUsername?: string;
  authorAvatar?: string;
};

export function mapRowToPostWithAuthor(row: PostRow): PostWithAuthor {
  return {
    ...mapRowToPost(row),
    authorUsername: row.profiles?.username,
    authorAvatar: row.profiles?.profile_picture,
  };
}

// import type { Post } from "../data/type"; // adjust to wherever your Post/User/Comment types live

// export type PostRow = {
//   id: string;
//   user_id: string;
//   image: string;
//   width: number;
//   height: number;
//   aspect_ratio: number;
//   type: "image";
//   description: string | null;
//   title: string;
//   category: string;
//   tags: string[];
//   likes: number;
//   comments_count: number;
//   views: number | null;
//   is_trending: boolean | null;
//   is_featured: boolean | null;
//   location: string | null;
//   created_at: string;
//   updated_at: string | null;
// };

// export function mapRowToPost(row: PostRow): Post {
//   return {
//     id: row.id,
//     userId: row.user_id,
//     image: row.image,
//     width: row.width,
//     height: row.height,
//     aspectRatio: row.aspect_ratio,
//     type: "image",
//     description: row.description ?? "",
//     title: row.title,
//     category: row.category,
//     tags: row.tags ?? [],
//     likes: row.likes,
//     commentsCount: row.comments_count,
//     views: row.views ?? undefined,
//     isTrending: row.is_trending ?? undefined,
//     isFeatured: row.is_featured ?? undefined,
//     location: row.location ?? undefined,
//     createdAt: row.created_at,
//     updatedAt: row.updated_at ?? undefined,
//     // isLiked / isSaved are per-viewer and computed separately (likes/saved_posts
//     // join tables), not stored on the post row itself
//   };
// }