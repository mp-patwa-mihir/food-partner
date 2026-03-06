"use client";

import { useEffect, useState } from "react";
import { StarRating } from "./StarRating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewListProps {
  restaurantId: string;
  refreshTrigger: number;
  onReviewDeleted: () => void;
}

export function ReviewList({ restaurantId, refreshTrigger, onReviewDeleted }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/reviews/${restaurantId}`);
        const data = await response.json();
        
        if (response.ok) {
          setReviews(data.reviews || []);
        }
      } catch (err: any) {
        console.error("Failed to fetch reviews", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, [restaurantId, refreshTrigger]);

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      setIsDeleting(reviewId);
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Review deleted");
        setReviews(reviews.filter((r) => r._id !== reviewId));
        onReviewDeleted();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete review");
      }
    } catch (err: any) {
      toast.error("An error occurred");
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-500">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div 
          key={review._id} 
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-zinc-100 dark:border-zinc-800">
                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                  {review.userId.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">
                  {review.userId.name}
                </h4>
                <p className="text-[10px] text-zinc-400 font-medium">
                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <StarRating rating={review.rating} size={14} />
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                onClick={() => handleDelete(review._id)}
                disabled={isDeleting === review._id}
              >
                {isDeleting === review._id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>
          
          <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
            {review.comment}
          </p>
        </div>
      ))}
    </div>
  );
}
