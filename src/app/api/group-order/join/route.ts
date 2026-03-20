import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";
import User from "@/models/User";
import { headers } from "next/headers";
import { UserRole } from "@/constants/roles";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in as a customer." },
        { status: 403 }
      );
    }

    const { groupOrderId } = await req.json();
    if (!groupOrderId) {
      return NextResponse.json(
        { success: false, message: "Group Order ID is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const groupOrder = await GroupOrder.findById(groupOrderId);
    if (!groupOrder) {
      return NextResponse.json(
        { success: false, message: "Group order not found." },
        { status: 404 }
      );
    }

    if (groupOrder.status !== "OPEN") {
       return NextResponse.json(
        { success: false, message: "Group order is not open for joining." },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json(
            { success: false, message: "User not found." },
            { status: 404 }
        );
    }

    const isExistingParticipant = groupOrder.participants.some(
        (p) => String(p.userId) === userId
    );

    if (isExistingParticipant) {
        return NextResponse.json(
            { success: true, message: "Already joined", data: groupOrder }
        );
    }

    groupOrder.participants.push({
        userId: userId as any,
        name: user.name,
        items: [],
        subtotal: 0,
        paymentStatus: "PENDING"
    });

    await groupOrder.save();

    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined group order",
        data: groupOrder,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GroupOrder Join API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
