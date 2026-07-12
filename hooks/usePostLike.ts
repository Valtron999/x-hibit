import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function usePostLike(postId?: string, userId?: string, initialLikes: number = 0) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [checking, setChecking] = useState(!!postId && !!userId);

  // Keep in sync if the underlying post's like count changes (e.g. on refetch)
  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  // Check whether the current user has already liked this post
  useEffect(() => {
    let cancelled = false;

    if (!postId || !userId) {
      setIsLiked(false);
      setChecking(false);
      return;
    }

    setChecking(true);
    supabase
      .from("post_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setIsLiked(!!data);
        setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postId, userId]);

  const toggleLike = useCallback(async () => {
    if (!postId || !userId) return;

    if (isLiked) {
      // Optimistic update, reverted on failure
      setIsLiked(false);
      setLikes((n) => Math.max(n - 1, 0));

      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      if (error) {
        setIsLiked(true);
        setLikes((n) => n + 1);
      }
    } else {
      setIsLiked(true);
      setLikes((n) => n + 1);

      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: userId });

      if (error) {
        setIsLiked(false);
        setLikes((n) => Math.max(n - 1, 0));
      }
    }
  }, [postId, userId, isLiked]);

  return { isLiked, likes, toggleLike, checking };
}