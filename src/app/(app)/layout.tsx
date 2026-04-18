import { AppShell } from "@/components/AppShell";
import { Protected } from "@/components/Protected";
import { TripChromeProvider } from "@/contexts/TripChromeContext";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Protected>
      <TripChromeProvider>
        <AppShell>{children}</AppShell>
      </TripChromeProvider>
    </Protected>
  );
}
