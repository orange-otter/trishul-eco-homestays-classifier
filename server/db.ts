import { supabase } from "./supabase";
import type { Review } from "./supabase";

// User operations
export async function upsertUser(user: { id: string; email: string }): Promise<void> {
  if (!supabase) {
    console.warn("[Database] Supabase client not initialized");
    return;
  }

  try {
    const { error } = await supabase
      .from("users")
      .upsert({ id: user.id, email: user.email }, { onConflict: "id" });

    if (error) {
      console.error("[Database] Failed to upsert user:", error);
      throw error;
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  if (!supabase) {
    console.warn("[Database] Supabase client not initialized");
    return undefined;
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", openId)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("[Database] Failed to get user:", error);
      throw error;
    }

    return data || undefined;
  } catch (error) {
    console.error("[Database] Failed to get user:", error);
    return undefined;
  }
}

// Review operations
export async function createReview(review: {
  user_id: string;
  original: string;
  sentiment: string;
  theme: string;
  response: string;
}): Promise<Review | null> {
  if (!supabase) {
    console.warn("[Database] Supabase client not initialized");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert([review])
      .select()
      .single();

    if (error) {
      console.error("[Database] Failed to create review:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("[Database] Failed to create review:", error);
    throw error;
  }
}

export async function createReviews(reviewList: Array<{
  user_id: string;
  original: string;
  sentiment: string;
  theme: string;
  response: string;
}>): Promise<Review[]> {
  if (!supabase) {
    console.warn("[Database] Supabase client not initialized");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert(reviewList)
      .select();

    if (error) {
      console.error("[Database] Failed to create reviews:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("[Database] Failed to create reviews:", error);
    throw error;
  }
}

export async function getAllReviews(userId?: string): Promise<Review[]> {
  if (!supabase) {
    console.warn("[Database] Supabase client not initialized");
    return [];
  }

  try {
    let query = supabase.from("reviews").select("*");

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[Database] Failed to fetch reviews:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[Database] Failed to fetch reviews:", error);
    return [];
  }
}

export async function getReviewById(id: number): Promise<Review | undefined> {
  if (!supabase) {
    console.warn("[Database] Supabase client not initialized");
    return undefined;
  }

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", id)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[Database] Failed to fetch review:", error);
      throw error;
    }

    return data || undefined;
  } catch (error) {
    console.error("[Database] Failed to fetch review:", error);
    return undefined;
  }
}

export async function updateReview(
  id: number,
  updates: Partial<{
    original: string;
    sentiment: string;
    theme: string;
    response: string;
  }>
): Promise<Review | null> {
  if (!supabase) {
    console.warn("[Database] Supabase client not initialized");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[Database] Failed to update review:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("[Database] Failed to update review:", error);
    throw error;
  }
}

export async function deleteReview(id: number): Promise<boolean> {
  if (!supabase) {
    console.warn("[Database] Supabase client not initialized");
    return false;
  }

  try {
    const { error } = await supabase.from("reviews").delete().eq("id", id);

    if (error) {
      console.error("[Database] Failed to delete review:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("[Database] Failed to delete review:", error);
    return false;
  }
}

export async function deleteAllReviews(userId?: string): Promise<boolean> {
  if (!supabase) {
    console.warn("[Database] Supabase client not initialized");
    return false;
  }

  try {
    let query = supabase.from("reviews").delete();

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { error } = await query;

    if (error) {
      console.error("[Database] Failed to delete all reviews:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("[Database] Failed to delete all reviews:", error);
    return false;
  }
}
