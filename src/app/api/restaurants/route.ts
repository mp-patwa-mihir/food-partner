import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Restaurant from "@/models/Restaurant";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // 1. Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    // 2. Build the query object
    // Mandatory constraints for public viewing:
    const query: any = {
      isApproved: true,
      isOpen: true,
    };

    // 3. Optional filters
    const city = searchParams.get("city");
    if (city) {
      query.city = { $regex: new RegExp(city, "i") };
    }

    const cuisine = searchParams.get("cuisine");
    if (cuisine) {
      query.cuisine = { $in: [new RegExp(cuisine, "i")] };
    }

    const location = searchParams.get("location");
    if (location) {
      query.location = { $regex: new RegExp(location, "i") };
    }

    const search = searchParams.get("search");
    if (search) {
      // Search by restaurant name or cuisine
      query.$or = [
        { name: { $regex: new RegExp(search, "i") } },
        { cuisine: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // 4. Execute query with projection to exclude internal fields
    const projection = {
      __v: 0,
      owner: 0,
      isApproved: 0,
      createdAt: 0,
      updatedAt: 0,
    };

    const [restaurants, total] = await Promise.all([
      Restaurant.find(query, projection)
        .sort({ rating: -1, totalReviews: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Restaurant.countDocuments(query),
    ]);

    // 5. Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        data: restaurants,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching public restaurants:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const { name, description, location, cuisine, image, city, state, pincode, owner } = body;

    if (!name || !owner) {
      return NextResponse.json({ error: "Name and owner are required" }, { status: 400 });
    }

    const newRestaurant = await Restaurant.create({
      name,
      description,
      location,
      cuisine: Array.isArray(cuisine) ? cuisine : [cuisine],
      image,
      city,
      state,
      pincode,
      owner,
      isApproved: false, // Default to false for manual approval
    });

    return NextResponse.json({ data: newRestaurant }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating restaurant:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

