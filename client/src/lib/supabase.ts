import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create Supabase client for client-side operations
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Review {
  id: number;
  user_id: string;
  original: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  theme: "Food" | "Host" | "Location" | "Cleanliness" | "Value" | "Experience";
  response: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}
