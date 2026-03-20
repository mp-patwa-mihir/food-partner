import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";
import { generateInviteCode } from "@/lib/utils";
import { headers } from "next/headers";
import { UserRole } from "@/constants/roles";

export async function POST(req: Request) {
  try {
    // 1. Get user context from headers (set by proxy middleware if it existed, otherwise null)
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    console.log("[GroupOrder API] Session:", { userId, userRole });

    // 2. Validate session
    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in as a customer." },
        { status: 403 }
      );
    }

    // 3. Parse and validate body
    const { restaurantId } = await req.json();
    if (!restaurantId) {
      return NextResponse.json(
        { success: false, message: "Restaurant ID is required." },
        { status: 400 }
      );
    }

    console.log("[GroupOrder API] About to connect to DB");
    await connectDB();
    console.log("[GroupOrder API] DB connected");

    const inviteCode = generateInviteCode();
    console.log("[GroupOrder API] Invite code generated:", inviteCode);

    const groupOrder = new GroupOrder({
      creator: userId,
      restaurant: restaurantId,
      inviteCode,
      items: [],
      status: "COLLECTING",
      totalAmount: 0,
    });
    console.log("[GroupOrder API] GroupOrder object created");

    try {
      console.log("[GroupOrder API] About to save GroupOrder");
      await groupOrder.save();
      console.log("[GroupOrder API] GroupOrder saved");
    } catch (saveErr:any) {
      console.error("[GroupOrder API] Save Error:", saveErr);
      throw saveErr;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Group order created successfully",
        data: {
          groupOrderId: groupOrder._id,
          inviteCode: groupOrder.inviteCode,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[GroupOrder API] POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
