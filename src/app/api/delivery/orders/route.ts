import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { headers } from "next/headers";

export async function GET() {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify delivery partner
    if (!userId || userRole !== "DELIVERY_PARTNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    // Fetch orders that are waiting for delivery or already accepted by this driver
    const availableOrders = await Order.find({
      $or: [
        { status: "PREPARING", deliveryPartnerId: { $ne: null } },
        { status: "PREPARING", deliveryPartnerId: null },
        { status: "OUT_FOR_DELIVERY", deliveryPartnerId: userId }
      ]
    })
    .populate("restaurant", "name address")
    .sort({ createdAt: -1 })
    .lean();

    return NextResponse.json({
      success: true,
      data: availableOrders,
    });
  } catch (error: any) {
    console.error("Delivery Orders Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
