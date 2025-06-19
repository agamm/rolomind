import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export async function middleware(request: NextRequest) {
  // console.log(request)
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

  try {
    // Check session using auth API
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session) {
      // For API routes, return 401
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      // For all other routes, redirect to sign-in
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  } catch (error) {
    console.error("Error checking session in middleware:", error);
    // If there's an error, redirect to sign-in for safety
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Let the actual page/API route validate subscription properly
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ],
};