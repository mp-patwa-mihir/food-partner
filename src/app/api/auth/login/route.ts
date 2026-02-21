import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { comparePassword } from "@/lib/password";
import { generateToken } from "@/lib/auth";
import User, { UserRole } from "@/models/User";
import { loginSchema } from "@/schemas/auth.schema";

export async function POST(req: NextRequest) {
  // ── 1. Parse & Validate ────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const { email, password } = parsed.data;

  // ── 2. Connect to DB ───────────────────────────────────────────────────────
  try {
    await connectDB();
  } catch {
    // Do not leak DB details
    return NextResponse.json(
      { success: false, message: "Service temporarily unavailable" },
      { status: 503 }
    );
  }

  // ── 3. Find user (include password for comparison) ─────────────────────────
  const user = await User.findOne({ email }).select("+password");

  // Use generic message for both missing user and wrong password
  // to prevent user enumeration attacks
  const INVALID_MSG = "Invalid email or password";

  if (!user) {
    return NextResponse.json(
      { success: false, message: INVALID_MSG },
      { status: 401 }
    );
  }

  // ── 4. Compare password ────────────────────────────────────────────────────
  const passwordMatch = await comparePassword(password, user.password);
  if (!passwordMatch) {
    return NextResponse.json(
      { success: false, message: INVALID_MSG },
      { status: 401 }
    );
  }

  // ── 5. Blocked check ───────────────────────────────────────────────────────
  if (user.isBlocked) {
    return NextResponse.json(
      { success: false, message: "Your account has been suspended. Please contact support." },
      { status: 403 }
    );
  }

  // ── 6. PROVIDER approval check ─────────────────────────────────────────────
  // Providers must be approved by an admin before they can log in
  if (user.role === UserRole.PROVIDER && !user.isApproved) {
    return NextResponse.json(
      {
        success: false,
        message: "Your provider account is pending admin approval.",
      },
      { status: 403 }
    );
  }

  // ── 7. Generate JWT ────────────────────────────────────────────────────────
  const token = await generateToken(String(user._id), user.role);

  // ── 8. Return token + safe user object ────────────────────────────────────
  const response = NextResponse.json(
    {
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id:         user._id,
          name:       user.name,
          email:      user.email,
          role:       user.role,
          isApproved: user.isApproved,
        },
      },
    },
    { status: 200 }
  );

  // Also set token as an HttpOnly cookie for SSR/middleware consumption
  response.cookies.set("token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 7, // 7 days in seconds
    path:     "/",
  });

  return response;
}
