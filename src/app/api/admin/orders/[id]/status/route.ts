import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order, { OrderStatus } from "@/models/Order";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify admin role - Admins can override status
    if (!userId || userRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: orderId } = await params;
    const body = await req.json();
    const { status, paymentStatus } = body;

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (status) {
      order.status = status.toUpperCase() as OrderStatus;
    }
    
    if (paymentStatus) {
      order.paymentStatus = paymentStatus.toUpperCase() as any;
    }

    await order.save();

    // Emit Socket events if socket server is initialized
    if ((global as any).io) {
      const io = (global as any).io;
      const payload = {
        orderId: order._id.toString(),
        status: order.status,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt
      };

      io.to(`user:${order.user.toString()}`).emit("order_status_update", payload);
      io.to(`provider:${order.restaurant.toString()}`).emit("order_update", payload);
      io.to("admin:global").emit("admin_order_update", payload);
    }

    return NextResponse.json(
      { message: "Order updated successfully by admin", order },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Admin Order Update PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
