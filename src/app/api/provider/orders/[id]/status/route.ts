import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order, { OrderStatus } from "@/models/Order";
import Restaurant from "@/models/Restaurant";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["PREPARING"],
  PREPARING: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  REJECTED: [], // Terminal state
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify provider role
    if (!userId || userRole !== UserRole.PROVIDER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "New status is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Ensure the provider owns a restaurant
    const restaurant = await Restaurant.findOne({ owner: userId });
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found for this provider" },
        { status: 404 }
      );
    }

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Ensure order belongs to the provider's restaurant
    if (order.restaurant.toString() !== restaurant._id.toString()) {
      return NextResponse.json(
        { error: "Order does not belong to your restaurant" },
        { status: 403 }
      );
    }

    const currentStatus = order.status as OrderStatus;
    const requestedStatus = status.toUpperCase() as OrderStatus;

    // Reject invalid transitions based on current state
    const validNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!validNextStates.includes(requestedStatus)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatus} to ${requestedStatus}. Allowed transitions are: ${
            validNextStates.length > 0 ? validNextStates.join(", ") : "None (Terminal State)"
          }`,
        },
        { status: 400 }
      );
    }

    // Update status safely (immutability hook will permit this check since only status is changing)
    order.status = requestedStatus;
    await order.save();

    // Emit Socket events if socket server is initialized
    if ((global as any).io) {
      const io = (global as any).io;
      const payload = {
        orderId: order._id.toString(),
        status: order.status,
        updatedAt: order.updatedAt
      };

      io.to(`user:${order.user.toString()}`).emit("order_status_update", payload);
      io.to("admin:global").emit("admin_order_update", payload);
    }

    return NextResponse.json(
      { message: "Order status updated successfully", order },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Provider Order Status PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
