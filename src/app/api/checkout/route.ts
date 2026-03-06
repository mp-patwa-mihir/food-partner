import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Cart from "@/models/Cart";
import Order from "@/models/Order";
import { headers } from "next/headers";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const userId = headersList.get("x-user-id");
    const userRole = headersList.get("x-user-role");

    // Only customers can checkout
    if (!userId || userRole !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { deliveryAddress } = body;

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.pincode) {
      return NextResponse.json({ error: "Valid delivery address is required" }, { status: 400 });
    }

    await connectDB();

    // Fetch the user's cart
    const cart = await Cart.findOne({ user: userId }).populate("items.menuItem");
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Convert cart items to order items
    let totalAmount = 0;
    const orderItems = cart.items.map((item: any) => {
      // menuItem is populated, but we just need its id, name, price.
      // Wait, if it wasn't populated fully, we might need to rely on the price in the DB
      // but cart model usually only has menuItem ref and quantity.
      // We assume it's populated.
      const price = item.menuItem.price;
      const quantity = item.quantity;
      totalAmount += price * quantity;

      return {
        menuItemId: item.menuItem._id,
        name: item.menuItem.name,
        price: price,
        quantity: quantity,
      };
    });

    // Create the order
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const newOrder = new Order({
        user: userId,
        restaurant: cart.restaurant,
        items: orderItems,
        totalAmount: totalAmount,
        status: "PENDING",
        deliveryAddress,
      });

      await newOrder.save({ session });

      // Clear the cart
      await Cart.deleteOne({ _id: cart._id }).session(session);

      await session.commitTransaction();
      session.endSession();

      // In a real app we would fire socket event here: new_order
      // to the restaurant.

      return NextResponse.json({
        success: true,
        orderId: newOrder._id,
        message: "Order placed successfully",
      });
    } catch (txError) {
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }

  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
