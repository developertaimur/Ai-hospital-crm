"use client";

import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { RoleGuard } from "@/components/layout/role-guard";

const nav: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/new-appointment", label: "New appointment" },
  { href: "/admin/doctors", label: "Doctors" },
  { href: "/admin/patients", label: "Patients" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/calls", label: "Calls" },
  { href: "/admin/whatsapp", label: "WhatsApp" },
  { href: "/admin/callbacks", label: "Callbacks" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/demo-tools", label: "Tools" },
];

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RoleGuard allowed="admin">
      <AppShell
        title="Administration"
        subtitle="Islamabad · Operations"
        nav={nav}
      >
        {children}
      </AppShell>
    </RoleGuard>
  );
}
