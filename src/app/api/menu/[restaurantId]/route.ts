import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const resolvedParams = await params;
    const restaurantId = resolvedParams.restaurantId;

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return NextResponse.json({ error: "Invalid Restaurant ID" }, { status: 400 });
    }

    await connectDB();

    // 1. Fetch the restaurant
    const restaurant = await Restaurant.findById(restaurantId).lean();

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 404 }
      );
    }

    // 2. Fetch categories for this restaurant
    const categories = await MenuCategory.find(
      { restaurant: restaurantId, isActive: true }
    )
      .sort({ name: 1 })
      .lean();

    // 3. Fetch menu items for this restaurant
    const items = await MenuItem.find(
      { restaurant: restaurantId, isAvailable: true }
    ).lean();

    // 4. Group items by category
    const groupedMenu = categories.map((cat) => {
      return {
        category: cat,
        items: items.filter(
          (item) => item.category.toString() === cat._id.toString()
        ),
      };
    });

    return NextResponse.json(
      {
        restaurant: {
            _id: restaurant._id,
            name: restaurant.name,
            description: restaurant.description,
            logo: restaurant.logo,
            coverImage: restaurant.coverImage,
        },
        menu: groupedMenu,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
