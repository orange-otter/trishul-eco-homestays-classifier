import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

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

describe("reviews.analyze", () => {
  it("should analyze reviews using Manus built-in LLM", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testReviews = [
      "The local home-cooked organic food was incredible. The Mandua rotis were a highlight!",
      "The room was freezing and there were cobwebs in the corner of the bathroom.",
    ];

    try {
      const result = await caller.reviews.analyze({
        reviews: testReviews,
      });

      // Check if the API call was successful
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(testReviews.length);

      // Validate each analyzed review
      result.data.forEach((review, index) => {
        expect(review.id).toBeDefined();
        expect(review.original).toBe(testReviews[index]);
        expect(["Positive", "Neutral", "Negative"]).toContain(review.sentiment);
        expect([
          "Food",
          "Host",
          "Location",
          "Cleanliness",
          "Value",
          "Experience",
        ]).toContain(review.theme);
        expect(review.response).toBeDefined();
        expect(typeof review.response).toBe("string");
        expect(review.response.length).toBeGreaterThan(0);
      });

      console.log("✅ LLM integration test passed!");
      console.log("Sample analysis:", result.data[0]);
    } catch (error) {
      console.error("❌ LLM test failed:", error);
      throw error;
    }
  });

  it("should handle empty reviews array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.reviews.analyze({
      reviews: [],
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("should validate LLM API is configured", async () => {
    const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
    expect(apiUrl).toBeDefined();
    expect(apiKey).toBeDefined();
  });
});
