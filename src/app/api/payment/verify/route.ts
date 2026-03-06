import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { orderId, paymentId, status } = await req.json();

    if (!orderId || !paymentId) {
      return NextResponse.json({ error: "Order ID and Payment ID are required" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Mock verification logic
    // In a real scenario, you would verify the signature from the payment gateway
    if (status === "success" || status === "COMPLETED") {
      order.paymentStatus = "COMPLETED";
      await order.save();

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        order
      });
    } else {
      order.paymentStatus = "FAILED";
      await order.save();

      return NextResponse.json({
        success: false,
        message: "Payment verification failed",
        order
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Payment Verify POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
