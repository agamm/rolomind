import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { Polar } from "@polar-sh/sdk";
import { env } from "@/lib/env";

export async function GET(request: Request) {
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
        message: "POLAR_ACCESS_TOKEN is not set in environment variables",
        products: []
      }, { status: 200 });
    }

    // Create Polar client
    const polar = new Polar({
      accessToken: env.POLAR_ACCESS_TOKEN,
      server: env.POLAR_SERVER,
    });

    try {
      // Fetch products from Polar
      const productsResponse = await polar.products.list({
        organizationId: undefined, // Will use the default org from the access token
        limit: 100,
      });

      // Also try to fetch the specific product if we can
      let specificProduct = null;
      const configuredProductId = env.POLAR_PRODUCT_ID || null;
      
      if (configuredProductId) {
        try {
          specificProduct = await polar.products.get({
            id: configuredProductId,
          });
        } catch (err) {
          console.error("Error fetching specific product:", err);
        }
      }

      // Get organization info
      let organization = null;
      try {
        const orgs = await polar.organizations.list({ limit: 1 });
        organization = orgs.items?.[0] || null;
      } catch (err) {
        console.error("Error fetching organization:", err);
      }

      return NextResponse.json({
        success: true,
        configuredProductId,
        configuredProductIdSource: configuredProductId ? "POLAR_PRODUCT_ID env var" : "Not configured",
        products: productsResponse.items || [],
        specificProduct,
        organization,
        totalProducts: productsResponse.items?.length || 0,
        polarServer: env.POLAR_SERVER,
        timestamp: new Date().toISOString(),
      });
    } catch (polarError: any) {
      console.error("Polar API error:", polarError);
      return NextResponse.json({
        error: "Polar API error",
        message: polarError.message || "Failed to fetch products from Polar",
        details: polarError.response?.data || polarError,
        products: []
      }, { status: 200 }); // Return 200 to show error details in UI
    }
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}