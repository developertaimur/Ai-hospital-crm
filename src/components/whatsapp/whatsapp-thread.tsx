"use client";

import { Bot, Headset, UserRound } from "lucide-react";
import type { WhatsAppConversation } from "@/lib/types";
import { formatKarachi } from "@/lib/time";
import { cn } from "@/lib/utils";

interface WhatsAppThreadProps {
  conversation: WhatsAppConversation;
  className?: string;
}

export function WhatsAppThread({
  conversation,
  className,
}: WhatsAppThreadProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {conversation.messages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background px-3 py-8 text-center text-sm text-muted">
          Waiting for messages…
        </p>
      ) : (
        conversation.messages.map((m) => {
          if (m.role === "system") {
            return (
              <p
                key={m.id}
                className="px-2 text-center text-[11px] font-medium text-muted"
              >
                {m.body}
              </p>
            );
          }
          const patient = m.role === "patient";
          const staff = m.role === "staff";
          return (
            <div
              key={m.id}
              className={cn(
                "flex gap-2",
                patient ? "justify-end" : "justify-start",
              )}
            >
              {!patient ? (
                <span
                  className={cn(
                    "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full",
                    staff
                      ? "bg-warning/15 text-warning"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {staff ? (
                    <Headset className="size-3.5" aria-hidden />
                  ) : (
                    <Bot className="size-3.5" aria-hidden />
                  )}
                </span>
              ) : null}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                  patient
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : staff
                      ? "rounded-bl-md border border-warning/30 bg-warning/10 text-foreground"
                      : "rounded-bl-md border border-border bg-background text-foreground",
                )}
              >
                {staff ? (
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                    {m.authorLabel ?? "Staff"}
                  </p>
                ) : m.role === "agent" ? (
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    AI agent
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px] tabular-nums",
                    patient ? "text-primary-foreground/70" : "text-muted",
                  )}
                >
                  {formatKarachi(m.createdAt, "hh:mm a")}
                </p>
              </div>
              {patient ? (
                <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-muted ring-1 ring-border">
                  <UserRound className="size-3.5" aria-hidden />
                </span>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
