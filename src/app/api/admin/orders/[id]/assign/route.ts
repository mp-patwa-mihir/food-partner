import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const userRole = headersList.get("x-user-role");

    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { driverId } = await request.json();

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 });
    }

    await connectDB();

    // Verify driver exists and is a delivery partner
    const driver = await User.findOne({ _id: driverId, role: UserRole.DELIVERY_PARTNER });
    if (!driver) {
      return NextResponse.json({ error: "Valid delivery partner not found" }, { status: 404 });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { 
        deliveryPartnerId: driverId,
        status: "CONFIRMED" // Automatically confirm when driver is assigned if it was PENDING
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Admin Order Assign PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
