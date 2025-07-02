import { NextResponse } from "next/server";
import { getUserUsageData, isAuthenticated } from "@/lib/auth/server";

export async function GET() {
  try {
    // Check if user is authenticated
    if (!await isAuthenticated()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get usage data from Polar and database
    const usageData = await getUserUsageData();

    if (!usageData) {
      return NextResponse.json({ error: "Unable to fetch usage data" }, { status: 500 });
    }

    // Return response with no-cache headers to ensure fresh data
    const response = NextResponse.json(usageData);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error("Error in usage API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}