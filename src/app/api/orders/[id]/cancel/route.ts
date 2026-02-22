import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
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

    // Verify customer role
    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Ensure order belongs to customer
    if (order.user.toString() !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to cancel this order" },
        { status: 403 }
      );
    }

    // Allow cancel only if status = PENDING
    if (order.status !== "PENDING") {
      return NextResponse.json(
        {
          error: `Order cannot be cancelled because it is already in ${order.status} state. Cancellations are only permitted when the order is PENDING.`,
        },
        { status: 400 } // Bad Request
      );
    }

    // Update status safely
    order.status = "CANCELLED";
    await order.save(); // Model hook handles the timestamp update automatically

    return NextResponse.json(
      { message: "Order cancelled successfully", order },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Customer Order Cancel PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
