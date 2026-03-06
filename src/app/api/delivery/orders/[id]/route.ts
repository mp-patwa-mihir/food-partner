import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import mongoose from "mongoose";
import { headers } from "next/headers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== "DELIVERY_PARTNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!["OUT_FOR_DELIVERY", "DELIVERED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status update for delivery partner" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If accepting the order, assign the delivery partner
    if (status === "OUT_FOR_DELIVERY") {
      // Basic check: Order must be in PREPARING state to be picked up
      if (order.status !== "PREPARING") {
        return NextResponse.json({ error: "Order is not ready for pickup" }, { status: 400 });
      }
      order.deliveryPartnerId = new mongoose.Types.ObjectId(userId);
    }

    // If delivering, make sure this partner owns it
    if (status === "DELIVERED" && String(order.deliveryPartnerId) !== String(userId)) {
       return NextResponse.json({ error: "You are not assigned to this order" }, { status: 403 });
    }

    order.status = status;
    await order.save();

    // In a real app, emit a socket event here or in a mongoose hook
    // to notify the customer and restaurant. 
    // This will be handled by our socket server when they fetch.

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error("Delivery Update Order Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
