"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { withDemoRepo } from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";

interface NotificationPreviewProps {
  appointmentId: string;
  templateKey: "provisional" | "confirmation" | "reschedule" | "cancel";
}

export function NotificationPreview({
  appointmentId,
  templateKey,
}: NotificationPreviewProps) {
  const [en, setEn] = useState("");
  const [ur, setUr] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      withDemoRepo((a) =>
        repo.previewNotification(a, {
          appointmentId,
          locale: "en",
          templateKey,
        }),
      ),
      withDemoRepo((a) =>
        repo.previewNotification(a, {
          appointmentId,
          locale: "ur",
          templateKey,
        }),
      ),
    ]).then(([e, u]) => {
      if (!cancelled) {
        setEn(e);
        setUr(u);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [appointmentId, templateKey]);

  return (
    <Tabs defaultValue="en">
      <TabsList>
        <TabsTrigger value="en">English</TabsTrigger>
        <TabsTrigger value="ur">Urdu</TabsTrigger>
      </TabsList>
      <TabsContent value="en">
        <p className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-sm">
          {en || "Loading preview…"}
        </p>
      </TabsContent>
      <TabsContent value="ur">
        <p
          dir="rtl"
          lang="ur"
          className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-sm"
        >
          {ur || "Loading preview…"}
        </p>
      </TabsContent>
    </Tabs>
  );
}
