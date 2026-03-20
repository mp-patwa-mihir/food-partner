import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";
import Order from "@/models/Order";
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
        { success: false, message: "groupOrderId is required." },
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

    if (String(groupOrder.createdBy) !== userId) {
      return NextResponse.json(
        { success: false, message: "Only the creator can checkout the group order." },
        { status: 403 }
      );
    }

    if (groupOrder.status !== "OPEN") {
       return NextResponse.json(
        { success: false, message: "Group order is not open or already checked out." },
        { status: 400 }
      );
    }

    // 1. Lock the group order
    groupOrder.status = "CHECKOUT";
    
    // 2. Consolidate items for the main Order
    const consolidatedItemsMap: Record<string, any> = {};
    
    groupOrder.participants.forEach(p => {
        p.items.forEach(item => {
            const key = String(item.menuItemId);
            if (consolidatedItemsMap[key]) {
                 consolidatedItemsMap[key].quantity += item.quantity;
            } else {
                 consolidatedItemsMap[key] = {
                     menuItemId: item.menuItemId,
                     name: item.name,
                     price: item.price,
                     quantity: item.quantity
                 };
            }
        });
    });

    const consolidatedItems = Object.values(consolidatedItemsMap);

    // 3. Create the standard Order
    // NOTE: Hardcoding a dummy address for now as it's not provided in the request
    const newOrder = new Order({
        user: userId,
        restaurant: groupOrder.restaurantId,
        items: consolidatedItems,
        totalAmount: groupOrder.totalAmount, // Relies on GroupOrder pre-save hook having updated this
        status: "PENDING",
        deliveryAddress: {
            street: "123 Group Order St", // Placeholder
            city: "City",
            pincode: "123456"
        },
        paymentMethod: "ONLINE", // Assuming online payment for split group orders
        paymentStatus: "PENDING"
    });

    await Promise.all([
        groupOrder.save(),
        newOrder.save()
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Group order checked out successfully",
        data: {
             groupOrder,
             orderId: newOrder._id
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GroupOrder Checkout API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
