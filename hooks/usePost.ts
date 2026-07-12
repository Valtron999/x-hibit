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

    const { data, error: fetchError } = await supabase
      .from("posts")
      .select("*, profiles(username, profile_picture)")
      .eq("id", postId)
      .single();

    if (fetchError || !data) {
      setError("Post not found");
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