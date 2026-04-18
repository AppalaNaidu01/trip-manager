import { AppShell } from "@/components/AppShell";
import { Protected } from "@/components/Protected";
import { DashboardSearchProvider } from "@/contexts/DashboardSearchContext";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Protected>
      <DashboardSearchProvider>
        <AppShell>{children}</AppShell>
      </DashboardSearchProvider>
    </Protected>
  );
}
