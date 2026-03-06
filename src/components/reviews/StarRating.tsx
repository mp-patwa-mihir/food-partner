"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: number;
}

export function StarRating({
  rating,
  maxRating = 5,
  onRatingChange,
  interactive = false,
  size = 20,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && onRatingChange?.(star)}
          className={cn(
            "transition-all duration-200 outline-none",
            interactive ? "hover:scale-125 active:scale-95 cursor-pointer" : "cursor-default"
          )}
        >
          <Star
            size={size}
            className={cn(
              "transition-colors",
              star <= displayRating
                ? "fill-amber-500 text-amber-500"
                : "text-zinc-300 dark:text-zinc-700 fill-transparent"
            )}
            strokeWidth={interactive ? 2.5 : 2}
          />
        </button>
      ))}
    </div>
  );
}
