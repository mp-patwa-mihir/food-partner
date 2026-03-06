import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Driver from "@/models/Driver";
import { headers } from "next/headers";

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

    // 1. Verify the order belongs to this driver
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.deliveryPartnerId?.toString() !== userId) {
      return NextResponse.json({ error: "You are not assigned to this order" }, { status: 403 });
    }

    // 2. Update order status
    order.status = "DELIVERED";
    // For COD orders, payment is collected on delivery — mark it complete
    if (order.paymentMethod === "COD") {
      order.paymentStatus = "COMPLETED";
    }
    await order.save();

    // 3. Update Driver profile
    await Driver.findOneAndUpdate(
      { userId },
      { 
        $set: { currentOrder: null, availability: true } 
      }
    );

    return NextResponse.json({
      success: true,
      message: "Order marked as delivered",
      data: order
    });
  } catch (error: any) {
    console.error("Order Deliver Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
