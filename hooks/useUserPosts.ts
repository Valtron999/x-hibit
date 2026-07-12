import { useCallback, useEffect, useState } from "react";
import { mapRowToPostWithAuthor, PostRow, PostWithAuthor } from "../lib/mapPost";
import { supabase } from "../lib/supabase";

export function useUserPosts(userId?: string) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("posts")
      .select("*, profiles(username, profile_picture)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setPosts([]);
    } else {
      setPosts((data as PostRow[]).map(mapRowToPostWithAuthor));
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, error, refetch: fetchPosts };
}