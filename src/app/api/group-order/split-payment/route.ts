import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GroupOrder from "@/models/GroupOrder";

export async function POST(req: Request) {
  try {
    const { groupOrderId, splitType } = await req.json();

    if (!groupOrderId || !splitType) {
      return NextResponse.json(
        { success: false, message: "groupOrderId and splitType are required." },
        { status: 400 }
      );
    }

    if (!["EQUAL", "BY_ITEM"].includes(splitType)) {
         return NextResponse.json(
        { success: false, message: "splitType must be EQUAL or BY_ITEM." },
        { status: 400 }
      );
    }

    await connectDB();

    const groupOrder = await GroupOrder.findById(groupOrderId).populate("participants.userId", "name");
    
    if (!groupOrder) {
      return NextResponse.json(
        { success: false, message: "Group order not found." },
        { status: 404 }
      );
    }

    // Explicitly run save to ensure subtotals and totalAmount are up to date
    // before calculating
    await groupOrder.save();
    
    const participantCount = groupOrder.participants.length;
    let splitSummary: any[] = [];

    if (splitType === "EQUAL") {
       const equalShare = groupOrder.totalAmount / participantCount;
       splitSummary = groupOrder.participants.map(p => ({
           userId: p.userId,
           name: p.name,
           amountOwed: equalShare,
           originalSubtotal: p.subtotal
       }));
    } else if (splitType === "BY_ITEM") {
        splitSummary = groupOrder.participants.map(p => ({
           userId: p.userId,
           name: p.name,
           amountOwed: p.subtotal,
           originalSubtotal: p.subtotal
       }));
    }

    return NextResponse.json(
      {
        success: true,
        data: {
            totalAmount: groupOrder.totalAmount,
            splitType,
            participantCount,
            splits: splitSummary
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GroupOrder Split Payment API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
