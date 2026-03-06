import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import mongoose from "mongoose";

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

    // 1. Fetch the restaurant (must be approved and open)
    const restaurant = await Restaurant.findOne(
      { _id: restaurantId },
      // Exclude internal/sensitive data
      { __v: 0, owner: 0, isApproved: 0, createdAt: 0, updatedAt: 0 }
    ).lean();

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 404 }
      );
    }

    // 2. Fetch active categories for this restaurant
    const categories = await MenuCategory.find(
      { restaurant: restaurantId, isActive: true },
      { __v: 0, restaurant: 0, isActive: 0, createdAt: 0, updatedAt: 0 }
    )
      .sort({ name: 1 })
      .lean();

    // 3. Fetch available menu items for this restaurant
    const items = await MenuItem.find(
      { restaurant: restaurantId, isAvailable: true },
      { __v: 0, restaurant: 0, isAvailable: 0, createdAt: 0, updatedAt: 0 }
    ).lean();

    // 4. Group items by category
    const groupedCategories = categories.map((cat) => {
      return {
        category: cat,
        items: items.filter(
          (item) => item.category.toString() === cat._id.toString()
        ),
      };
    });

    return NextResponse.json(
      {
        restaurant,
        categories: groupedCategories,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching restaurant details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
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
    const body = await request.json();

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedRestaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedRestaurant }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating restaurant:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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

    const deletedRestaurant = await Restaurant.findByIdAndDelete(restaurantId);

    if (!deletedRestaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // TODO: Optionally delete associated MenuItems and Categories
    await MenuItem.deleteMany({ restaurant: restaurantId });
    await MenuCategory.deleteMany({ restaurant: restaurantId });

    return NextResponse.json({ message: "Restaurant deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting restaurant:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

