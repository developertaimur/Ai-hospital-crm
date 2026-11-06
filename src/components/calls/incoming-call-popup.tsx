"use client";

import { Phone, PhoneOff, PhoneIncoming } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLiveCallStore } from "@/lib/store/live-call-store";

export function IncomingCallPopup() {
  const ringing = useLiveCallStore((s) => s.ringing);
  const acceptRingingCall = useLiveCallStore((s) => s.acceptRingingCall);
  const dismissRingingCall = useLiveCallStore((s) => s.dismissRingingCall);

  const open = !!ringing;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Only dismiss when the agent closes the popup; accept clears ringing itself.
        if (!next && useLiveCallStore.getState().ringing) {
          dismissRingingCall();
        }
      }}
    >
      <DialogContent className="max-w-md overflow-hidden border-primary/20 p-0 sm:rounded-2xl">
        <div className="relative bg-[radial-gradient(ellipse_at_top,_rgba(15,118,110,0.18),_transparent_65%)] px-6 pb-6 pt-7">
          <div className="mb-5 flex justify-center">
            <span className="relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/35" />
              <PhoneIncoming className="relative size-7" aria-hidden />
            </span>
          </div>
          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle className="text-xl">Incoming call</DialogTitle>
            <DialogDescription className="text-sm">
              Demo fictional caller — accept to monitor the live AI call on this
              dashboard.
            </DialogDescription>
          </DialogHeader>

          {ringing ? (
            <div className="mt-5 rounded-2xl border border-border bg-surface/90 p-4 text-center shadow-sm">
              <p className="text-lg font-semibold text-foreground">
                {ringing.callerName}
              </p>
              <p className="mt-1 tabular-nums text-sm text-muted">
                {ringing.callerNumber}
              </p>
              <p className="mt-2 text-xs uppercase tracking-wide text-primary">
                {ringing.language === "ur" ? "Urdu" : "English"} · ringing
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="flex-1 gap-2"
              onClick={() => acceptRingingCall()}
            >
              <Phone className="size-4" aria-hidden />
              Accept call
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 gap-2"
              onClick={() => dismissRingingCall()}
            >
              <PhoneOff className="size-4" aria-hidden />
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
