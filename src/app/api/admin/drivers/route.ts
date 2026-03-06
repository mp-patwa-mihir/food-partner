import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function GET() {
  try {
    const headersList = await headers();
    const userRole = headersList.get("x-user-role");

    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const drivers = await User.find({ role: UserRole.DELIVERY_PARTNER })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, drivers });
  } catch (error: any) {
    console.error("Admin Drivers GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
