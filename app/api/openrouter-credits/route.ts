import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";
import { db } from "@/db/sqlite";
import { user } from "@/db/sqlite/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's OpenRouter API key
    const userData = await db.select().from(user).where(eq(user.id, currentUser.id)).limit(1);
    const userRecord = userData[0];
    
    if (!userRecord?.openrouterApiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 404 });
    }

    // Fetch credits from OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/credits', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userRecord.openrouterApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        error: "Failed to fetch credits from OpenRouter",
        details: errorData.message || response.statusText
      }, { status: response.status });
    }

    const creditsData = await response.json();
    
    return NextResponse.json(creditsData);
  } catch (error) {
    console.error("Error fetching OpenRouter credits:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}