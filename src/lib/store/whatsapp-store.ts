"use client";

import { create } from "zustand";
import {
  PATIENT_FOLLOWUP_REPLIES,
  WHATSAPP_BOOKING_SCRIPTS,
  type WhatsAppBookingScript,
} from "@/lib/mock/whatsapp-scripts";
import * as repo from "@/lib/mock/repository";
import { withDemoRepo, useDemoStore } from "@/lib/store/demo-store";
import type {
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppScriptTurnSnapshot,
} from "@/lib/types";
import { formatKarachi, getDemoNow } from "@/lib/time";
import { formatPkr } from "@/lib/money";
import { bookingRef, doctorName, serviceName } from "@/lib/display/lookups";
import { id } from "@/lib/utils";
import { normalizePkMobile } from "@/lib/phone";

interface WhatsAppStore {
  activeId: string | null;
  scriptCursor: number;
  busy: boolean;
  simulateWhatsAppBooking: (
    script?: WhatsAppBookingScript,
  ) => WhatsAppConversation | null;
  advanceActive: () => Promise<void>;
  takeOverConversation: (
    conversationId: string,
    actorUserId: string,
    actorLabel: string,
  ) => boolean;
  sendStaffReply: (
    conversationId: string,
    body: string,
    actorUserId: string,
    actorLabel: string,
  ) => boolean;
  simulatePatientFollowUp: (conversationId: string, body?: string) => boolean;
  clearActive: () => void;
}

function nowIso(): string {
  return getDemoNow().toISOString();
}

function phoneParts(national: string): { e164: string; national: string } {
  const n = normalizePkMobile(national);
  if (n.ok && n.e164 && n.national) {
    return { e164: n.e164, national: n.national };
  }
  return { e164: `+92${national.replace(/^0/, "")}`, national };
}

function toScriptSnapshot(
  script: WhatsAppBookingScript,
): WhatsAppScriptTurnSnapshot[] {
  return script.turns.map((t) => ({
    role: t.role,
    body: t.body,
    createsBooking: t.createsBooking,
    handOff: t.handOff,
  }));
}

function patchConversation(
  conversationId: string,
  patch: Partial<WhatsAppConversation> | ((c: WhatsAppConversation) => WhatsAppConversation),
): WhatsAppConversation | null {
  const demo = useDemoStore.getState();
  if (!demo.state) return null;
  const list = demo.state.whatsappConversations ?? [];
  const current = list.find((c) => c.id === conversationId);
  if (!current) return null;
  const next =
    typeof patch === "function" ? patch(current) : { ...current, ...patch };
  demo.applyState(repo.upsertWhatsAppConversationSync(demo.state, next));
  return next;
}

