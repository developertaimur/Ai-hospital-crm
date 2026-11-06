"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  Headset,
  MessageCircle,
  PhoneForwarded,
  Search,
} from "lucide-react";
import { WhatsAppScriptPanel } from "@/components/whatsapp/whatsapp-script-panel";
import { WhatsAppThread } from "@/components/whatsapp/whatsapp-thread";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  bookingOutcomeLabel,
  bookingRef,
  doctorName,
  serviceName,
} from "@/lib/display/lookups";
import { useAuthStore } from "@/lib/store/auth-store";
import { useWhatsAppStore } from "@/lib/store/whatsapp-store";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import { formatKarachi } from "@/lib/time";
import type { DemoState, WhatsAppConversationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: Array<{
  value: "all" | WhatsAppConversationStatus;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active (AI)" },
  { value: "handed_off", label: "Awaiting human" },
  { value: "human_active", label: "Human active" },
  { value: "booked", label: "Booked" },
  { value: "closed", label: "Closed" },
  { value: "abandoned", label: "Abandoned" },
];

const PAYMENT_QUICK_REPLIES = [
  "Please pay via JazzCash to 0300-0000000 and share the screenshot here.",
  "Bank transfer: HBL · Life Care Intl · A/C 1234567890. Reply when done.",
  "Minimum 50% of the fee is required before Admin can confirm your booking.",
];

function statusBadge(
  status: WhatsAppConversationStatus,
): "default" | "success" | "warning" | "secondary" | "destructive" {
  switch (status) {
    case "active":
      return "default";
    case "booked":
      return "success";
    case "handed_off":
    case "human_active":
      return "warning";
    case "abandoned":
      return "destructive";
    default:
      return "secondary";
  }
}

function statusLabel(status: WhatsAppConversationStatus): string {
  switch (status) {
    case "handed_off":
      return "awaiting human";
    case "human_active":
      return "human active";
    default:
      return status.replace("_", " ");
  }
}

interface WhatsAppInboxProps {
  state: DemoState;
  mode: "admin" | "reception";
}

export function WhatsAppInbox({ state, mode }: WhatsAppInboxProps) {
  const isAdmin = mode === "admin";
  const session = useAuthStore((s) => s.session);
  const activeId = useWhatsAppStore((s) => s.activeId);
  const busy = useWhatsAppStore((s) => s.busy);
  const simulate = useWhatsAppStore((s) => s.simulateWhatsAppBooking);
  const advance = useWhatsAppStore((s) => s.advanceActive);
  const takeOver = useWhatsAppStore((s) => s.takeOverConversation);
  const sendStaffReply = useWhatsAppStore((s) => s.sendStaffReply);
  const simulatePatient = useWhatsAppStore((s) => s.simulatePatientFollowUp);

  const [manualSelectedId, setManualSelectedId] = useState<string | null>(null);
  const selectedId = activeId ?? manualSelectedId;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | WhatsAppConversationStatus
  >("all");
  const [draft, setDraft] = useState("");

  const actorUserId = session?.userId ?? "user-admin";
  const actorLabel =
    DEMO_ACCOUNTS.find((a) => a.userId === actorUserId)?.displayName ??
    session?.username ??
    "Staff";

  useEffect(() => {
    if (!activeId) return;
    const timer = window.setInterval(() => {
      void advance();
    }, 1600);
    return () => window.clearInterval(timer);
  }, [activeId, advance]);

  const conversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (state.whatsappConversations ?? [])
      .filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (!q) return true;
        return (
          c.patientName.toLowerCase().includes(q) ||
          c.phoneNational.includes(q) ||
          (c.summary ?? "").toLowerCase().includes(q)
        );
      })
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [state, search, statusFilter]);

  const selected =
    conversations.find((c) => c.id === selectedId) ??
    (state.whatsappConversations ?? []).find((c) => c.id === selectedId) ??
    null;

  const allChats = state.whatsappConversations ?? [];
  const openCount = allChats.filter(
    (c) =>
      c.status === "active" ||
      c.status === "handed_off" ||
      c.status === "human_active",
  ).length;
  const bookedCount = allChats.filter((c) => !!c.appointmentId).length;
  const awaitingHuman = allChats.filter((c) => c.status === "handed_off").length;

  function onSimulate() {
    const created = simulate();
    if (!created) {
      toast({
        title: "Busy",
        description: "Finish the active WhatsApp simulation first.",
      });
      return;
    }
    setManualSelectedId(created.id);
    toast({
      title: "WhatsApp chat started",
      description: `${created.patientName} is messaging the AI agent.`,
    });
  }

  function onTakeOver() {
    if (!selected) return;
    const ok = takeOver(selected.id, actorUserId, actorLabel);
    if (!ok) {
      toast({
        title: "Cannot take over",
        description: "Chat must be awaiting human handoff.",
        variant: "destructive",
      });
      return;
    }
    setManualSelectedId(selected.id);
    toast({
      title: "You took over",
      description: "Continue with payment details as a real staff member.",
    });
  }

  function onSend() {
    if (!selected) return;
    const ok = sendStaffReply(selected.id, draft, actorUserId, actorLabel);
    if (!ok) {
      toast({
        title: "Take over first",
        description: "Human takeover is required before sending staff replies.",
        variant: "destructive",
      });
      return;
    }
    setDraft("");
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(37,211,102,0.14),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(15,118,110,0.08),_transparent_50%)]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Messaging
            </p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              WhatsApp
            </h1>
            <p className="max-w-xl text-sm text-muted">
              {isAdmin
                ? "AI books provisional slots, then hands off to you for payment details. View the script and continue as a human."
                : "View-only monitor of WhatsApp booking chats · AI + human handoffs (demo)."}
            </p>
          </div>
          <Button
            type="button"
            className="gap-1.5 self-start"
            disabled={!!activeId || busy}
            onClick={onSimulate}
          >
            <MessageCircle className="size-4" aria-hidden />
            Simulate WhatsApp booking
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            {
              label: "Open chats",
              value: openCount,
              icon: MessageCircle,
              tone: "text-primary bg-primary/10",
            },
            {
              label: "Awaiting human",
              value: awaitingHuman,
              icon: PhoneForwarded,
              tone: "text-warning bg-warning/10",
            },
            {
              label: "With booking",
              value: bookedCount,
              icon: CalendarCheck2,
              tone: "text-success bg-success/10",
            },
          ] as const
        ).map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums">
                  {card.value}
                </p>
              </div>
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  card.tone,
                )}
              >
                <card.icon className="size-5" aria-hidden />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        className={cn(
          "grid gap-4",
          isAdmin
            ? "xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_minmax(0,0.85fr)]"
            : "lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]",
        )}
      >
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`wa-search-${mode}`}>Search</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <Input
                  id={`wa-search-${mode}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, phone…"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`wa-status-${mode}`}>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(v as "all" | WhatsAppConversationStatus)
                }
              >
                <SelectTrigger id={`wa-status-${mode}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {conversations.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-background px-4 py-10 text-center text-sm text-muted">
              No WhatsApp chats match your filters.
            </p>
          ) : (
            <ul className="max-h-[min(60dvh,32rem)] space-y-2 overflow-y-auto">
              {conversations.map((c) => {
                const active = selected?.id === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setManualSelectedId(c.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all hover:border-primary/30 hover:bg-primary/[0.03]",
                        active
                          ? "border-primary/35 bg-primary/[0.06] shadow-sm"
                          : "border-border bg-background",
                      )}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#128C7E] dark:text-[#25D366]">
                        <MessageCircle className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-foreground">
                            {c.patientName}
                          </p>
                          <Badge variant={statusBadge(c.status)}>
                            {statusLabel(c.status)}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs tabular-nums text-muted">
                          {c.phoneNational} ·{" "}
                          {formatKarachi(c.updatedAt, "dd MMM · hh:mm a")}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs text-muted">
                          {c.messages.at(-1)?.body ?? c.summary ?? "—"}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="flex min-h-[24rem] flex-col rounded-2xl border border-border bg-surface shadow-sm">
          {!selected ? (
            <p className="m-auto px-4 py-12 text-center text-sm text-muted">
              Select a WhatsApp conversation to view the thread
              {isAdmin ? " and continue after handoff." : "."}
            </p>
          ) : (
            <>
              <div className="border-b border-border px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{selected.patientName}</h2>
                  <Badge variant={statusBadge(selected.status)}>
                    {statusLabel(selected.status)}
                  </Badge>
                  {selected.id === activeId ? (
                    <Badge variant="default">AI live</Badge>
                  ) : null}
                  {selected.handoffReason ? (
                    <Badge variant="secondary">
                      {selected.handoffReason.replace("_", " ")}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {selected.phoneNational} ·{" "}
                  {selected.language === "ur" ? "Urdu" : "English"}
                  {selected.bookingOutcome
                    ? ` · ${bookingOutcomeLabel(selected.bookingOutcome)}`
                    : ""}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(37,211,102,0.06),_transparent_55%)] px-3 py-4 sm:px-5">
                <WhatsAppThread conversation={selected} />
              </div>

              <div className="space-y-2 border-t border-border px-4 py-3 text-sm sm:px-5">
                {selected.summary ? (
                  <p className="text-muted">{selected.summary}</p>
                ) : null}
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted">Doctor</dt>
                    <dd>
                      {selected.requestedDoctorId
                        ? doctorName(state, selected.requestedDoctorId)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Service</dt>
                    <dd>
                      {selected.requestedServiceId
                        ? serviceName(state, selected.requestedServiceId)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">When</dt>
                    <dd>
                      {selected.scheduledStartIso
                        ? formatKarachi(
                            selected.scheduledStartIso,
                            "dd MMM yyyy · hh:mm a",
                          )
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Booking</dt>
                    <dd>
                      {selected.appointmentId
                        ? bookingRef(selected.appointmentId)
                        : "—"}
                    </dd>
                  </div>
                </dl>

                {isAdmin ? (
                  <div className="space-y-2 pt-1">
                    {selected.status === "handed_off" ? (
                      <Button
                        type="button"
                        className="w-full gap-1.5"
                        onClick={onTakeOver}
                      >
                        <Headset className="size-4" aria-hidden />
                        Take over for payment details
                      </Button>
                    ) : null}

                    {selected.status === "human_active" ||
                    selected.status === "handed_off" ? (
                      <>
                        <div className="flex flex-wrap gap-1.5">
                          {PAYMENT_QUICK_REPLIES.map((q) => (
                            <Button
                              key={q}
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-auto max-w-full whitespace-normal px-2 py-1 text-left text-[11px]"
                              onClick={() => setDraft(q)}
                            >
                              {q.slice(0, 42)}…
                            </Button>
                          ))}
                        </div>
                        <Textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={3}
                          placeholder="Continue as staff — payment instructions, account details…"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            disabled={!draft.trim()}
                            onClick={onSend}
                          >
                            Send as staff
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={selected.status !== "human_active"}
                            onClick={() => {
                              const ok = simulatePatient(selected.id);
                              if (ok) {
                                toast({
                                  title: "Patient replied",
                                  description: "Demo patient follow-up added.",
                                });
                              }
                            }}
                          >
                            Simulate patient reply
                          </Button>
                        </div>
                      </>
                    ) : null}

                    {!isAdmin ? null : selected.status === "active" ? (
                      <p className="text-xs text-muted">
                        AI script is still running. After handoff you can take
                        over for payment details.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-border bg-background px-3 py-2 text-xs text-muted">
                    Reception is view-only. Admin takes over after AI handoff for
                    payment details.
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        {isAdmin ? (
          <section className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                AI script
              </h2>
              <p className="mt-1 text-xs text-muted">
                Planned demo turns · booking then human handoff for payment
              </p>
            </div>
            {selected ? (
              <WhatsAppScriptPanel conversation={selected} />
            ) : (
              <p className="text-sm text-muted">Select a chat to view its script.</p>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
