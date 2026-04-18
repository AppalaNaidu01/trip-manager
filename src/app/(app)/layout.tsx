import { AppShell } from "@/components/AppShell";
import { Protected } from "@/components/Protected";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Protected>
      <AppShell>{children}</AppShell>
    </Protected>
  );
}
