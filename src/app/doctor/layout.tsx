"use client";

import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/layout/role-guard";

const nav: NavItem[] = [
  { href: "/doctor", label: "Today" },
  { href: "/doctor/week", label: "Week" },
  { href: "/doctor/availability", label: "Availability" },
];

export default function DoctorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RoleGuard allowed="doctor">
      <AppShell title="Doctor" subtitle="Schedule & arrivals" nav={nav}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
