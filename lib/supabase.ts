// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { createClient } from "@supabase/supabase-js";
// import "react-native-url-polyfill/auto";

// // Expo exposes env vars prefixed EXPO_PUBLIC_ to client code automatically.
// // Add these to your .env file (see setup notes).
// const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
// const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error(
//     "Missing Supabase env vars. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file."
//   );
// }

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     storage: AsyncStorage,
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: false, // required for React Native (no browser URL)
//   },
// });

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});