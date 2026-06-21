// We are intentionally overriding this Lovable auto-generated file 
// to bypass their cloud proxy and use native Supabase auth for self-hosting.
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft" | "lovable", opts?: SignInOptions) => {
      // Map 'lovable' provider to 'google' as a fallback, just in case
      const actualProvider = provider === "lovable" ? "google" : provider;

      // Call Supabase directly
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: actualProvider,
        options: {
          // Use the provided redirect URI, or default to the current domain (your Coolify domain)
          redirectTo: opts?.redirect_uri || window.location.origin,
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        console.error("Supabase OAuth Error:", error.message);
        return { error };
      }

      // Supabase handles the browser redirect automatically upon success
      return { redirected: true };
    },
  },
};
