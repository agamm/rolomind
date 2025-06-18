import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/api/auth",
    "/sign-in", 
    "/sign-up",
    "/terms",
    "/privacy",
  ];
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if user has a session cookie (simple check)
  const sessionCookie = request.cookies.get("better-auth.session_token");
  
  if (!sessionCookie) {
    // For API routes, return 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // For all other routes, redirect to sign-in
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Let the actual page/API route validate the session properly
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};