"use client";

import { useRouter } from "next/navigation";
import { PhoneIncoming } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useLiveCallStore } from "@/lib/store/live-call-store";

export function TestCallButton() {
  const router = useRouter();
  const ringing = useLiveCallStore((s) => s.ringing);
  const live = useLiveCallStore((s) => s.live);
  const simulateIncomingCall = useLiveCallStore((s) => s.simulateIncomingCall);

  function onTestCall() {
    router.push("/reception");

    if (ringing || live) {
      toast({
        title: "Call already active",
        description: ringing
          ? "Accept or dismiss the ringing popup first."
          : "End the live call before starting another test.",
      });
      return;
    }

    const created = simulateIncomingCall();
    if (!created) {
      toast({
        title: "Could not start test call",
        description: "Finish the current ringing or live call first.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Test incoming call",
      description: `${created.callerName} · ${created.callerNumber} — accept the popup to see live details.`,
    });
  }

  return (
    <Button
      type="button"
      className="w-full justify-start gap-2.5 rounded-xl px-3 py-2.5 h-auto shadow-sm shadow-primary/20"
      onClick={onTestCall}
      disabled={!!ringing || !!live}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
        <PhoneIncoming className="size-4" aria-hidden />
      </span>
      <span className="text-left">
        <span className="block text-sm font-medium">Test call</span>
        <span className="block text-[11px] font-normal opacity-90">
          Ring popup + live details
        </span>
      </span>
    </Button>
  );
}
