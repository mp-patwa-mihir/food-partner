import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

const createMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required").trim(),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  image: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
  isVeg: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  category: z.string().min(1, "Category ID is required"),
  stock: z.number().min(0, "Stock cannot be negative").nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const requestHeaders = await headers();
    const userId = requestHeaders.get("x-user-id");
    const userRole = requestHeaders.get("x-user-role");

    // 1. Verify User is Authenticated and is a PROVIDER
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userRole !== UserRole.PROVIDER) {
      return NextResponse.json(
        { error: "Forbidden. Only registered providers can create menu items." },
        { status: 403 }
      );
    }

    // 2. Parse and Validate Request Body First
    const body = await req.json();
    const parsed = createMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { category: categoryId, ...itemData } = parsed.data;

    await connectDB();

    // 3. Ensure the provider has a restaurant
    const restaurant = await Restaurant.findOne({ owner: userId });
    
    if (!restaurant) {
      return NextResponse.json(
        { error: "You must create a restaurant before adding menu items." },
        { status: 404 }
      );
    }

    // 4. Ensure the Category exists and belongs to the *same* restaurant
    const category = await MenuCategory.findById(categoryId);

    if (!category) {
      return NextResponse.json(
        { error: "Menu category not found." },
        { status: 404 }
      );
    }

    if (category.restaurant.toString() !== restaurant._id.toString()) {
      return NextResponse.json(
        { error: "Category mismatch. This category does not belong to your restaurant." },
        { status: 403 } // Forbidden mapping attempt
      );
    }

    // 5. Create the Menu Item
    const newMenuItem = await MenuItem.create({
      ...itemData,
      category: category._id,
      restaurant: restaurant._id,
      // Fallback defaults in case they were omitted in the request
      isAvailable: itemData.isAvailable ?? true,
      stock: itemData.stock ?? null,
    });

    return NextResponse.json(
      {
        message: "Menu item created successfully.",
        menuItem: newMenuItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
