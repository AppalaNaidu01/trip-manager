import { AppShell } from "@/components/AppShell";
import { Protected } from "@/components/Protected";
import { DashboardSearchProvider } from "@/contexts/DashboardSearchContext";
import { TripChromeProvider } from "@/contexts/TripChromeContext";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Protected>
      <DashboardSearchProvider>
        <TripChromeProvider>
          <AppShell>{children}</AppShell>
        </TripChromeProvider>
      </DashboardSearchProvider>
    </Protected>
  );
}
