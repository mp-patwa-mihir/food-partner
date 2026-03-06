import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Driver from "@/models/Driver";
import { headers } from "next/headers";
import mongoose from "mongoose";

export async function PUT(req: NextRequest) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== "DELIVERY_PARTNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    await connectDB();

    // 1. Check if driver already has an active order
    const driver = await Driver.findOne({ userId });
    if (driver?.currentOrder) {
      return NextResponse.json({ error: "You already have an active delivery" }, { status: 400 });
    }

    // 2. Check if order is still available
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PREPARING" || order.deliveryPartnerId) {
      return NextResponse.json({ error: "Order is no longer available" }, { status: 400 });
    }

    // 3. Assign driver to order and update status
    order.deliveryPartnerId = new mongoose.Types.ObjectId(userId!) as any;
    order.status = "OUT_FOR_DELIVERY";
    await order.save();

    // 4. Update Driver profile
    if (driver) {
      driver.currentOrder = orderId;
      driver.availability = false;
      await driver.save();
    } else {
      // Create driver entry if it doesn't exist (safety fallback)
      await Driver.create({
        userId,
        name: "Driver", // Placeholder, should be synced
        phone: "N/A",
        vehicleType: "N/A",
        availability: false,
        currentOrder: orderId
      });
    }

    return NextResponse.json({
      success: true,
      message: "Order accepted successfully",
      data: order
    });
  } catch (error: any) {
    console.error("Order Accept Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
