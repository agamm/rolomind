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

export async function getUserApiKeys() {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    return null;
  }

  try {
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const userData = userRecord[0];
    return {
      openrouterApiKey: userData?.openrouterApiKey,
      openaiApiKey: userData?.openaiApiKey,
    };
  } catch (error) {
    console.error("Error getting user API keys:", error);
    return null;
  }
}

export async function updateUserApiKeys(openrouterApiKey?: string, openaiApiKey?: string) {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  try {
    const updateData: { openrouterApiKey?: string; openaiApiKey?: string } = {};
    
    if (openrouterApiKey !== undefined) {
      updateData.openrouterApiKey = openrouterApiKey;
    }
    
    if (openaiApiKey !== undefined) {
      updateData.openaiApiKey = openaiApiKey;
    }

    await db.update(user)
      .set(updateData)
      .where(eq(user.id, session.user.id));
    
    return true;
  } catch (error) {
    console.error("Error updating user API keys:", error);
    throw error;
  }
}

