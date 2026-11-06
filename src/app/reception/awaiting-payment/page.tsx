"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — payment verification is Admin-only. */
export default function ReceptionAwaitingPaymentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/reception/bookings");
  }, [router]);
  return (
    <p className="text-sm text-muted">
      Payment verification is Admin-only. Redirecting to Bookings status…
    </p>
  );
}
