import { useEffect, useState } from "react";
import type { User } from "../data/type";
import { mapRowToUser, ProfileRow } from "../lib/mapProfile";
import { supabase } from "../lib/supabase";

export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setError("User not found");
          setProfile(null);
        } else {
          setProfile(mapRowToUser(data as ProfileRow));
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { profile, loading, error };
}