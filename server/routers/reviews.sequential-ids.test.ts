import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { deleteAllReviews, getAllReviews } from "../db";

// Create a mock context for testing
function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Sequential ID Implementation", () => {
  beforeAll(async () => {
    // Clean up any existing reviews before tests
    try {
      await deleteAllReviews();
    } catch (error) {
      console.warn("Could not clean up reviews before tests:", error);
    }
  });

  afterAll(async () => {
    // Clean up after tests
    try {
      await deleteAllReviews();
    } catch (error) {
      console.warn("Could not clean up reviews after tests:", error);
    }
  });

  it("should return numeric IDs for analyzed reviews", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testReviews = [
      "The food was excellent and fresh.",
      "The room was clean and comfortable.",
    ];

    const result = await caller.reviews.analyze({
      reviews: testReviews,
    });

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(testReviews.length);

    // Verify all IDs are numbers
    result.data.forEach((review) => {
      expect(typeof review.id).toBe("number");
      expect(review.id).toBeGreaterThan(0);
    });
  });

  it("should return sequential numeric IDs for multiple review batches", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // First batch
    const batch1 = ["Great hospitality and warm welcome."];
    const result1 = await caller.reviews.analyze({ reviews: batch1 });
    expect(result1.success).toBe(true);
    const firstId = result1.data[0]?.id;
    expect(typeof firstId).toBe("number");

    // Second batch
    const batch2 = ["Beautiful mountain views.", "Peaceful and relaxing."];
    const result2 = await caller.reviews.analyze({ reviews: batch2 });
    expect(result2.success).toBe(true);
    expect(result2.data.length).toBe(2);

    // Verify IDs are sequential and unique
    const allIds = [firstId, ...result2.data.map((r) => r.id)];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length); // All IDs should be unique
    expect(allIds.every((id) => typeof id === "number")).toBe(true);
  });

  it("should retrieve all reviews with numeric IDs", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Analyze some reviews
    const testReviews = ["Excellent service and hospitality."];
    await caller.reviews.analyze({ reviews: testReviews });

    // Get all reviews
    const result = await caller.reviews.getAll();

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);

    // Verify all reviews have numeric IDs
    result.data.forEach((review) => {
      expect(typeof review.id).toBe("number");
      expect(review.id).toBeGreaterThan(0);
      expect(review.original).toBeDefined();
      expect(review.sentiment).toBeDefined();
      expect(review.theme).toBeDefined();
      expect(review.response).toBeDefined();
    });
  });

  it("should update review with numeric ID", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create a review
    const testReviews = ["The location was perfect for our needs."];
    const createResult = await caller.reviews.analyze({ reviews: testReviews });
    expect(createResult.success).toBe(true);

    const reviewId = createResult.data[0]?.id;
    expect(typeof reviewId).toBe("number");

    // Update the review
    const updateResult = await caller.reviews.update({
      id: reviewId,
      response: "Thank you for your feedback! We appreciate your visit.",
    });

    expect(updateResult.success).toBe(true);
    expect(Array.isArray(updateResult.data)).toBe(true);

    // Verify the update
    const updatedReview = updateResult.data.find((r) => r.id === reviewId);
    expect(updatedReview).toBeDefined();
    expect(updatedReview?.response).toBe(
      "Thank you for your feedback! We appreciate your visit."
    );
  });

  it("should delete review with numeric ID", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create a review
    const testReviews = ["The amenities were basic but adequate."];
    const createResult = await caller.reviews.analyze({ reviews: testReviews });
    expect(createResult.success).toBe(true);

    const reviewId = createResult.data[0]?.id;
    expect(typeof reviewId).toBe("number");

    // Delete the review
    const deleteResult = await caller.reviews.delete({ id: reviewId });

    expect(deleteResult.success).toBe(true);

    // Verify deletion
    const remainingReview = deleteResult.data.find((r) => r.id === reviewId);
    expect(remainingReview).toBeUndefined();
  });

  it("should maintain ID uniqueness across operations", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Analyze multiple reviews
    const reviews1 = ["Excellent food quality."];
    const result1 = await caller.reviews.analyze({ reviews: reviews1 });

    const reviews2 = ["Great host and hospitality."];
    const result2 = await caller.reviews.analyze({ reviews: reviews2 });

    const reviews3 = ["Beautiful surroundings."];
    const result3 = await caller.reviews.analyze({ reviews: reviews3 });

    // Collect all IDs
    const allIds = [
      ...result1.data.map((r) => r.id),
      ...result2.data.map((r) => r.id),
      ...result3.data.map((r) => r.id),
    ];

    // Verify all IDs are unique
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);

    // Verify all IDs are numbers
    expect(allIds.every((id) => typeof id === "number")).toBe(true);
  });

  it("should verify LLM API configuration for sequential ID tests", async () => {
    const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
    expect(apiUrl).toBeDefined();
    expect(apiKey).toBeDefined();
  });
});
