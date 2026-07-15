import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "../data/type";
import { mapRowToUser, ProfileRow } from "../lib/mapProfile";
import { supabase } from "../lib/supabase";

type Options = {
  excludeId?: string;
  limit?: number;
  // Only fetch once this becomes true — lets callers defer the request
  // (e.g. until the user actually opens search) instead of loading every
  // profile on every Home mount.
  enabled?: boolean;
};

export function useAllUsers(options: Options = {}) {
  const { excludeId, limit, enabled = true } = options;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (excludeId) query = query.neq("id", excludeId);
    if (limit) query = query.limit(limit);

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error("useAllUsers fetch error:", fetchError);
      setError(fetchError.message);
      setUsers([]);
    } else {
      setUsers((data as ProfileRow[]).map(mapRowToUser));
    }

    setLoading(false);
  }, [excludeId, limit]);

  useEffect(() => {
    if (enabled && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchUsers();
    }
  }, [enabled, fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
}