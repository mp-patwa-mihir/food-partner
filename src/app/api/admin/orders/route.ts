import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Restaurant from "@/models/Restaurant";
import User from "@/models/User";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify admin
    if (!userId || userRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");

    const safeLimit = Math.min(Math.max(1, limit), 50);
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    await connectDB();

    const query: any = {};
    if (status) {
      query.status = status.toUpperCase();
    }

    // Fetch all orders with all related info
    const [orders, totalElements] = await Promise.all([
      Order.find(query)
        .populate({
          path: "user",
          model: User,
          select: "name email phone",
        })
        .populate({
          path: "restaurant",
          model: Restaurant,
          select: "name",
        })
        .populate({
          path: "deliveryPartnerId",
          model: User,
          select: "name phone",
        })
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Order.countDocuments(query),
    ]);

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
    console.error("Admin Orders GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
