import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import Restaurant from "@/models/Restaurant";
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

    const menuItems = await MenuItem.find()
      .populate({
        path: "restaurantId",
        model: Restaurant,
        select: "name",
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, menuItems });
  } catch (error: any) {
    console.error("Admin Menu GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
