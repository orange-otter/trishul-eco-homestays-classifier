import { useState, useEffect } from "react";

export interface Review {
  id: number;
  original: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  theme: "Food" | "Host" | "Location" | "Cleanliness" | "Value" | "Experience";
  response: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const STORAGE_KEY = "trishul_reviews";

export const useReviewStorage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load reviews from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setReviews(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse stored reviews:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save reviews to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    }
  }, [reviews, isLoaded]);

  const addReviews = (newReviews: Review[]) => {
    setReviews((prev) => [...prev, ...newReviews]);
  };

  const updateReview = (id: number, updatedReview: Partial<Review>) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === id ? { ...review, ...updatedReview } : review
      )
    );
  };

  const deleteReview = (id: number) => {
    setReviews((prev) => prev.filter((review) => review.id !== id));
  };

  const deleteAllReviews = () => {
    setReviews([]);
  };

  return {
    reviews,
    addReviews,
    updateReview,
    deleteReview,
    deleteAllReviews,
    isLoaded,
  };
};
