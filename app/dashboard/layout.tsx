import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/server";
import { DashboardContent } from "./dashboard-content";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Check authentication server-side with error handling
  try {
    const isAuth = await isAuthenticated();
    
    if (!isAuth) {
      redirect("/sign-in");
    }
  } catch (error) {
    console.error('Server-side auth check failed:', error);
    // Continue to render and let client-side handle authentication
    // This prevents server errors from blocking the layout
  }

  // The dashboard content with TopNav will be shown
  // Client-side authentication will handle redirects if needed
  return <DashboardContent>{children}</DashboardContent>;
}