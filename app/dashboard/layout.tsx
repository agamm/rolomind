import { redirect } from "next/navigation";
import { isAuthenticated, isPayingCustomer } from "@/lib/auth/server";
import { DashboardContent } from "./dashboard-content";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Check authentication server-side
  const isAuth = await isAuthenticated();
  
  if (!isAuth) {
    redirect("/sign-in");
  }

  // Check subscription status server-side
  const isPaying = await isPayingCustomer();
  
  if (!isPaying) {
    redirect("/subscribe");
  }

  return <DashboardContent>{children}</DashboardContent>;
}