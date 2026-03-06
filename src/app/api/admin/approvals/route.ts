import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User, { UserRole } from "@/models/User";
import { headers } from "next/headers";

export async function GET() {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify admin
    if (!userId || userRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const pendingUsers = await User.find({
      role: { $in: [UserRole.PROVIDER, "DELIVERY_PARTNER"] },
      isApproved: false
    })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

    return NextResponse.json({
      success: true,
      data: pendingUsers,
    });
  } catch (error: any) {
    console.error("Admin Fetch Approvals Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
