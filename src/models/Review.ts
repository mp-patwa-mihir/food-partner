import mongoose, { Document, Model, Schema } from "mongoose";

// ─── Interface ──────────────────────────────────────────────────────────────

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ─────────────────────────────────────────────────────────────────

const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple reviews from the same user for the same restaurant
ReviewSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });

// ─── Model ──────────────────────────────────────────────────────────────────

const Review: Model<IReview> =
  mongoose.models.Review ?? mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
