import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Restaurant from "@/models/Restaurant";
import MenuItem from "@/models/MenuItem";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    // Fetch user's orders, sorted by newest first
    const orders = await Order.find({ user: userId })
      .populate("restaurant", "name address coverImage logo")
      .populate("deliveryPartnerId", "name phone")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, orders },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Fetch Orders GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Verify customer
    if (!userId || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { deliveryAddress, paymentMethod, deliveryFee, taxRate } = body;

    // We need a delivery address to place an order
    if (
      !deliveryAddress ||
      !deliveryAddress.street ||
      !deliveryAddress.city ||
      !deliveryAddress.pincode
    ) {
      return NextResponse.json(
        { error: "Complete delivery address is required" },
        { status: 400 }
      );
    }

    if (!paymentMethod || !["COD", "ONLINE"].includes(paymentMethod)) {
       return NextResponse.json(
         { error: "Valid payment method is required" },
         { status: 400 }
       );
    }

    await connectDB();

    // Fetch cart
    const cart = await Cart.findOne({ user: userId });

    // Validate cart not empty
    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Ensure restaurant still approved / open
    const restaurant = await Restaurant.findById(cart.restaurant);
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant no longer exists" },
        { status: 404 }
      );
    }

    if (!restaurant.isApproved || !restaurant.isOpen) {
      return NextResponse.json(
        { error: "Restaurant is currently closed or unavailable" },
        { status: 400 }
      );
    }

    // Verify all menu items in the cart are still available and exist
    const menuItemIds = cart.items.map((item: any) => item.menuItem);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

    // Create a map for quick availability lookup
    const menuItemsMap = new Map(
      menuItems.map((item: any) => [item._id.toString(), item])
    );

    // Calculate final amount including delivery fee and taxes sent from checkout
    const safeDeliveryFee = typeof deliveryFee === "number" && deliveryFee >= 0 ? deliveryFee : 0;
    const safeTaxRate = typeof taxRate === "number" && taxRate >= 0 && taxRate <= 1 ? taxRate : 0;
    const finalTotalAmount = cart.totalAmount + safeDeliveryFee + (cart.totalAmount * safeTaxRate);

    // Create order (snapshot everything)
    const newOrder = new Order({
      user: userId,
      restaurant: restaurant._id,
      items: cart.items.map((item: any) => ({
        menuItemId: item.menuItem, // Mapping from Cart's 'menuItem' to Order's 'menuItemId'
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalAmount: finalTotalAmount,
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod,
      deliveryAddress: {
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        pincode: deliveryAddress.pincode,
      },
    });

    // We can use a MongoDB transaction to ensure the order is created AND the cart is deleted atomically
    const session = await mongoose.startSession();
    session.startTransaction();

    let savedOrder;
    try {
      savedOrder = await newOrder.save({ session });
      
      // Delete cart after successful order creation
      await Cart.findByIdAndDelete(cart._id, { session });
      
      await session.commitTransaction();
    } catch (txnError) {
      await session.abortTransaction();
      throw txnError; 
    } finally {
      session.endSession();
    }

    // Emit Socket events if socket server is initialized
    if ((global as any).io) {
      const io = (global as any).io;
      const payload = {
        orderId: savedOrder._id.toString(),
        restaurantId: restaurant._id.toString(),
        totalAmount: savedOrder.totalAmount,
        createdAt: savedOrder.createdAt
      };

      io.to(`provider:${restaurant._id.toString()}`).emit("new_order", payload);
      io.to("admin:global").emit("admin_new_order", payload);
    }

    return NextResponse.json(
      { message: "Order placed successfully", order: savedOrder },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create Order POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
