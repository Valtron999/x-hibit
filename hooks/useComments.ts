import { useCallback, useEffect, useState } from "react";
import { CommentRow, CommentWithAuthor, mapRowToComment } from "../lib/mapComment";
import { supabase } from "../lib/supabase";

type Options = {
  // Only fetch once true — lets callers defer this (e.g. until the comment
  // modal is actually opened) instead of loading comments on every page view.
  enabled?: boolean;
};

export function useComments(postId?: string, options: Options = {}) {
  const { enabled = true } = options;
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("comments")
      .select("*, profiles(name, username, profile_picture)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setComments([]);
    } else {
      setComments((data as CommentRow[]).map(mapRowToComment));
    }

    setLoading(false);
  }, [postId]);

  useEffect(() => {
    if (enabled && postId) {
      fetchComments();
    }
  }, [enabled, postId, fetchComments]);

  const addComment = async (userId: string, content: string) => {
    if (!postId) return null;

    const { data, error: insertError } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: userId, content })
      .select("*, profiles(name, username, profile_picture)")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to post comment");
      return null;
    }

    const mapped = mapRowToComment(data as CommentRow);
    setComments((prev) => [...prev, mapped]);
    return mapped;
  };

  return { comments, loading, error, refetch: fetchComments, addComment };
}// import { useCallback, useEffect, useState } from "react";
// import { CommentRow, CommentWithAuthor, mapRowToComment } from "../lib/mapComment";
// import { supabase } from "../lib/supabase";

// export function useComments(postId?: string) {
//   const [comments, setComments] = useState<CommentWithAuthor[]>([]);
//   const [loading, setLoading] = useState(!!postId);
//   const [error, setError] = useState<string | null>(null);

//   const fetchComments = useCallback(async () => {
//     if (!postId) {
//       setComments([]);
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     const { data, error: fetchError } = await supabase
//       .from("comments")
//       .select("*, profiles(name, username, profile_picture)")
//       .eq("post_id", postId)
//       .order("created_at", { ascending: true });

//     if (fetchError) {
//       setError(fetchError.message);
//       setComments([]);
//     } else {
//       setComments((data as CommentRow[]).map(mapRowToComment));
//     }

//     setLoading(false);
//   }, [postId]);

//   useEffect(() => {
//     fetchComments();
//   }, [fetchComments]);

//   const addComment = async (userId: string, content: string) => {
//     if (!postId) return null;

//     const { data, error: insertError } = await supabase
//       .from("comments")
//       .insert({ post_id: postId, user_id: userId, content })
//       .select("*, profiles(name, username, profile_picture)")
//       .single();

//     if (insertError || !data) {
//       setError(insertError?.message ?? "Failed to post comment");
//       return null;
//     }

//     const mapped = mapRowToComment(data as CommentRow);
//     setComments((prev) => [...prev, mapped]);
//     return mapped;
//   };

//   return { comments, loading, error, refetch: fetchComments, addComment };
// }