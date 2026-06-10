import { Review } from "@/hooks/useReviewStorage";

/**
 * Parse CSV file and extract review text
 * Supports both single column (reviews only) and multi-column formats
 */
export const parseCSV = (csvText: string): string[] => {
  const lines = csvText.split("\n").filter((line) => line.trim());

  // Check if it's a multi-column CSV (has commas)
  const isMultiColumn = lines.some((line) => line.includes(","));

  if (isMultiColumn) {
    // Parse as CSV with headers
    const rows = lines.map((line) => {
      // Simple CSV parsing (handles basic cases)
      return line
        .split(",")
        .map((cell) => cell.trim().replace(/^["']|["']$/g, ""));
    });

    // Skip header row if present
    const startIndex = isHeaderRow(rows[0]) ? 1 : 0;

    // Try to find review column (look for common headers)
    const headers = rows[0];
    let reviewColumnIndex = 0;

    const reviewHeaders = ["review", "text", "comment", "feedback", "message"];
    for (let i = 0; i < headers.length; i++) {
      if (
        reviewHeaders.includes(headers[i].toLowerCase().replace(/[^a-z]/g, ""))
      ) {
        reviewColumnIndex = i;
        break;
      }
    }

    // Extract reviews from the identified column
    return rows
      .slice(startIndex)
      .map((row) => row[reviewColumnIndex] || "")
      .filter((review) => review.length > 0);
  } else {
    // Single column - each line is a review
    return lines.filter((line) => line.trim().length > 0);
  }
};

/**
 * Check if a row appears to be a header row
 */
const isHeaderRow = (row: string[]): boolean => {
  const headerKeywords = [
    "review",
    "text",
    "comment",
    "feedback",
    "id",
    "date",
    "rating",
  ];
  return row.some((cell) =>
    headerKeywords.includes(cell.toLowerCase().replace(/[^a-z]/g, ""))
  );
};

/**
 * Generate CSV from reviews for export
 */
export const generateCSV = (reviews: Review[]): string => {
  const headers = ["ID", "Review", "Sentiment", "Theme", "Suggested Response"];
  const rows = reviews.map((review) => [
    review.id,
    `"${review.original.replace(/"/g, '""')}"`, // Escape quotes in CSV
    review.sentiment,
    review.theme,
    `"${review.response.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
};
