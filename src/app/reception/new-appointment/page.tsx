"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — booking creation is Admin-only. */
export default function ReceptionNewAppointmentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/reception");
  }, [router]);
  return (
    <p className="text-sm text-muted">
      New appointments are Admin-only. Redirecting to Incoming Calls…
    </p>
  );
}
