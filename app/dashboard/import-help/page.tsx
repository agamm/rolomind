import { redirect } from "next/navigation";
import { isPayingCustomer } from "@/lib/auth/server";
import { ImportHelpTab } from "@/components/import";
import { BackButton } from "@/components/ui/back-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import Help - Rolomind",
  description: "Learn how to import your contacts from LinkedIn and Google",
};

export default async function ImportHelpPage() {
  // Check subscription status
  const isPaying = await isPayingCustomer();
  
  if (!isPaying) {
    redirect("/subscribe");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton href="/dashboard/app" />
      </div>
      <ImportHelpTab />
    </div>
  );
}