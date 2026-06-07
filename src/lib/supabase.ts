import { createBrowserClient } from '@supabase/ssr';

// This creates a secure client that runs in the user's browser
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};