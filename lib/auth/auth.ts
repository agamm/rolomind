import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { polar, checkout, portal, usage } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { db } from "@/db/sqlite";
import { env } from "@/lib/env";

// Create polar client only if access token is available
const polarClient = env.POLAR_ACCESS_TOKEN ? new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.POLAR_SERVER,
}) : null;

// Create plugins array conditionally
const plugins = [];

// Add polar plugin only if client is available
if (polarClient) {
  plugins.push(
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "1d51dafc-0a3f-4ed6-9b36-af44a8e15884",
              slug: "AI-Usage"
            }
          ],
          successUrl: "/subscribe/success?checkout_id={CHECKOUT_ID}",
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
      ],
    })
  );
}

// nextCookies must be last
plugins.push(nextCookies());

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET || "fallback-secret-for-build-time-only",
  emailAndPassword: {
    enabled: true,
  },
  plugins,
});