"use client";

import type { ReactNode } from "react";
import { ClipboardList, PhoneCall, PhoneIncoming } from "lucide-react";
import { IncomingCallPopup } from "@/components/calls/incoming-call-popup";
import { TestCallButton } from "@/components/calls/test-call-button";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/layout/role-guard";

const nav: NavItem[] = [
  { href: "/reception", label: "Incoming Calls", icon: PhoneIncoming },
  { href: "/reception/bookings", label: "Bookings status", icon: ClipboardList },
  { href: "/reception/callbacks", label: "Callbacks status", icon: PhoneCall },
];

export default function ReceptionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RoleGuard allowed="reception">
      <AppShell
        title="Reception"
        subtitle="AI call monitor · view-only"
        nav={nav}
        navExtra={<TestCallButton />}
      >
        {children}
        <IncomingCallPopup />
      </AppShell>
    </RoleGuard>
  );
}
