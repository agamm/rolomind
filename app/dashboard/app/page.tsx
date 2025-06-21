import { redirect } from "next/navigation";
import { isPayingCustomer } from "@/lib/auth/server";
import { ContactManagerContent } from "@/components/contact/manager-content"

export default async function Home() {
  // Check subscription status
  const isPaying = await isPayingCustomer();
  
  if (!isPaying) {
    redirect("/subscribe");
  }

  return <ContactManagerContent />
}
