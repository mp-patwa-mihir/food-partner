import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import MenuCategory from "@/models/MenuCategory";
import MenuItem from "@/models/MenuItem";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

const updateMenuItemSchema = z.object({
  name: z.string().min(1, "Item name cannot be empty").trim().optional(),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative").optional(),
  image: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
  isVeg: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  category: z.string().min(1, "Category ID cannot be empty").optional(),
  stock: z.number().min(0, "Stock cannot be negative").nullable().optional(),
});

async function verifyProviderAndItem(menuItemId: string) {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("x-user-id");
  const userRole = requestHeaders.get("x-user-role");

  if (!userId) {
    return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (userRole !== UserRole.PROVIDER) {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden. Only registered providers can access this." },
        { status: 403 }
      )
    };
  }

  await connectDB();

  const restaurant = await Restaurant.findOne({ owner: userId });
  if (!restaurant) {
    return {
      errorResponse: NextResponse.json(
        { error: "Restaurant not found. Please create a restaurant first." },
        { status: 404 }
      )
    };
  }

  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem) {
    return {
      errorResponse: NextResponse.json(
        { error: "Menu item not found." },
        { status: 404 }
      )
    };
  }

  if (menuItem.restaurant.toString() !== restaurant._id.toString()) {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden. You cannot manage items belonging to another restaurant." },
        { status: 403 }
      )
    };
  }

  return { restaurant, menuItem };
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const resolvedParams = await params;
    const menuItemId = resolvedParams.itemId;

    if (!menuItemId) {
      return NextResponse.json({ error: "Menu item ID is required." }, { status: 400 });
    }

    const { errorResponse, restaurant } = await verifyProviderAndItem(menuItemId);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const parsed = updateMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    if (updates.category) {
      const newCategory = await MenuCategory.findById(updates.category);
      if (!newCategory) {
        return NextResponse.json({ error: "Provided category not found." }, { status: 404 });
      }
      if (newCategory.restaurant.toString() !== restaurant!._id.toString()) {
        return NextResponse.json(
          { error: "Forbidden. The new category does not belong to your restaurant." },
          { status: 403 }
        );
      }
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(
      menuItemId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      { message: "Menu item updated successfully.", menuItem: updatedItem },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const resolvedParams = await params;
    const menuItemId = resolvedParams.itemId;

    if (!menuItemId) {
      return NextResponse.json({ error: "Menu item ID is required." }, { status: 400 });
    }

    const { errorResponse } = await verifyProviderAndItem(menuItemId);
    if (errorResponse) return errorResponse;

    await MenuItem.findByIdAndDelete(menuItemId);

    return NextResponse.json(
      { message: "Menu item deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
