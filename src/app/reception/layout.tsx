"use client";

import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/layout/role-guard";

const nav: NavItem[] = [
  { href: "/reception", label: "Today" },
  { href: "/reception/new-appointment", label: "New appointment" },
  { href: "/reception/awaiting-payment", label: "Awaiting payment" },
  { href: "/reception/callbacks", label: "Callbacks" },
  { href: "/reception/notifications", label: "Notifications" },
  { href: "/reception/availability", label: "Availability" },
  { href: "/reception/ai-config", label: "AI config" },
];

export default function ReceptionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RoleGuard allowed="reception">
      <AppShell title="Reception" subtitle="Front desk" nav={nav}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
