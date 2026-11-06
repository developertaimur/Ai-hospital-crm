"use client";

import Link from "next/link";
import {
  CalendarCheck2,
  CircleDollarSign,
  ClipboardList,
  MessageCircle,
  PhoneForwarded,
  Plus,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Panel } from "@/components/layout/panel";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { formatPkr } from "@/lib/money";
import { formatKarachi, getDemoNow, toKarachiDateKey } from "@/lib/time";

export default function AdminDashboardPage() {
  const { ready, state } = useDemoReady();
  if (!ready || !state) {
    return (
      <p className="text-sm text-muted" role="status">
        Loading dashboard…
      </p>
    );
  }

  const now = getDemoNow();
  const todayKey = toKarachiDateKey(now.toISOString());
  const todayLabel = formatKarachi(now.toISOString(), "EEEE, d MMMM yyyy");
  const todayApts = state.appointments.filter(
    (a) => toKarachiDateKey(a.scheduledStartIso) === todayKey,
  );
  const awaitingPayment = state.appointments.filter(
    (a) => a.status === "awaiting_payment",
  ).length;
  const confirmed = state.appointments.filter(
    (a) => a.status === "confirmed",
  ).length;
  const pendingCallbacks = state.callbacks.filter(
    (c) =>
      c.status === "pending" ||
      c.status === "assigned" ||
      c.status === "in_progress",
  ).length;
  const verifiedPayments = state.payments.filter((p) => p.verified).length;
  const outstanding = state.appointments.filter(
    (a) =>
      a.paymentStatus === "unpaid" ||
      a.paymentStatus === "partial" ||
      a.paymentStatus === "review_required",
  ).length;
  const verifiedTotalPaisa = state.payments
    .filter((p) => p.verified)
    .reduce((sum, p) => sum + p.amountPaisa, 0);
  const whatsappConversations = state.whatsappConversations ?? [];
  const whatsappOpen = whatsappConversations.filter(
    (c) =>
      c.status === "active" ||
      c.status === "handed_off" ||
      c.status === "human_active",
  ).length;
  const whatsappBooked = whatsappConversations.filter(
    (c) => !!c.appointmentId,
  ).length;
  const whatsappAwaitingHuman = whatsappConversations.filter(
    (c) => c.status === "handed_off",
  ).length;

  const primaryStats = [
    {
      href: "/admin/appointments",
      label: "Appointments today",
      value: todayApts.length,
      hint: todayKey,
      icon: ClipboardList,
      tone: "primary" as const,
    },
    {
      href: "/admin/payments",
      label: "Awaiting payment",
      value: awaitingPayment,
      hint: "Provisional holds",
      icon: CircleDollarSign,
      tone: "warning" as const,
    },
    {
      href: "/admin/appointments",
      label: "Confirmed",
      value: confirmed,
      hint: "Ready for arrival",
      icon: CalendarCheck2,
      tone: "success" as const,
    },
    {
      href: "/admin/callbacks",
      label: "Pending callbacks",
      value: pendingCallbacks,
      hint: "Needs follow-up",
      icon: PhoneForwarded,
      tone: "primary" as const,
    },
  ];

  const secondaryStats = [
    {
      href: "/admin/whatsapp",
      label: "WhatsApp open",
      value: whatsappOpen,
      hint: "Live + handed off",
      icon: MessageCircle,
      tone: "primary" as const,
    },
    {
      href: "/admin/whatsapp",
      label: "Need human",
      value: whatsappAwaitingHuman,
      hint: "Payment handoffs",
      icon: MessageCircle,
      tone: "warning" as const,
    },
    {
      href: "/admin/whatsapp",
      label: "WhatsApp bookings",
      value: whatsappBooked,
      hint: "Linked holds",
      icon: MessageCircle,
      tone: "success" as const,
    },
    {
      href: "/admin/payments",
      label: "Verified payments",
      value: verifiedPayments,
      hint: formatPkr(verifiedTotalPaisa),
      icon: ShieldCheck,
      tone: "success" as const,
    },
    {
      href: "/admin/payments",
      label: "Outstanding",
      value: outstanding,
      hint: "Unpaid / review",
      icon: Wallet,
      tone: "warning" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Operations"
        title="Admin overview"
        description={`${todayLabel} · Pakistan Standard Time`}
        badge={<Badge variant="secondary">Demo data</Badge>}
        actions={
          <>
            <Badge variant="default" className="gap-1.5 px-2.5 py-1 font-medium">
              <span className="size-1.5 rounded-full bg-primary" />
              Live metrics
            </Badge>
            <Button asChild size="sm" className="rounded-xl">
              <Link href="/admin/new-appointment">
                <Plus className="size-4" aria-hidden />
                New appointment
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {primaryStats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel
          title="Channels & ledger"
          description="WhatsApp handoffs and payment clearance at a glance."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {secondaryStats.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </Panel>

        <Panel
          title="Quick actions"
          description="Jump into common Admin workflows."
        >
          <div className="flex flex-col gap-2">
            {(
              [
                { href: "/admin/appointments", label: "Today’s appointments" },
                { href: "/admin/whatsapp", label: "WhatsApp inbox" },
                { href: "/admin/payments", label: "Verify payments" },
                { href: "/admin/callbacks", label: "Callbacks queue" },
                { href: "/admin/doctors", label: "Doctors & services" },
                { href: "/admin/demo-tools", label: "Demo tools" },
              ] as const
            ).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-border/80 bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/25 hover:bg-accent-soft hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
