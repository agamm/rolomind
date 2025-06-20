import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;
  
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
  
  const sessionCookie = getSessionCookie(request);
  const isLoggedIn = !!sessionCookie;
  
  if (!isLoggedIn) {
    // For API routes, return 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // For all other routes, redirect to sign-in
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Let the actual page/API route validate subscription properly
  return NextResponse.next();
}

export const config = {
  // runtime: 'nodejs',
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ],
};