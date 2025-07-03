import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { polar, checkout, portal, usage } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { db } from "@/db/sqlite";
import { env } from "@/lib/env";
import { Resend } from "resend";

// Create resend client
const resend = new Resend(env.RESEND_API_KEY);

// Create polar client only if access token is available
const polarClient = env.POLAR_ACCESS_TOKEN ? new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.POLAR_SERVER,
}) : null;

// Create plugins array conditionally
const plugins = [];

// Add polar plugin only if client is available
if (polarClient) {
  if (!env.POLAR_PRODUCT_ID) {
    throw new Error("POLAR_PRODUCT_ID environment variable is required when POLAR_ACCESS_TOKEN is set");
  }
  
  plugins.push(
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: env.POLAR_PRODUCT_ID,
              slug: "rolomind-cloud"
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
    sendResetPassword: async ({ user, url }) => {
      // Better-auth already checks if user exists before calling this
      // This function is only called for existing users
      await resend.emails.send({
        from: "no-reply@mail.rolomind.com",
        to: user.email,
        subject: "Reset your password",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>Hello ${user.name || 'there'},</p>
            <p>You requested to reset your password. Click the link below to proceed:</p>
            <a href="${url}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="background-color: #f4f4f5; padding: 8px; border-radius: 4px; word-break: break-all;">${url}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
    },
  },
  plugins,
});