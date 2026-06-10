import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface EditReviewDialogProps {
  review: DatabaseReview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedReview: DatabaseReview) => void;
}

export default function EditReviewDialog({
  review,
  open,
  onOpenChange,
  onSave,
}: EditReviewDialogProps) {
  const [original, setOriginal] = useState(review?.original || "");
  const [sentiment, setSentiment] = useState<DatabaseReview["sentiment"]>(
    review?.sentiment || "Neutral"
  );
  const [theme, setTheme] = useState<DatabaseReview["theme"]>(
    review?.theme || "Experience"
  );
  const [response, setResponse] = useState(review?.response || "");

  const handleSave = () => {
    if (review) {
      onSave({
        ...review,
        original,
        sentiment,
        theme,
        response,
      });
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset form when opening
      setOriginal(review?.original || "");
      setSentiment(review?.sentiment || "Neutral");
      setTheme(review?.theme || "Experience");
      setResponse(review?.response || "");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Review */}
          <div>
            <Label htmlFor="original" className="text-emerald-900 font-medium">
              Original Review
            </Label>
            <Textarea
              id="original"
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              className="min-h-24 mt-2 border-emerald-200 focus:border-emerald-500"
              placeholder="Guest review text..."
            />
          </div>

          {/* Sentiment */}
          <div>
            <Label htmlFor="sentiment" className="text-emerald-900 font-medium">
              Sentiment
            </Label>
            <Select value={sentiment} onValueChange={(value: any) => setSentiment(value)}>
              <SelectTrigger
                id="sentiment"
                className="mt-2 border-emerald-200 focus:border-emerald-500"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Positive">Positive</SelectItem>
                <SelectItem value="Neutral">Neutral</SelectItem>
                <SelectItem value="Negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theme */}
          <div>
            <Label htmlFor="theme" className="text-emerald-900 font-medium">
              Theme
            </Label>
            <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
              <SelectTrigger
                id="theme"
                className="mt-2 border-emerald-200 focus:border-emerald-500"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Host">Host</SelectItem>
                <SelectItem value="Location">Location</SelectItem>
                <SelectItem value="Cleanliness">Cleanliness</SelectItem>
                <SelectItem value="Value">Value</SelectItem>
                <SelectItem value="Experience">Experience</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Response */}
          <div>
            <Label htmlFor="response" className="text-emerald-900 font-medium">
              Suggested Response
            </Label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="min-h-20 mt-2 border-emerald-200 focus:border-emerald-500"
              placeholder="Management response..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
