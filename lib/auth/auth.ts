import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { polar, checkout, portal, usage } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { db } from "@/db/sqlite";
import { env } from "@/lib/env";

const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.POLAR_SERVER,
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
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
    }),
    nextCookies(), // Must be last in the plugins array
  ],
});