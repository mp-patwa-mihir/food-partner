import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Driver from "@/models/Driver";
import { headers } from "next/headers";
import mongoose from "mongoose";

export async function GET() {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify driver role
    if (!userId || userRole !== "DELIVERY_PARTNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    // 1. Get driver profile to check current order
    const driver = await Driver.findOne({ userId });

    // 2. Fetch orders:
    // - Orders that are ready for pickup (PREPARING) and NOT yet assigned
    // - OR orders already assigned to THIS driver (OUT_FOR_DELIVERY)
    // Note: Once a driver has a currentOrder, we might still show it in the list.
    
    const orders = await Order.find({
      $or: [
        { status: { $in: ["CONFIRMED", "PREPARING"] }, deliveryPartnerId: null },
        { status: "OUT_FOR_DELIVERY", deliveryPartnerId: new mongoose.Types.ObjectId(userId) }
      ]
    })
    .populate("restaurant", "name address")
    .populate("user", "name phone")
    .sort({ createdAt: -1 })
    .lean();

    return NextResponse.json({
      success: true,
      data: {
        orders,
        driverProfile: driver
      },
    });
  } catch (error: any) {
    console.error("Driver Orders Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
