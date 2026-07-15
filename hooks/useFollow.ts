import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Options = {
  // Skip the initial "am I already following them" check until this is
  // true — e.g. wait until we know it's not your own profile.
  enabled?: boolean;
};

export function useFollow(
  viewerId?: string,
  profileId?: string,
  options: Options = {}
) {
  const { enabled = true } = options;

  const [isFollowing, setIsFollowing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      if (!enabled || !viewerId || !profileId || viewerId === profileId) {
        setIsFollowing(false);
        return;
      }

      setChecking(true);

      const { data, error: fetchError } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", viewerId)
        .eq("following_id", profileId)
        .maybeSingle();

      if (!cancelled) {
        if (fetchError) {
          console.error("useFollow status check error:", fetchError);
        } else {
          setIsFollowing(!!data);
        }
        setChecking(false);
      }
    }

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [viewerId, profileId, enabled]);

  const follow = useCallback(async () => {
    if (!viewerId || !profileId || viewerId === profileId || updating) {
      return false;
    }

    setUpdating(true);
    setError(null);
    setIsFollowing(true); // optimistic

    const { error: insertError } = await supabase
      .from("follows")
      .insert({ follower_id: viewerId, following_id: profileId });

    setUpdating(false);

    if (insertError) {
      setIsFollowing(false); // revert
      setError(insertError.message);
      return false;
    }

    return true;
  }, [viewerId, profileId, updating]);

  const unfollow = useCallback(async () => {
    if (!viewerId || !profileId || updating) return false;

    setUpdating(true);
    setError(null);
    setIsFollowing(false); // optimistic

    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", viewerId)
      .eq("following_id", profileId);

    setUpdating(false);

    if (deleteError) {
      setIsFollowing(true); // revert
      setError(deleteError.message);
      return false;
    }

    return true;
  }, [viewerId, profileId, updating]);

  return { isFollowing, checking, updating, error, follow, unfollow };
}