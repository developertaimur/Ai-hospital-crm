"use client";

import { WhatsAppInbox } from "@/components/whatsapp/whatsapp-inbox";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";

export default function AdminWhatsAppPage() {
  const { ready, state } = useDemoReady();
  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading WhatsApp…</p>;
  }
  return <WhatsAppInbox state={state} mode="admin" />;
}
