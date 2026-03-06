import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Restaurant from "@/models/Restaurant";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import mongoose from "mongoose";

export async function POST(request: Request) {
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
    const { restaurantId, rating, comment } = await request.json();

    if (!restaurantId || !rating || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json({ error: "Invalid Restaurant ID" }, { status: 400 });
    }

    await connectDB();

    // 1. Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // 2. Create the review (unique index handles duplicate check)
    let review;
    try {
      review = await Review.create({
        userId,
        restaurantId,
        rating,
        comment,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return NextResponse.json({ error: "You have already reviewed this restaurant" }, { status: 400 });
      }
      throw err;
    }

    // 3. Update restaurant average rating and total reviews
    // We use a transaction or just recalculate. For simplicity and performance, 
    // let's fetch all ratings and calculate average. 
    // In production, an aggregation pipeline or incremental update is better.
    
    const reviews = await Review.find({ restaurantId });
    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews;

    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: parseFloat(avgRating.toFixed(1)),
      totalReviews,
    });

    return NextResponse.json({ message: "Review submitted successfully", review }, { status: 201 });
  } catch (error: any) {
    console.error("Error submitting review:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
