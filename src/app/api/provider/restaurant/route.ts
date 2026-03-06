import { NextResponse } from "next/server";
import { z } from "zod";
import Restaurant from "@/models/Restaurant";
import { getProviderContext } from "@/lib/provider-auth";

const restaurantSchema = z.object({
  name: z.string().min(2, "Restaurant name must be at least 2 characters"),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  logo: z.string().url().optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
});

const updateRestaurantSchema = restaurantSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update the restaurant.",
  });

export async function POST(req: Request) {
  try {
    const context = await getProviderContext({ allowMissingRestaurant: true });
    if ("errorResponse" in context) return context.errorResponse;

    if (context.restaurant) {
      return NextResponse.json(
        { error: "You already have a registered restaurant." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const parsed = restaurantSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const validatedData = parsed.data;

    const newRestaurant = await Restaurant.create({
      ...validatedData,
      owner: context.userId,
      isApproved: false,
      isOpen: true,
      rating: 0,
      totalReviews: 0,
    });

    return NextResponse.json(
      {
        message: "Restaurant created successfully. Waiting for admin approval.",
        restaurant: newRestaurant,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating restaurant:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const context = await getProviderContext({ allowMissingRestaurant: true });
    if ("errorResponse" in context) return context.errorResponse;

    return NextResponse.json({ restaurant: context.restaurant ?? null }, { status: 200 });
  } catch (error) {
    console.error("Error fetching provider restaurant:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const context = await getProviderContext();
    if ("errorResponse" in context) return context.errorResponse;
    const restaurant = context.restaurant;

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found. Please create a restaurant first." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateRestaurantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    restaurant.set(parsed.data);
    await restaurant.save();

    return NextResponse.json(
      {
        message: "Restaurant updated successfully.",
        restaurant,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating provider restaurant:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
