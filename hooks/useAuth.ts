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

  // Step 1 of "forgot password": asks Supabase to send a 6-digit recovery
  // code straight to the email the user typed in. NOTE: this requires your
  // Supabase Auth email template for "Reset Password" to use {{ .Token }}
  // instead of {{ .ConfirmationURL }}, otherwise Supabase will send a link
  // instead of a code.
  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    // Supabase itself returns success even for an email with no matching
    // account (intentional, so this can't be used to enumerate accounts).
    // We keep the same generic message on real errors too, so the UI never
    // gives away whether an account exists.
    if (error) {
      return {
        email: null,
        error: { message: "Something went wrong. Please try again." } as any,
      };
    }

    return { email, error: null };
  };

  // Step 2: verify the 6-digit code the user received by email. On success
  // Supabase creates a real (temporary) session, which is what lets
  // updatePassword below actually change the password.
  const verifyRecoveryCode = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });

    if (error) {
      return {
        data: null,
        error: { message: "That code is invalid or has expired." } as any,
      };
    }

    return { data, error: null };
  };

  // Step 3: called once verifyRecoveryCode has succeeded (so there's an
  // active session) to actually set the new password.
  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return {
        data: null,
        error: { message: "Couldn't update password. Please try again." } as any,
      };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithUsername,
    forgotPassword,
    verifyRecoveryCode,
    updatePassword,
    signOut,
  };
}