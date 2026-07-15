import { useCallback, useEffect, useState } from "react";
import { mapRowToPostWithAuthor, PostRow, PostWithAuthor } from "../lib/mapPost";
import { supabase } from "../lib/supabase";

type Options = {
  excludeId?: string;
  excludeUserId?: string;
  limit?: number;
  // Only fetch once true — lets callers defer this fetch (e.g. recommendations,
  // explore grid) until higher-priority content has already loaded.
  enabled?: boolean;
};

export function useAllPosts(options: Options = {}) {
  const { excludeId, excludeUserId, limit, enabled = true } = options;
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("posts")
      .select("*, profiles!posts_user_id_fkey(username, profile_picture)")
      .order("created_at", { ascending: false });

    if (excludeId) query = query.neq("id", excludeId);
    if (excludeUserId) query = query.neq("user_id", excludeUserId);
    if (limit) query = query.limit(limit);

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error("useAllPosts fetch error:", fetchError);
      setError(fetchError.message);
      setPosts([]);
    } else {
      setPosts((data as PostRow[]).map(mapRowToPostWithAuthor));
    }

    setLoading(false);
  }, [excludeId, excludeUserId, limit]);

  useEffect(() => {
    if (enabled) {
      fetchPosts();
    }
  }, [enabled, fetchPosts]);

  return { posts, loading, error, refetch: fetchPosts };
}// import { useCallback, useEffect, useState } from "react";
// import { mapRowToPostWithAuthor, PostRow, PostWithAuthor } from "../lib/mapPost";
// import { supabase } from "../lib/supabase";

// type Options = {
//   excludeId?: string;
//   excludeUserId?: string;
//   limit?: number;
// };

// export function useAllPosts(options: Options = {}) {
//   const { excludeId, excludeUserId, limit } = options;
//   const [posts, setPosts] = useState<PostWithAuthor[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchPosts = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     let query = supabase
//       .from("posts")
//       .select("*, profiles!posts_user_id_fkey(username, profile_picture)")
//       .order("created_at", { ascending: false });

//     if (excludeId) query = query.neq("id", excludeId);
//     if (excludeUserId) query = query.neq("user_id", excludeUserId);
//     if (limit) query = query.limit(limit);

//     const { data, error: fetchError } = await query;

//     if (fetchError) {
//       console.error("useAllPosts fetch error:", fetchError);
//       setError(fetchError.message);
//       setPosts([]);
//     } else {
//       console.log("useAllPosts: rows =", data?.length);
//       setPosts((data as PostRow[]).map(mapRowToPostWithAuthor));
//     }

//     setLoading(false);
//   }, [excludeId, excludeUserId, limit]);

//   useEffect(() => {
//     fetchPosts();
//   }, [fetchPosts]);

//   return { posts, loading, error, refetch: fetchPosts };
// }