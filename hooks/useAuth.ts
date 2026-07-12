import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import type { User } from "../data/type"; // adjust to wherever your Post/User/Comment types live
import { mapRowToUser, ProfileRow } from "../lib/mapProfile";
import { supabase } from "../lib/supabase";

type SignUpParams = {
  email: string;
  password: string;
  name: string;
  username: string;
  category: User["category"];
  gender?: User["gender"];
  dateOfBirth?: string; // "YYYY-MM-DD"
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(mapRowToUser(data as ProfileRow));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async ({
    email,
    password,
    name,
    username,
    category,
    gender,
    dateOfBirth,
  }: SignUpParams) => {
    // All of this gets picked up by the DB trigger via raw_user_meta_data
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, username, category, gender, date_of_birth: dateOfBirth },
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  // Your login screen collects a username, not an email, so this looks up
  // the email behind the scenes first, then signs in with it. Returns a
  // generic error message either way so failed lookups don't reveal whether
  // a username exists.
  const signInWithUsername = async (username: string, password: string) => {
    const { data: profileRow, error: lookupError } = await supabase
      .from("profiles")
      .select("email")
      .ilike("username", username)
      .maybeSingle();

    if (lookupError || !profileRow) {
      return {
        data: null,
        error: { message: "The username or password is incorrect" } as any,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: profileRow.email,
      password,
    });

    if (error) {
      return {
        data,
        error: { message: "The username or password is incorrect" } as any,
      };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return { session, profile, loading, signUp, signIn, signInWithUsername, signOut };
}


// import type { Session } from "@supabase/supabase-js";
// import { useCallback, useEffect, useState } from "react";
// import type { User } from "../data/type"; // adjust to wherever your Post/User/Comment types live
// import { supabase } from "../lib/supabase";

// type SignUpParams = {
//   email: string;
//   password: string;
//   name: string;
//   username: string;
//   category: User["category"];
//   gender?: User["gender"];
//   dateOfBirth?: string; // "YYYY-MM-DD"
// };

// type ProfileRow = {
//   id: string;
//   name: string;
//   username: string;
//   email: string;
//   phone_number: string | null;
//   profile_picture: string;
//   bio: string | null;
//   category: User["category"];
//   gender: User["gender"] | null;
//   followers_count: number;
//   following_count: number;
//   is_verified: boolean;
//   is_private: boolean;
//   interests: string[];
//   created_at: string;
//   updated_at: string;
// };

// function mapRowToUser(row: ProfileRow): User {
//   return {
//     id: row.id,
//     name: row.name,
//     username: row.username,
//     email: row.email,
//     phoneNumber: row.phone_number ?? undefined,
//     profilePicture: row.profile_picture,
//     bio: row.bio ?? undefined,
//     category: row.category,
//     gender: row.gender ?? undefined,
//     followersCount: row.followers_count,
//     followingCount: row.following_count,
//     followers: [], // real relations come from the follows table (next step)
//     following: [],
//     posts: [], // real relations come from the posts table (next step)
//     savedPosts: [],
//     isVerified: row.is_verified,
//     isPrivate: row.is_private,
//     createdAt: row.created_at,
//     updatedAt: row.updated_at,
//     interests: row.interests,
//   };
// }

// export function useAuth() {
//   const [session, setSession] = useState<Session | null>(null);
//   const [profile, setProfile] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   const fetchProfile = useCallback(async (userId: string) => {
//     const { data, error } = await supabase
//       .from("profiles")
//       .select("*")
//       .eq("id", userId)
//       .single();

//     if (!error && data) {
//       setProfile(mapRowToUser(data as ProfileRow));
//     }
//   }, []);

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       if (session?.user) fetchProfile(session.user.id);
//       setLoading(false);
//     });

//     const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
//       setSession(session);
//       if (session?.user) {
//         fetchProfile(session.user.id);
//       } else {
//         setProfile(null);
//       }
//     });

//     return () => listener.subscription.unsubscribe();
//   }, [fetchProfile]);

//   const signUp = async ({
//     email,
//     password,
//     name,
//     username,
//     category,
//     gender,
//     dateOfBirth,
//   }: SignUpParams) => {
//     // All of this gets picked up by the DB trigger via raw_user_meta_data
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: { name, username, category, gender, date_of_birth: dateOfBirth },
//       },
//     });
//     return { data, error };
//   };

//   const signIn = async (email: string, password: string) => {
//     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//     return { data, error };
//   };

//   // Your login screen collects a username, not an email, so this looks up
//   // the email behind the scenes first, then signs in with it. Returns a
//   // generic error message either way so failed lookups don't reveal whether
//   // a username exists.
//   const signInWithUsername = async (username: string, password: string) => {
//     const { data: profileRow, error: lookupError } = await supabase
//       .from("profiles")
//       .select("email")
//       .ilike("username", username)
//       .maybeSingle();

//     if (lookupError || !profileRow) {
//       return {
//         data: null,
//         error: { message: "The username or password is incorrect" } as any,
//       };
//     }

//     const { data, error } = await supabase.auth.signInWithPassword({
//       email: profileRow.email,
//       password,
//     });

//     if (error) {
//       return {
//         data,
//         error: { message: "The username or password is incorrect" } as any,
//       };
//     }

//     return { data, error: null };
//   };

//   const signOut = async () => {
//     const { error } = await supabase.auth.signOut();
//     return { error };
//   };

//   return { session, profile, loading, signUp, signIn, signInWithUsername, signOut };
// }