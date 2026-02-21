import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";
import { UserRole } from "@/constants/roles";
import { headers } from "next/headers";

const createRestaurantSchema = z.object({
  name: z.string().min(2, "Restaurant name must be at least 2 characters"),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  logo: z.string().url().optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    const requestHeaders = await headers();
    const userId = requestHeaders.get("x-user-id");
    const userRole = requestHeaders.get("x-user-role");

    // 1. Verify User is Authenticated and is a PROVIDER
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userRole !== UserRole.PROVIDER) {
      return NextResponse.json(
        { error: "Forbidden. Only registered providers can create restaurants." },
        { status: 403 }
      );
    }

    await connectDB();

    // 2. Check if the provider already has a restaurant
    // Assuming 1 restaurant per provider for MVP to keep logic simple.
    const existingRestaurant = await Restaurant.findOne({ owner: userId });
    if (existingRestaurant) {
      return NextResponse.json(
        { error: "You already have a registered restaurant." },
        { status: 409 } // Conflict
      );
    }

    // 3. Parse and Validate Request Body
    const body = await req.json();
    const parsed = createRestaurantSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const validatedData = parsed.data;

    // 4. Create the Restaurant
    // Note: isApproved defaults to false via the Mongoose schema.
    const newRestaurant = await Restaurant.create({
      ...validatedData,
      owner: userId,
      // Ensure these are secure defaults regardless of input
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
    const requestHeaders = await headers();
    const userId = requestHeaders.get("x-user-id");
    const userRole = requestHeaders.get("x-user-role");

    // 1. Verify User is Authenticated and is a PROVIDER
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userRole !== UserRole.PROVIDER) {
      return NextResponse.json(
        { error: "Forbidden. Only registered providers can access this." },
        { status: 403 }
      );
    }

    await connectDB();

    // 2. Fetch the specific provider's restaurant
    const restaurant = await Restaurant.findOne({ owner: userId });

    // 3. If none exists, requirements state to return null
    if (!restaurant) {
      return NextResponse.json({ restaurant: null }, { status: 200 });
    }

    // 4. Return the secure data
    return NextResponse.json({ restaurant }, { status: 200 });
  } catch (error) {
    console.error("Error fetching provider restaurant:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
