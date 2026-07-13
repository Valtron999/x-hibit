import { useCallback, useEffect, useState } from "react";
import { mapRowToPostWithAuthor, PostRow, PostWithAuthor } from "../lib/mapPost";
import { supabase } from "../lib/supabase";

export function usePost(postId?: string) {
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [loading, setLoading] = useState(!!postId);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) {
      setPost(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log("usePost: fetching postId =", postId);
    const { data, error: fetchError } = await supabase
      .from("posts")
      .select("*, profiles!posts_user_id_fkey(username, profile_picture)")
      .eq("id", postId)
      .single();
    console.log("usePost result — postId:", postId, "data:", data, "error:", fetchError)

    if (fetchError || !data) {
      console.error("usePost fetch error:", fetchError);
      setError(fetchError?.message ?? "Post not found");
      setPost(null);
    } else {
      setPost(mapRowToPostWithAuthor(data as PostRow));
    }

    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, loading, error, refetch: fetchPost };
}