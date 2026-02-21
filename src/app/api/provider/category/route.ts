import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import MenuCategory from "@/models/MenuCategory";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
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
        { error: "Forbidden. Only registered providers can create categories." },
        { status: 403 }
      );
    }

    // 2. Parse and Validate Request Body
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name: categoryName } = parsed.data;

    await connectDB();

    // 3. Fetch the provider's restaurant to ensure they have one
    const restaurant = await Restaurant.findOne({ owner: userId });
    
    if (!restaurant) {
      return NextResponse.json(
        { error: "You must create a restaurant before adding categories." },
        { status: 404 }
      );
    }

    // 4. Check for duplicate categories directly
    // (Though the DB index protects against this, checking here gives a better error message)
    const existingCategory = await MenuCategory.findOne({ 
      restaurant: restaurant._id, 
      name: { $regex: new RegExp(`^${categoryName}$`, "i") } // case-insensitive check
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: `A category named "${categoryName}" already exists for your restaurant.` },
        { status: 409 } // Conflict
      );
    }

    // 5. Create the Category
    const newCategory = await MenuCategory.create({
      name: categoryName,
      restaurant: restaurant._id,
      isActive: true, // Default
    });

    return NextResponse.json(
      {
        message: "Menu category created successfully.",
        category: newCategory,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // 6. Handle MongoDB duplicate key error explicitly (MongoServerError: E11000)
    // In case the RegExp check missed it due to exotic characters or race conditions
    if (error.code === 11000) {
        return NextResponse.json(
            { error: "A category with this name already exists." },
            { status: 409 }
        );
    }

    console.error("Error creating menu category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
