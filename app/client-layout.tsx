"use client";

import { Providers } from "@/components/layout";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}