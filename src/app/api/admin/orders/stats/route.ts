import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import User, { UserRole } from "@/models/User";
import Restaurant from "@/models/Restaurant";
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

    // 1. Order Stats
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    let pending = 0;
    let preparing = 0;
    let active = 0;

    stats.forEach((stat) => {
      const status = stat._id;
      const count = stat.count;

      if (status === "PENDING") pending += count;
      if (status === "PREPARING") preparing += count;
      
      // Active states
      if (["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(status)) {
        active += count;
      }
    });

    // 2. Revenue (Assuming total field exists on delivered orders)
    const revenueStats = await Order.aggregate([
      { $match: { status: "DELIVERED" } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
    ]);
    const totalRevenue = revenueStats[0]?.totalRevenue || 0;

    // 3. User & Restaurant Counts
    const totalUsers = await User.countDocuments({ role: "CUSTOMER" });
    const totalRestaurants = await Restaurant.countDocuments({ isApproved: true });
    
    // 4. Pending Approvals
    const pendingApprovals = await User.countDocuments({
      role: { $in: [UserRole.PROVIDER, "DELIVERY_PARTNER"] },
      isApproved: false
    });

    // 5. Total Orders
    const totalOrders = await Order.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        active,
        pending,
        preparing,
        totalRevenue,
        totalUsers,
        totalRestaurants,
        pendingApprovals,
        totalOrders
      },
    });
  } catch (error: any) {
    console.error("Admin Order Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
