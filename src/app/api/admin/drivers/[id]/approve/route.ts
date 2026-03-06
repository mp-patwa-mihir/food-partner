import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
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
    const { isApproved } = await request.json();

    await connectDB();

    const driver = await User.findOneAndUpdate(
      { _id: id, role: UserRole.DELIVERY_PARTNER },
      { isApproved },
      { new: true }
    ).select("-password");

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, driver });
  } catch (error: any) {
    console.error("Admin Driver PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
