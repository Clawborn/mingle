import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Public client — respects RLS, safe for client-side / read-only operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — bypasses RLS, use ONLY in server-side API routes
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase; // fallback to anon if not configured (dev mode)
