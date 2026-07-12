import type { Comment } from "../data/type"; // adjust to wherever your Post/User/Comment types live

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes: number;
  created_at: string;
  // Joined from profiles via the comments.user_id foreign key
  profiles?: {
    name: string;
    username: string;
    profile_picture: string;
  } | null;
};

// Extends the base Comment type with author display info pulled in via the join —
// avoids a separate profile lookup per comment on the client
export type CommentWithAuthor = Comment & {
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
};

export function mapRowToComment(row: CommentRow): CommentWithAuthor {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    content: row.content,
    likes: row.likes,
    createdAt: row.created_at,
    authorName: row.profiles?.name,
    authorUsername: row.profiles?.username,
    authorAvatar: row.profiles?.profile_picture,
  };
}