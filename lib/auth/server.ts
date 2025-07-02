import { headers } from "next/headers";
import { auth } from "./auth";
import { Polar } from "@polar-sh/sdk";
import { env } from "@/lib/env";
import { db } from "@/db/sqlite";
import { user } from "@/db/sqlite/schema";
import { eq } from "drizzle-orm";

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  return session;
}

export async function isAuthenticated() {
  const session = await getServerSession();
  return !!session?.user;
}

export async function getUser() {
  const session = await getServerSession();
  return session?.user || null;
}

export async function isPayingCustomer() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return false;
  }

  try {
    const polarClient = new Polar({
      accessToken: env.POLAR_ACCESS_TOKEN,
      server: env.POLAR_SERVER,
    });

    // Get customer by email
    const customers = await polarClient.customers.list({
      email: session.user.email,
    });

    if (customers.result.items.length === 0) {
      return false;
    }

    const customer = customers.result.items[0];
    
    // Get subscriptions for this customer
    const subscriptions = await polarClient.subscriptions.list({
      customerId: customer.id,
    });

    return subscriptions.result.items.some(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
}

export async function getCustomerState() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return null;
  }

  try {
    const polarClient = new Polar({
      accessToken: env.POLAR_ACCESS_TOKEN,
      server: env.POLAR_SERVER,
    });

    // Get customer by email
    const customers = await polarClient.customers.list({
      email: session.user.email,
    });

    if (customers.result.items.length === 0) {
      return null;
    }

    const customer = customers.result.items[0];
    
    // Get subscriptions for this customer
    const subscriptions = await polarClient.subscriptions.list({
      customerId: customer.id,
    });

    // Get benefits for the organization
    const benefits = await polarClient.benefits.list({});

    return {
      customer,
      subscriptions: subscriptions.result.items,
      benefits: benefits.result.items,
      activeSubscriptions: subscriptions.result.items.filter(
        (sub) => sub.status === "active" || sub.status === "trialing"
      ),
    };
  } catch (error) {
    console.error("Error getting customer state:", error);
    return null;
  }
}

export async function getUserUsageCap() {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return null;
  }

  try {
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    return userRecord[0]?.usageCapCents || 1000; // Default $10
  } catch (error) {
    console.error("Error getting user usage cap:", error);
    return 1000; // Default $10
  }
}

export async function updateUserUsageCap(newCapCents: number) {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  try {
    await db.update(user)
      .set({ usageCapCents: newCapCents })
      .where(eq(user.id, session.user.id));
    
    return true;
  } catch (error) {
    console.error("Error updating user usage cap:", error);
    throw error;
  }
}

export async function getUserUsageData() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    return null;
  }

  try {
    // Get user's usage cap from database
    const usageCapCents = await getUserUsageCap();

    // Get customer state which includes subscription meters
    const customerState = await getCustomerState();
    
    if (!customerState) {
      return {
        totalCostCents: 0,
        usageCapCents: usageCapCents || 1000,
        usageEvents: [],
      };
    }

    // Calculate total costs from subscription meters
    let totalCostCents = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    const usageEvents: Array<{
      meterName: string;
      consumedUnits: number;
      amount: number;
      meterId: string;
    }> = [];

    // Process all active subscriptions and their meters
    for (const subscription of customerState.activeSubscriptions) {
      if (subscription.meters) {
        for (const meter of subscription.meters) {
          if (meter.amount) {
            totalCostCents += meter.amount; // amount is already in cents
          }
          
          // Track token usage for detailed breakdown
          if (meter.meter.name === "Claude 3.7 Sonnet (Input)") {
            inputTokens = meter.consumedUnits;
          } else if (meter.meter.name === "Claude 3.7 Sonnet (Output)") {
            outputTokens = meter.consumedUnits;
          }
          
          usageEvents.push({
            meterName: meter.meter.name,
            consumedUnits: meter.consumedUnits,
            amount: meter.amount,
            meterId: meter.meterId
          });
        }
      }
    }

    console.log("Usage data calculated:", {
      totalCostCents,
      inputTokens,
      outputTokens,
      usageEvents
    });

    return {
      totalCostCents,
      usageCapCents: usageCapCents || 1000,
      usageEvents,
      inputTokens,
      outputTokens,
    };
  } catch (error) {
    console.error("Error getting user usage data:", error);
    // Return default values if usage data can't be fetched
    const usageCapCents = await getUserUsageCap();
    return {
      totalCostCents: 0,
      usageCapCents: usageCapCents || 1000,
      usageEvents: [],
      inputTokens: 0,
      outputTokens: 0,
    };
  }
}

export async function checkUsageLimit(estimatedCostCents: number = 0) {
  const usageData = await getUserUsageData();
  
  if (!usageData) {
    return { allowed: false, reason: "Unable to fetch usage data" };
  }

  const projectedUsage = usageData.totalCostCents + estimatedCostCents;
  
  if (projectedUsage > usageData.usageCapCents) {
    return { 
      allowed: false, 
      reason: "Usage limit exceeded",
      currentUsage: usageData.totalCostCents,
      usageLimit: usageData.usageCapCents,
      projectedUsage
    };
  }

  return { allowed: true };
}

