// DEPRECATED: direct Supabase access is kept only for the data screens until
// they are moved to the Workers API. Auth MUST use `@/lib/auth-session`
// (Better Auth session token) — supabase.auth is no longer used anywhere.
// New code: use `getAuthHeaders()` from `@/lib/auth-session` and call the API.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // IMPORTANT
    },
    realtime: {},
  }
);
