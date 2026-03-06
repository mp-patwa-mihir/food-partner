"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormProps {
  restaurantId: string;
  onSuccess: () => void;
}

export function ReviewForm({ restaurantId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, rating, comment }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      setRating(0);
      setComment("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Write a Review
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-500 mb-2">Rating</label>
          <StarRating 
            rating={rating} 
            interactive 
            size={28} 
            onRatingChange={setRating} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-500 mb-2">Comment</label>
          <Textarea
            placeholder="Share your experience with this restaurant..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px] rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-primary/20"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-xl shadow-lg shadow-primary/20"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
      </form>
    </div>
  );
}
