import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Restaurant from "@/models/Restaurant";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import mongoose from "mongoose";

// GET /api/reviews/[id] - where [id] is restaurantId
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const restaurantId = resolvedParams.id;

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json({ error: "Invalid Restaurant ID" }, { status: 400 });
    }

    await connectDB();

    const reviews = await Review.find({ restaurantId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ reviews }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/reviews/[id] - where [id] is reviewId
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authResult = await verifyToken(token);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authResult.payload.userId;
    const resolvedParams = await params;
    const reviewId = resolvedParams.id;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json({ error: "Invalid Review ID" }, { status: 400 });
    }

    await connectDB();

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Only the author can delete the review
    if (review.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized to delete this review" }, { status: 403 });
    }

    const restaurantId = review.restaurantId;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate rating
    const reviews = await Review.find({ restaurantId });
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews 
      : 0;

    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: parseFloat(avgRating.toFixed(1)),
      totalReviews,
    });

    return NextResponse.json({ message: "Review deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
