import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "../data/type";
import { mapRowToUser, ProfileRow } from "../lib/mapProfile";
import { supabase } from "../lib/supabase";

export interface SuggestedUser extends User {
  mutualsCount: number;
}

type Options = {
  limit?: number;
  enabled?: boolean;
};

/**
 * Users the current viewer isn't already following, ranked by followers_count.
 *
 * mutualsCount is left at 0 — a real count needs the intersection of
 * "who the viewer follows" and "who follows this candidate", which isn't
 * cheap as a single postgrest filter. If you want real numbers, the clean
 * path is a Postgres RPC, e.g.:
 *
 *   create function mutual_follow_count(viewer uuid, candidate uuid)
 *   returns int language sql as $$
 *     select count(*) from follows a
 *     join follows b on a.following_id = b.follower_id
 *     where a.follower_id = viewer and b.following_id = candidate
 *   $$;
 *
 * then call it per-candidate (or batch it) and merge into the mapped list.
 */
export function useSuggestedUsers(viewerId: string | undefined, options: Options = {}) {
  const { limit = 10, enabled = true } = options;

  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const hasFetchedRef = useRef(false);

  const fetchSuggestions = useCallback(async () => {
    if (!viewerId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Who the viewer already follows
      const { data: alreadyFollowing, error: followErr } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", viewerId);

      if (followErr) throw followErr;

      const excludeIds = new Set(
        (alreadyFollowing ?? []).map((f) => f.following_id as string)
      );
      excludeIds.add(viewerId);

      // 2. Candidate profiles, excluding those ids
      let query = supabase
        .from("profiles")
        .select("*")
        .order("followers_count", { ascending: false })
        .limit(limit);

      const excludeList = Array.from(excludeIds);
      if (excludeList.length > 0) {
        query = query.not("id", "in", `(${excludeList.join(",")})`);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setUsers(
        (data as ProfileRow[]).map((row) => ({
          ...mapRowToUser(row),
          mutualsCount: 0,
        }))
      );
    } catch (err: any) {
      console.error("useSuggestedUsers fetch error:", err);
      setError(err?.message ?? "Failed to load suggestions");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [viewerId, enabled, limit]);

  useEffect(() => {
    if (enabled && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchSuggestions();
    }
  }, [enabled, fetchSuggestions]);

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const visibleUsers = users.filter((u) => !dismissedIds.has(u.id));

  return { users: visibleUsers, loading, error, dismiss, refetch: fetchSuggestions };
}