import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { upsertUser, createReviews, getAllReviews, updateReview, deleteReview, deleteAllReviews } from "../db";

// Analyze reviews using Gemini API
const analyzeWithLLM = async (reviews: string[]): Promise<any[]> => {
  if (reviews.length === 0) {
    return [];
  }

  const reviewsText = reviews.map((r, i) => `${i + 1}. ${r}`).join("\n");

  const prompt = `You are an expert at analyzing guest reviews for eco-homestays. Analyze EACH review individually and provide:
1. SENTIMENT: Positive, Neutral, or Negative based on the guest's tone
2. THEME: Main topic - Food, Host, Location, Cleanliness, Value, or Experience
3. RESPONSE: Personalized professional response addressing the specific feedback

IMPORTANT: Each review gets a DIFFERENT analysis. Do NOT give generic responses.

Reviews:
${reviewsText}

Respond with ONLY valid JSON (no markdown, no code blocks):
{"reviews": [{"sentiment": "Positive|Neutral|Negative", "theme": "Food|Host|Location|Cleanliness|Value|Experience", "response": "personalized response"}]}

Must have exactly ${reviews.length} objects, one per review in order.`;

  try {
    let content: string;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in your .env file. Please add it to use the AI Analysis.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert sentiment analyst for eco-homestay reviews. Analyze EACH review separately with DIFFERENT sentiments and responses. Positive reviews get Positive sentiment, negative reviews get Negative sentiment, mixed reviews get Neutral. Write personalized responses addressing specific feedback. NEVER give generic responses like 'Thank you for your feedback'.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            reviews: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sentiment: { type: "string", enum: ["Positive", "Neutral", "Negative"] },
                  theme: { type: "string", enum: ["Food", "Host", "Location", "Cleanliness", "Value", "Experience"] },
                  response: { type: "string" }
                },
                required: ["sentiment", "theme", "response"]
              }
            }
          },
          required: ["reviews"]
        }
      }
    });
    content = response.text || "";

    if (typeof content !== "string" || !content) {
      throw new Error("Invalid response format from LLM");
    }

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonStr = content;
    if (content.includes("```json")) {
      jsonStr = content.split("```json")[1]?.split("```")[0] || content;
    } else if (content.includes("```")) {
      jsonStr = content.split("```")[1]?.split("```")[0] || content;
    }

    const analysisData = JSON.parse(jsonStr.trim());
    const analysisResults = analysisData.reviews || [];

    console.log("[LLM Response Debug]", {
      rawContent: content.substring(0, 200),
      parsedResults: analysisResults,
      resultCount: analysisResults.length,
      expectedCount: reviews.length,
    });

    // Map results to review objects
    return reviews.map((review, index) => {
      const analysis = analysisResults[index] || {
        sentiment: "Neutral",
        theme: "Experience",
        response: "Thank you for your feedback.",
      };
      
      console.log(`[Review ${index + 1}] Original: ${review.substring(0, 50)}... => Sentiment: ${analysis.sentiment}, Theme: ${analysis.theme}`);

      return {
        original: review,
        sentiment: analysis.sentiment || "Neutral",
        theme: analysis.theme || "Experience",
        response: analysis.response || "Thank you for your feedback.",
      };
    });
  } catch (error) {
    console.error("[LLM Analysis Error]", error);
    throw error;
  }
};

export const reviewsRouter = router({
  // Analyze reviews and save to database
  analyze: publicProcedure
    .input(
      z.object({
        reviews: z.array(z.string().min(1)),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Handle empty reviews array
        if (input.reviews.length === 0) {
          return {
            success: true,
            data: [],
          };
        }
        
        const analyzed = await analyzeWithLLM(input.reviews);
        
        const mockUserId = "00000000-0000-0000-0000-000000000000";
        // Ensure mock user exists in database
        await upsertUser({ id: mockUserId, email: "guest@trishul.com" });

        // Save to database with mapped user_id
        const reviewsToSave = analyzed.map(item => ({
          ...item,
          user_id: mockUserId
        }));
        await createReviews(reviewsToSave);
        
        // Return the newly created reviews (they will have database IDs assigned)
        const allReviews = await getAllReviews(mockUserId);
        const newlyAdded = allReviews.slice(0, analyzed.length);
        
        return {
          success: true,
          data: newlyAdded,
        };
      } catch (error) {
        console.error("[Review Analysis Failed]", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Analysis failed",
          data: [],
        };
      }
    }),

  // Get all reviews from database
  getAll: publicProcedure.query(async () => {
    try {
      const mockUserId = "00000000-0000-0000-0000-000000000000";
      // Ensure mock user exists
      await upsertUser({ id: mockUserId, email: "guest@trishul.com" });
      
      const allReviews = await getAllReviews(mockUserId);
      return {
        success: true,
        data: allReviews,
      };
    } catch (error) {
      console.error("[Fetch Reviews Failed]", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch reviews",
        data: [],
      };
    }
  }),

  // Update a review
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        original: z.string().optional(),
        sentiment: z.enum(["Positive", "Neutral", "Negative"]).optional(),
        theme: z.enum(["Food", "Host", "Location", "Cleanliness", "Value", "Experience"]).optional(),
        response: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const mockUserId = "00000000-0000-0000-0000-000000000000";
        const { id, ...updates } = input;
        await updateReview(id, updates);
        const allReviews = await getAllReviews(mockUserId);
        return {
          success: true,
          data: allReviews,
        };
      } catch (error) {
        console.error("[Update Review Failed]", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update review",
          data: [],
        };
      }
    }),

  // Delete a review
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const mockUserId = "00000000-0000-0000-0000-000000000000";
        await deleteReview(input.id);
        const allReviews = await getAllReviews(mockUserId);
        return {
          success: true,
          data: allReviews,
        };
      } catch (error) {
        console.error("[Delete Review Failed]", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete review",
          data: [],
        };
      }
    }),

  // Delete all reviews
  deleteAll: publicProcedure.mutation(async () => {
    try {
      const mockUserId = "00000000-0000-0000-0000-000000000000";
      await deleteAllReviews(mockUserId);
      return {
        success: true,
        data: [],
      };
    } catch (error) {
      console.error("[Delete All Reviews Failed]", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete all reviews",
        data: [],
      };
    }
  }),
});
