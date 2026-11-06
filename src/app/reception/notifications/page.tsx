"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReceptionNotificationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/reception");
  }, [router]);
  return (
    <p className="text-sm text-muted">Redirecting to Incoming Calls…</p>
  );
}
