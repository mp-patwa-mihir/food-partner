import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User, { UserRole } from "@/models/User";
import { headers } from "next/headers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isApproved } = body;

    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify admin
    if (!userId || userRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isApproved },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User ${isApproved ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error: any) {
    console.error("Admin Update Approval Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
