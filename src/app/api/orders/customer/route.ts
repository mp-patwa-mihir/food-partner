import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Restaurant from "@/models/Restaurant";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify customer
    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Limit arbitrary pagination size
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    await connectDB();

    // Fetch orders, paginated, sorted by newest
    const [orders, totalElements] = await Promise.all([
      Order.find({ user: userId })
        .populate({
          path: "restaurant",
          model: Restaurant,
          select: "name logo address city _id", // Only basic public restaurant details, no provider info
        })
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Order.countDocuments({ user: userId }),
    ]);

    // Construct pagination metadata
    const totalPages = Math.ceil(totalElements / safeLimit);

    return NextResponse.json(
      {
        orders,
        pagination: {
          page: safePage,
          limit: safeLimit,
          totalElements,
          totalPages,
          hasNext: safePage < totalPages,
          hasPrev: safePage > 1,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Customer Orders GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
