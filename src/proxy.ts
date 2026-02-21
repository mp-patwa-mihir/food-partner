import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { UserRole } from "@/constants/roles";

// ─── Edge-safe JWT verification ───────────────────────────────────────────────
// IMPORTANT: Do NOT import from @/lib/auth, @/lib/db, or @/models/* here.
// Those modules pull in mongoose → mongodb → Node.js crypto, which is
// unavailable in the Edge Runtime.
// We use the Web Crypto API via jose (crypto.subtle) directly instead.

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const userId = payload.userId as string | undefined;
    const role   = payload.role   as UserRole | undefined;
    if (!userId || !role) return null;
    return { userId, role };
  } catch {
    return null; // expired or invalid
  }
}

// ─── Route Config ─────────────────────────────────────────────────────────────

const PROTECTED_PREFIXES = ["/admin", "/provider", "/dashboard"];

const ROLE_MAP: Record<string, UserRole[]> = {
  "/admin":    [UserRole.ADMIN],
  "/provider": [UserRole.PROVIDER],
  "/dashboard":[UserRole.CUSTOMER],
};

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/unauthorized",
  "/api/auth",
  "/_next",
  "/favicon.ico",
];

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ① Public routes — always pass through (prevents redirect loops)
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ② Unprotected routes — pass through
  if (!PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ③ Read HttpOnly token cookie
  const token = request.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ④ Verify JWT using Web Crypto API (jose) — edge-compatible
  const payload = await verifyJWT(token);

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "session_expired");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    return response;
  }

  // ⑤ Role check
  const allowed = Object.entries(ROLE_MAP).find(([prefix]) =>
    pathname.startsWith(prefix)
  )?.[1];

  if (allowed && !allowed.includes(payload.role)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // ⑥ Pass user context via headers to Server Components
  const headers = new Headers(request.headers);
  headers.set("x-user-id",   payload.userId);
  headers.set("x-user-role", payload.role);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
