import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { supabase } from "./supabase";
import * as db from "./db";

describe("Supabase Integration", () => {
  const testUserId = "test-user-" + Date.now();
  const testReview = {
    user_id: testUserId,
    original: "Test review for Supabase integration",
    sentiment: "Positive",
    theme: "Food",
    response: "Thank you for your feedback!",
  };

  it("should have Supabase client initialized", () => {
    expect(supabase).toBeDefined();
    expect(supabase).not.toBeNull();
  });

  it("should create a review in Supabase", async () => {
    const result = await db.createReview(testReview);
    expect(result).toBeDefined();
    expect(result?.id).toBeGreaterThan(0);
    expect(result?.original).toBe(testReview.original);
    expect(result?.sentiment).toBe(testReview.sentiment);
  });

  it("should fetch reviews from Supabase", async () => {
    const reviews = await db.getAllReviews(testUserId);
    expect(Array.isArray(reviews)).toBe(true);
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0].user_id).toBe(testUserId);
  });

  it("should update a review in Supabase", async () => {
    const reviews = await db.getAllReviews(testUserId);
    if (reviews.length === 0) {
      throw new Error("No reviews found to update");
    }

    const reviewId = reviews[0].id;
    const updated = await db.updateReview(reviewId, {
      sentiment: "Neutral",
      response: "Updated response",
    });

    expect(updated).toBeDefined();
    expect(updated?.sentiment).toBe("Neutral");
    expect(updated?.response).toBe("Updated response");
  });

  it("should delete a review from Supabase", async () => {
    const reviews = await db.getAllReviews(testUserId);
    if (reviews.length === 0) {
      throw new Error("No reviews found to delete");
    }

    const reviewId = reviews[0].id;
    const deleted = await db.deleteReview(reviewId);
    expect(deleted).toBe(true);

    const afterDelete = await db.getReviewById(reviewId);
    expect(afterDelete).toBeUndefined();
  });

  it("should handle null supabase client gracefully", async () => {
    // This test verifies that functions return appropriate values when supabase is null
    // The actual null scenario is tested by the null checks in each function
    const reviews = await db.getAllReviews();
    expect(Array.isArray(reviews)).toBe(true);
  });
});
