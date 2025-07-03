import { auth } from "@/lib/auth/auth";

async function seed() {
  console.log("🌱 Starting database seed...");

  // Only seed in development
  if (process.env.NODE_ENV === "production") {
    console.log("❌ Cannot seed production database");
    process.exit(1);
  }

  try {
    // Try to sign up the test user
    try {
      await auth.api.signUpEmail({
        body: {
          email: "test@gmail.com",
          password: "123123123",
          name: "Test User",
        },
      });

      console.log("✅ Test user created successfully!");
      console.log("📧 Email: test@gmail.com");
      console.log("🔑 Password: 123123123");
    } catch (error) {
      // Check if user already exists
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("already exists") || errorMessage.includes("already registered")) {
        console.log("✅ Test user already exists");
        console.log("📧 Email: test@gmail.com");
        console.log("🔑 Password: 123123123");
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();