export const useWhatsAppStore = create<WhatsAppStore>((set, get) => ({
  activeId: null,
  scriptCursor: 0,
  busy: false,

  simulateWhatsAppBooking: (script) => {
    const demo = useDemoStore.getState();
    if (!demo.state) return null;
    if (get().activeId) return null;

    const chosen =
      script ??
      WHATSAPP_BOOKING_SCRIPTS[
        Math.floor(Math.random() * WHATSAPP_BOOKING_SCRIPTS.length)
      ]!;
    const phones = phoneParts(chosen.phoneNational);
    const started = nowIso();
    const conversation: WhatsAppConversation = {
      id: id("wa"),
      patientName: chosen.patientName,
      phoneE164: phones.e164,
      phoneNational: phones.national,
      language: chosen.language,
      status: "active",
      messages: [],
      scriptTurns: toScriptSnapshot(chosen),
      scriptProgress: 0,
      requestedDoctorId: chosen.requestedDoctorId,
      requestedServiceId: chosen.requestedServiceId,
      bookingOutcome: chosen.bookingOutcome,
      summary: chosen.summary,
      handedOffToAdmin: false,
      createdAt: started,
      updatedAt: started,
    };

    demo.applyState(
      repo.upsertWhatsAppConversationSync(demo.state, conversation),
    );

    pendingScripts.set(conversation.id, chosen);
    set({ activeId: conversation.id, scriptCursor: 0 });
    return conversation;
  },

  advanceActive: async () => {
    const { activeId, scriptCursor, busy } = get();
    if (!activeId || busy) return;
    const script = pendingScripts.get(activeId);
    const demo = useDemoStore.getState();
    if (!script || !demo.state) return;

    const turn = script.turns[scriptCursor];
    if (!turn) {
      set({ activeId: null, scriptCursor: 0 });
      pendingScripts.delete(activeId);
      return;
    }

    set({ busy: true });
    try {
      let state = demo.state;
      let conv = (state.whatsappConversations ?? []).find(
        (c) => c.id === activeId,
      );
      if (!conv) return;

      const msg: WhatsAppMessage = {
        id: id("wam"),
        role: turn.role,
        body: turn.body,
        createdAt: nowIso(),
      };
      conv = {
        ...conv,
        messages: [...conv.messages, msg],
        scriptProgress: scriptCursor + 1,
        updatedAt: nowIso(),
      };
      state = repo.upsertWhatsAppConversationSync(state, conv);
      demo.applyState(state);

      if (
        turn.createsBooking &&
        script.requestedDoctorId &&
        script.requestedServiceId
      ) {
        try {
          const result = await withDemoRepo((adapter) =>
            repo.finalizeWhatsAppBooking(adapter, {
              conversationId: activeId,
              patientName: script.patientName,
              phoneNational: phoneParts(script.phoneNational).national,
              doctorId: script.requestedDoctorId!,
              serviceId: script.requestedServiceId!,
              locale: script.language,
              clientRequestId: id("wareq"),
            }),
          );

          const latest = useDemoStore.getState().state;
          if (latest) {
            const live = (latest.whatsappConversations ?? []).find(
              (c) => c.id === activeId,
            );
            if (live) {
              const fee =
                latest.doctorServices.find(
                  (d) =>
                    d.doctorId === script.requestedDoctorId &&
                    d.serviceId === script.requestedServiceId,
                )?.feePaisa ?? 0;
              const confirmMsg: WhatsAppMessage = {
                id: id("wam"),
                role: "agent",
                body: `Booking ref ${bookingRef(result.appointmentId)} · ${doctorName(latest, script.requestedDoctorId!)} · ${serviceName(latest, script.requestedServiceId!)} · ${formatKarachi(result.scheduledStartIso, "dd MMM · hh:mm a")} · Fee ${formatPkr(fee)}.`,
                createdAt: nowIso(),
              };
              demo.applyState(
                repo.upsertWhatsAppConversationSync(latest, {
                  ...live,
                  messages: [...live.messages, confirmMsg],
                  summary: script.summary,
                  scriptProgress: scriptCursor + 1,
                  updatedAt: nowIso(),
                }),
              );
            }
          }
        } catch {
          patchConversation(activeId, (live) => ({
            ...live,
            status: "handed_off",
            handedOffToAdmin: true,
            handoffReason: "slot_unavailable",
            bookingOutcome: "forwarded_to_admin",
            summary:
              "WhatsApp agent could not hold a slot — handed off to human (demo).",
            messages: [
              ...live.messages,
              {
                id: id("wam"),
                role: "agent",
                body: "I couldn’t hold a slot right now. Connecting you with a staff member.",
                createdAt: nowIso(),
              },
            ],
            updatedAt: nowIso(),
          }));
        }
      }

      if (turn.handOff) {
        patchConversation(activeId, (live) => ({
          ...live,
          status: "handed_off",
          handedOffToAdmin: true,
          handoffReason: turn.handoffReason ?? "other",
          bookingOutcome: script.bookingOutcome,
          summary: script.summary,
          updatedAt: nowIso(),
        }));
        pendingScripts.delete(activeId);
        set({ activeId: null, scriptCursor: 0, busy: false });
        return;
      }

      const nextCursor = scriptCursor + 1;
      if (nextCursor >= script.turns.length) {
        pendingScripts.delete(activeId);
        set({ activeId: null, scriptCursor: 0, busy: false });
      } else {
        set({ scriptCursor: nextCursor, busy: false });
      }
    } finally {
      if (get().busy) set({ busy: false });
    }
  },

  takeOverConversation: (conversationId, actorUserId, actorLabel) => {
    const next = patchConversation(conversationId, (c) => {
      if (c.status !== "handed_off" && c.status !== "human_active") {
        return c;
      }
      const stamp = nowIso();
      return {
        ...c,
        status: "human_active",
        takenOverByUserId: actorUserId,
        takenOverAt: stamp,
        updatedAt: stamp,
        messages: [
          ...c.messages,
          {
            id: id("wam"),
            role: "system",
            body: `${actorLabel} took over this WhatsApp chat (demo).`,
            createdAt: stamp,
          },
        ],
      };
    });
    return !!next && next.status === "human_active";
  },

  sendStaffReply: (conversationId, body, actorUserId, actorLabel) => {
    const trimmed = body.trim();
    if (!trimmed) return false;
    const next = patchConversation(conversationId, (c) => {
      if (c.status !== "human_active" && c.status !== "handed_off") return c;
      const stamp = nowIso();
      return {
        ...c,
        status: "human_active",
        takenOverByUserId: c.takenOverByUserId ?? actorUserId,
        takenOverAt: c.takenOverAt ?? stamp,
        updatedAt: stamp,
        messages: [
          ...c.messages,
          {
            id: id("wam"),
            role: "staff",
            body: trimmed,
            createdAt: stamp,
            authorUserId: actorUserId,
            authorLabel: actorLabel,
          },
        ],
      };
    });
    return !!next;
  },

  simulatePatientFollowUp: (conversationId, body) => {
    const reply =
      body?.trim() ||
      PATIENT_FOLLOWUP_REPLIES[
        Math.floor(Math.random() * PATIENT_FOLLOWUP_REPLIES.length)
      ]!;
    const next = patchConversation(conversationId, (c) => {
      if (c.status !== "human_active") return c;
      const stamp = nowIso();
      return {
        ...c,
        updatedAt: stamp,
        messages: [
          ...c.messages,
          {
            id: id("wam"),
            role: "patient",
            body: reply,
            createdAt: stamp,
          },
        ],
      };
    });
    return !!next;
  },

  clearActive: () => {
    const { activeId } = get();
    if (activeId) pendingScripts.delete(activeId);
    set({ activeId: null, scriptCursor: 0, busy: false });
  },
}));

const pendingScripts = new Map<string, WhatsAppBookingScript>();
