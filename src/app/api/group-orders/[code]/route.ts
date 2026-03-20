import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";
import User from "@/models/User";
import { headers } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    await connectDB();

    const groupOrder = await GroupOrder.findOne({ inviteCode: code })
      .populate("restaurant", "name logo rating")
      .populate("items.user", "name");

    if (!groupOrder) {
      return NextResponse.json(
        { success: false, message: "Group order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: groupOrder,
    });
  } catch (error: any) {
    console.error("Group Order GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const headersList = await headers();
    const userId = headersList.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { menuItemId, name, price, quantity, action } = await req.json();

    await connectDB();

    const groupOrder = await GroupOrder.findOne({ inviteCode: code });
    if (!groupOrder) {
      return NextResponse.json(
        { success: false, message: "Group order not found" },
        { status: 404 }
      );
    }

    if (groupOrder.status !== "COLLECTING") {
      return NextResponse.json(
        { success: false, message: "Group order is no longer collecting items" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    const userName = user?.name || "Anonymous";

    if (action === "ADD") {
      // Check if user already has this item, if so increment
      // @ts-ignore
      const existingItemIndex = groupOrder.items.findIndex(
        (item: any) => 
          String(item.menuItemId) === menuItemId && 
          String(item.user) === userId
      );

      if (existingItemIndex > -1) {
        // @ts-ignore
        groupOrder.items[existingItemIndex].quantity += quantity;
      } else {
        // @ts-ignore
        groupOrder.items.push({
          user: userId as any,
          userName,
          menuItemId: menuItemId as any,
          name,
          price,
          quantity,
        });
      }
    } else if (action === "UPDATE") {
      // @ts-ignore
      const itemIndex = groupOrder.items.findIndex(
        (item: any) => 
          String(item.menuItemId) === menuItemId && 
          String(item.user) === userId
      );

      if (itemIndex > -1) {
        if (quantity <= 0) {
          // @ts-ignore
          groupOrder.items.splice(itemIndex, 1);
        } else {
          // @ts-ignore
          groupOrder.items[itemIndex].quantity = quantity;
        }
      } else {
        return NextResponse.json(
          { success: false, message: "Item not found in your selection" },
          { status: 404 }
        );
      }
    } else if (action === "REMOVE") {
        // @ts-ignore
        groupOrder.items = groupOrder.items.filter(
            (item: any) => !(String(item.menuItemId) === menuItemId && String(item.user) === userId)
        );
    }

    await groupOrder.save();

    const populatedOrder = await GroupOrder.findById(groupOrder._id)
      .populate("restaurant", "name logo rating")
      .populate("items.user", "name");

    // Broadcast update via global socket
    if (globalThis.__socketIoServer__) {
      globalThis.__socketIoServer__
        .to(`groupOrder:${groupOrder._id}`)
        .emit(`group-order-updated:${groupOrder._id}`, populatedOrder);
    }

    return NextResponse.json({
      success: true,
      message: "Group order updated",
      data: populatedOrder || groupOrder,
    });
  } catch (error: any) {
    console.error("Group Order PATCH Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
