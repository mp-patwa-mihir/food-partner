import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requestHeaders = await headers();
    const userRole = requestHeaders.get("x-user-role");

    // 1. Verify User is an ADMIN
    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // 2. Resolve dynamic route params
    const resolvedParams = await params;
    const { id: restaurantId } = resolvedParams;

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required." },
        { status: 400 }
      );
    }

    await connectDB();

    // 3. Find and verify the restaurant
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found." },
        { status: 404 }
      );
    }

    if (restaurant.isApproved) {
      return NextResponse.json(
        { error: "Restaurant is already approved." },
        { status: 400 } // Bad Request
      );
    }

    // 4. Update the approval status
    restaurant.isApproved = true;
    await restaurant.save();

    return NextResponse.json(
      {
        message: "Restaurant approved successfully",
        restaurant,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving restaurant:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
