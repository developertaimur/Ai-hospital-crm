"use client";

import type { WhatsAppConversation } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WhatsAppScriptPanelProps {
  conversation: WhatsAppConversation;
}

export function WhatsAppScriptPanel({ conversation }: WhatsAppScriptPanelProps) {
  const turns = conversation.scriptTurns ?? [];
  const progress = conversation.scriptProgress ?? conversation.messages.filter(
    (m) => m.role !== "staff",
  ).length;

  if (turns.length === 0) {
    return (
      <p className="text-xs text-muted">
        No AI script snapshot stored for this chat.
      </p>
    );
  }

  return (
    <ol className="space-y-1.5">
      {turns.map((turn, index) => {
        const done = index < progress;
        const current = index === progress && conversation.status === "active";
        return (
          <li
            key={`${turn.role}-${index}`}
            className={cn(
              "rounded-lg border px-2.5 py-2 text-xs",
              current
                ? "border-primary/35 bg-primary/[0.06]"
                : done
                  ? "border-border bg-background"
                  : "border-dashed border-border bg-background/60 text-muted",
            )}
          >
            <p className="font-semibold uppercase tracking-wide">
              {turn.role}
              {turn.createsBooking ? " · book" : ""}
              {turn.handOff ? " · handoff" : ""}
              {current ? " · now" : done ? " · done" : ""}
            </p>
            <p className="mt-0.5 leading-snug">{turn.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
