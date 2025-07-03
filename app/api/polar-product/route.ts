import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { Polar } from "@polar-sh/sdk";
import { env } from "@/lib/env";

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Polar is configured
    if (!env.POLAR_ACCESS_TOKEN) {
      return NextResponse.json({ 
        error: "Polar not configured",
        message: "POLAR_ACCESS_TOKEN is not set in environment variables"
      }, { status: 500 });
    }

    if (!env.POLAR_PRODUCT_ID) {
      return NextResponse.json({ 
        error: "Product not configured",
        message: "POLAR_PRODUCT_ID is not set in environment variables"
      }, { status: 500 });
    }

    // Create Polar client
    const polar = new Polar({
      accessToken: env.POLAR_ACCESS_TOKEN,
      server: env.POLAR_SERVER,
    });

    try {
      // Fetch the specific product
      const productResponse = await polar.products.get({
        id: env.POLAR_PRODUCT_ID,
      });

      // Get the first price amount
      const firstPrice = productResponse?.prices?.[0];
      const price = firstPrice?.priceAmount || 0;

      return NextResponse.json({
        id: productResponse.id,
        name: productResponse.name,
        description: productResponse.description,
        price,
        recurringInterval: productResponse.recurringInterval,
      });
    } catch (polarError: unknown) {
      console.error("Polar API error:", polarError);
      return NextResponse.json({
        error: "Polar API error",
        message: (polarError as Error).message || "Failed to fetch product from Polar",
        details: (polarError as Record<string, unknown>)?.response || polarError,
      }, { status: 404 });
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}