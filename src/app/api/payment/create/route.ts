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

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentMethod !== "ONLINE") {
        return NextResponse.json({ error: "Payment creation only allowed for ONLINE payment method" }, { status: 400 });
    }

    // Mock payment creation logic
    // In a real scenario, you would call Razorpay/Stripe API here
    const mockPaymentData = {
      id: `pay_${Math.random().toString(36).substr(2, 9)}`,
      amount: order.totalAmount * 100, // in paisa/cents
      currency: "INR",
      orderId: order._id,
    };

    return NextResponse.json({
      success: true,
      paymentData: mockPaymentData,
      message: "Online payment initialized (Mock)"
    });

  } catch (error: any) {
    console.error("Payment Create POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
