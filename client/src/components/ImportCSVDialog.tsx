import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { parseCSV } from "@/lib/csvParser";

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (reviews: string[]) => void;
}

export default function ImportCSVDialog({
  open,
  onOpenChange,
  onImport,
}: ImportCSVDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [parsedReviews, setParsedReviews] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const reviews = parseCSV(csvText);

        if (reviews.length === 0) {
          setError("No valid reviews found in the file");
          setParsedReviews([]);
          return;
        }

        setParsedReviews(reviews);
      } catch (err) {
        setError(
          `Failed to parse CSV: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        setParsedReviews([]);
      }
    };

    reader.onerror = () => {
      setError("Failed to read file");
      setParsedReviews([]);
    };

    reader.readAsText(file);
  };

  const handleImport = () => {
    if (parsedReviews.length > 0) {
      onImport(parsedReviews);
      handleClose();
    }
  };

  const handleClose = () => {
    setFileName("");
    setParsedReviews([]);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Reviews from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with review data. Supports single-column (reviews
            only) or multi-column formats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed border-emerald-200 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 w-full cursor-pointer"
            >
              <Upload className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-900">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-emerald-700">CSV or TXT files</p>
              </div>
            </button>
          </div>

          {/* File Info */}
          {fileName && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-emerald-900 font-medium">
                {fileName}
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {parsedReviews.length > 0 && (
            <div>
              <p className="text-sm font-medium text-emerald-900 mb-2">
                Found {parsedReviews.length} review(s):
              </p>
              <div className="max-h-48 overflow-y-auto space-y-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
                {parsedReviews.slice(0, 5).map((review, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-slate-700 p-2 bg-white rounded border border-slate-100 line-clamp-2"
                  >
                    {review}
                  </div>
                ))}
                {parsedReviews.length > 5 && (
                  <p className="text-xs text-slate-500 p-2 font-medium">
                    ... and {parsedReviews.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-slate-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedReviews.length === 0}
            className="bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
          >
            Import {parsedReviews.length > 0 && `(${parsedReviews.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
