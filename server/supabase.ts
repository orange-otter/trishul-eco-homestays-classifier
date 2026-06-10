import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env files
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log("[Supabase] Initializing with URL:", supabaseUrl ? "SET" : "NOT SET");
console.log("[Supabase] Initializing with Key Type:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SERVICE_ROLE" : "ANON");

// Create Supabase client for server-side operations
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (supabase) {
  console.log("[Supabase] Client initialized successfully");
} else {
  console.warn("[Supabase] Client not initialized - missing credentials");
}

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
