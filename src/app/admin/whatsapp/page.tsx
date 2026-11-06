"use client";

import { useSearchParams } from "next/navigation";
import { WhatsAppInbox } from "@/components/whatsapp/whatsapp-inbox";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";

export default function AdminWhatsAppPage() {
  const { ready, state } = useDemoReady();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading WhatsApp…</p>;
  }

  return (
    <WhatsAppInbox state={state} mode="admin" initialFilter={filter} />
  );
}
