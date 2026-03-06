import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const userRole = headersList.get("x-user-role");

    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    await connectDB();

    const item = await MenuItem.findByIdAndDelete(id);

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Menu item deleted successfully" });
  } catch (error: any) {
    console.error("Admin Menu DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
