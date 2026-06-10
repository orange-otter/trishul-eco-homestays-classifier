import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Copy,
  Leaf,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import EditReviewDialog from "@/components/EditReviewDialog";
import ImportCSVDialog from "@/components/ImportCSVDialog";
import { generateCSV } from "@/lib/csvParser";

/**
 * Design Philosophy: Eco-Homestay Dashboard
 * - Color Palette: Forest greens (#2d5016), earth tones, crisp whites
 * - Typography: Clean, readable hierarchy
 * - Layout: Asymmetric, nature-inspired spacing
 * - Icons: Lucide React for consistency
 * - Data Persistence: Database-backed with sequential numeric IDs
 */

// Type for reviews from database
interface DatabaseReview {
  id: number;
  user_id: string;
  original: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  theme: "Food" | "Host" | "Location" | "Cleanliness" | "Value" | "Experience";
  response: string;
  created_at: string;
  updated_at: string;
}

const TEST_DATASET = [
  "The local home-cooked organic food was incredible. The Mandua rotis were a highlight!",
  "Rajesh and his family treated us like their own relatives. Exceptional hospitality.",
  "Beautiful views of the Himalayas, but the approach road from Chopta was treacherous.",
  "The room was freezing and there were cobwebs in the corner of the bathroom.",
  "A bit expensive for a homestay with zero luxury amenities or running hot water.",
  "Stargazing here was an unforgettable experience. Truly connected with nature.",
  "The host forgot to arrange our morning tea, but the view made up for it.",
  "The toilet didn't flush properly. This needs to be fixed immediately.",
  "Good location close to the Tungnath trek starting point. Fairly standard rooms.",
  "For the price we paid, getting authentic cultural insights and meals was a great deal.",
  "Too many plastic bottles dumped behind the cottage. Unacceptable for an eco-stay.",
  "Local Rhododendron juice served on arrival was delightful. Fresh and natural.",
  "Rooms are basic but clean. Don't expect hotel-like luxury.",
  "Sunil guide showed us rare birds during the village walk. Highly recommended!",
  "Power went out for 6 hours. No backup generator. Very frustrating night.",
  "The host family was polite but seemed too busy with farm work to guide us.",
  "Paid 4000 INR for a tiny room with no view. Total rip-off.",
  "Pure bliss. Waking up to the sound of birds and clean mountain air is unmatched.",
  "Dinner was delayed by two hours. We were starving after the long mountain drive.",
  "The blankets smelled damp and musty. Could not sleep comfortably.",
];

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  // Fetch all reviews from database
  const { data: reviewsData, refetch: refetchReviews } = trpc.reviews.getAll.useQuery(undefined, {
    refetchInterval: 5000, // Refetch every 5 seconds to stay in sync
  });

  const reviews: DatabaseReview[] = reviewsData?.data || [];

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingReview, setEditingReview] = useState<DatabaseReview | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Use tRPC mutation for real LLM analysis
  const analyzeReviewsMutation = trpc.reviews.analyze.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data.length > 0) {
        setInputText("");
        toast.success(`Analyzed ${result.data.length} reviews`);
        // Refetch reviews to get the latest from database
        refetchReviews();
      } else {
        toast.error(result.error || "Analysis failed");
      }
    },
    onError: (error) => {
      toast.error(`Analysis error: ${error.message}`);
    },
  });

  const handleAnalyze = async () => {
    if (inputText.trim().length === 0) {
      toast.error("Please enter at least one review");
      return;
    }

    const reviewLines = inputText
      .split("\n")
      .filter((line) => line.trim().length > 0);

    if (reviewLines.length === 0) {
      toast.error("Please enter at least one review");
      return;
    }

    setIsLoading(true);
    try {
      await analyzeReviewsMutation.mutateAsync({
        reviews: reviewLines,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTestDataset = () => {
    setInputText(TEST_DATASET.join("\n"));
    toast.success("Test dataset loaded");
  };

  const handleClear = () => {
    setInputText("");
    toast.success("Input cleared");
  };

  const handleCopyResponse = (response: string) => {
    navigator.clipboard.writeText(response);
    toast.success("Response copied to clipboard");
  };

  const handleEditReview = (review: DatabaseReview) => {
    setEditingReview(review);
    setEditDialogOpen(true);
  };

  // Update review mutation
  const updateReviewMutation = trpc.reviews.update.useMutation({
    onSuccess: () => {
      toast.success("Review updated");
      setEditDialogOpen(false);
      setEditingReview(null);
      refetchReviews();
    },
    onError: (error) => {
      toast.error(`Update error: ${error.message}`);
    },
  });

  const handleSaveEdit = (updatedReview: DatabaseReview) => {
    updateReviewMutation.mutate({
      id: updatedReview.id,
      original: updatedReview.original,
      sentiment: updatedReview.sentiment,
      theme: updatedReview.theme,
      response: updatedReview.response,
    });
  };

  // Delete review mutation
  const deleteReviewMutation = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      toast.success("Review deleted");
      refetchReviews();
    },
    onError: (error) => {
      toast.error(`Delete error: ${error.message}`);
    },
  });

  const handleDeleteReview = (id: number) => {
    deleteReviewMutation.mutate({ id });
  };

  const handleImportCSV = async (importedReviews: string[]) => {
    if (importedReviews.length === 0) {
      toast.error("No reviews to import");
      return;
    }

    setIsLoading(true);
    try {
      await analyzeReviewsMutation.mutateAsync({
        reviews: importedReviews,
      });
      toast.success(`Imported and analyzed ${importedReviews.length} reviews`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete all reviews mutation
  const deleteAllReviewsMutation = trpc.reviews.deleteAll.useMutation({
    onSuccess: () => {
      toast.success("All reviews deleted");
      refetchReviews();
    },
    onError: (error) => {
      toast.error(`Delete error: ${error.message}`);
    },
  });

  const handleExportCSV = () => {
    if (reviews.length === 0) {
      toast.error("No reviews to export");
      return;
    }

    // Convert database reviews to CSV format
    const csvData = reviews.map((r) => ({
      id: r.id,
      original: r.original,
      sentiment: r.sentiment,
      theme: r.theme,
      response: r.response,
    }));

    const headers = ["ID", "Review", "Sentiment", "Theme", "Suggested Response"];
    const rows = csvData.map((r) => [
      `#${r.id}`,
      `"${r.original.replace(/"/g, '""')}"`,
      r.sentiment,
      r.theme,
      `"${r.response.replace(/"/g, '""')}"`,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trishul-reviews-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Reviews exported to CSV");
  };

  // Calculate KPI metrics
  const totalReviews = reviews.length;
  const positiveCount = reviews.filter((r) => r.sentiment === "Positive").length;
  const neutralCount = reviews.filter((r) => r.sentiment === "Neutral").length;
  const negativeCount = reviews.filter((r) => r.sentiment === "Negative").length;

  const themeCount: Record<string, number> = {};
  reviews.forEach((r) => {
    themeCount[r.theme] = (themeCount[r.theme] || 0) + 1;
  });
  const topTheme =
    Object.entries(themeCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    "None";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Leaf className="w-8 h-8 text-emerald-700" />
                <h1 className="text-3xl font-bold text-emerald-900">
                  Trishul Eco-Homestays
                </h1>
              </div>
              <p className="text-emerald-700 text-sm">
                Review Classifier Dashboard – Analyze guest feedback with ease
              </p>
            </div>
            {reviews.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-emerald-700 font-medium">
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""} stored
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">
                    Total Reviews
                  </p>
                  <p className="text-3xl font-bold text-emerald-900 mt-2">
                    {totalReviews}
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-emerald-300" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">
                    Positive
                  </p>
                  <p className="text-3xl font-bold text-emerald-700 mt-2">
                    {positiveCount}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-amber-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">Neutral</p>
                  <p className="text-3xl font-bold text-amber-700 mt-2">
                    {neutralCount}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-300" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-red-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Negative</p>
                  <p className="text-3xl font-bold text-red-700 mt-2">
                    {negativeCount}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-300" />
              </div>
            </div>
          </Card>
        </div>

        {/* Input Section */}
        <Card className="bg-white border-emerald-200 shadow-sm mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-emerald-900 mb-4">
              Paste Reviews
            </h2>
            <Textarea
              placeholder="Paste one review per line..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-32 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || analyzeReviewsMutation.isPending}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {isLoading || analyzeReviewsMutation.isPending ? "Analyzing..." : "Analyze Reviews"}
              </Button>
              <Button
                onClick={handleLoadTestDataset}
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                Load Test Dataset
              </Button>
              <Button
                onClick={() => setImportDialogOpen(true)}
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              {reviews.length > 0 && (
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
              <Button
                onClick={handleClear}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Table */}
        {reviews.length > 0 && (
          <Card className="bg-white border-emerald-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-emerald-900">
                  Analysis Results
                </h2>
                {reviews.length > 0 && (
                  <Button
                    onClick={() => deleteAllReviewsMutation.mutate()}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              <div className="w-full overflow-x-auto">
                <Table className="w-full table-auto">
                  <TableHeader>
                    <TableRow className="border-emerald-100 hover:bg-emerald-50/50">
                      <TableHead className="text-emerald-900 font-semibold">
                        ID
                      </TableHead>
                      <TableHead className="text-emerald-900 font-semibold">
                        Review
                      </TableHead>
                      <TableHead className="text-emerald-900 font-semibold">
                        Sentiment
                      </TableHead>
                      <TableHead className="text-emerald-900 font-semibold">
                        Theme
                      </TableHead>
                      <TableHead className="text-emerald-900 font-semibold">
                        Suggested Response
                      </TableHead>
                      <TableHead className="text-emerald-900 font-semibold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow
                        key={review.id}
                        className="border-emerald-100 hover:bg-emerald-50/30"
                      >
                        <TableCell className="text-xs text-slate-500 font-mono">
                          #{review.id}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700 break-words whitespace-normal max-w-xs">
                          <p className="break-words">{review.original}</p>
                        </TableCell>
                        <TableCell>
                          {review.sentiment === "Positive" && (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                              {review.sentiment}
                            </Badge>
                          )}
                          {review.sentiment === "Neutral" && (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                              {review.sentiment}
                            </Badge>
                          )}
                          {review.sentiment === "Negative" && (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                              {review.sentiment}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-emerald-300 text-emerald-700"
                          >
                            {review.theme}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700 break-words whitespace-normal max-w-2xl">
                          <p className="break-words">{review.response}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleCopyResponse(review.response)}
                              size="sm"
                              variant="ghost"
                              className="text-emerald-700 hover:bg-emerald-100"
                              title="Copy response"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleEditReview(review)}
                              size="sm"
                              variant="ghost"
                              className="text-blue-700 hover:bg-blue-100"
                              title="Edit review"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteReview(review.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-700 hover:bg-red-100"
                              title="Delete review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {reviews.length === 0 && inputText.length === 0 && (
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-sm">
            <div className="p-12 text-center">
              <Leaf className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                Ready to analyze reviews
              </h3>
              <p className="text-emerald-700 text-sm">
                Paste your guest reviews above to get started. Use the test
                dataset to see how it works, or import reviews from a CSV file.
              </p>
            </div>
          </Card>
        )}
      </main>

      {/* Edit Dialog */}
      <EditReviewDialog
        review={editingReview}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
      />

      {/* Import CSV Dialog */}
      <ImportCSVDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportCSV}
      />
    </div>
  );
}
