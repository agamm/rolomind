import { headers } from "next/headers";
import { auth } from "./auth";
import { Polar } from "@polar-sh/sdk";
import { env } from "@/lib/env";
import { CreditCostType } from "@/lib/credit-costs";

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

export async function getUserCredits() {
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
    
    // Get customer meters
    const meters = await polarClient.customerMeters.list({
      customerId: customer.id,
    });

    // Find the Credits meter
    const creditsMeter = meters.result.items.find(
      (item) => item.meter.name === 'Credits' || item.meter.name.toLowerCase() === 'credits'
    );

    if (!creditsMeter) {
      return { used: 0, remaining: 0, total: 0 };
    }

    return {
      used: creditsMeter.consumedUnits || 0,
      remaining: creditsMeter.balance || 0,
      total: creditsMeter.creditedUnits || 0,
    };
  } catch (error) {
    console.error("Error fetching user credits:", error);
    return null;
  }
}

export async function consumeCredits(credits: CreditCostType) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    console.error("No authenticated user for credit tracking");
    return { success: false, error: "No authenticated user" };
  }

  try {
    const polarClient = new Polar({
      accessToken: env.POLAR_ACCESS_TOKEN,
      server: env.POLAR_SERVER,
    });

    const result = await polarClient.events.ingest({
      events: [{
        name: 'credits',
        externalCustomerId: session.user.id,
        metadata: {
          credits: credits,
        },
      }],
    });

    console.log("Credits tracked successfully:", { credits, user: session.user.email });
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to track credits:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}