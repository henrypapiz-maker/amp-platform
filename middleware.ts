import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect dashboard + v2 routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding") || pathname.startsWith("/knowledge-base") || pathname.startsWith("/api/targets") || pathname.startsWith("/api/evaluations") || pathname.startsWith("/api/evidence") || pathname.startsWith("/api/persona") || pathname.startsWith("/api/weights") || pathname.startsWith("/api/admin") || pathname.startsWith("/api/audit") || pathname.startsWith("/api/knowledge-base") || pathname.startsWith("/api/subscription")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Block AI routes when AI is disabled
  if (pathname.startsWith("/api/ai/")) {
    if (process.env.AI_ENABLED !== "true") {
      return NextResponse.json(
        { error: "AI features are not enabled for this organization." },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/knowledge-base/:path*",
    "/api/targets/:path*",
    "/api/evaluations/:path*",
    "/api/evidence/:path*",
    "/api/persona/:path*",
    "/api/weights/:path*",
    "/api/admin/:path*",
    "/api/audit/:path*",
    "/api/ai/:path*",
    "/api/knowledge-base",
    "/api/knowledge-base/:path*",
    "/api/subscription/:path*",
  ],
};
