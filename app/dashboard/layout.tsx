import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/server";
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

  // The dashboard content with TopNav will be shown for all authenticated users
  // This allows access to billing page even for non-paying customers
  return <DashboardContent>{children}</DashboardContent>;
}