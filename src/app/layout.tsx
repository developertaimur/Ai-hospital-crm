import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: "Life Care International Hospital | Islamabad",
  description:
    "Hospital operations demo — appointments, payments, and callbacks for Life Care International Hospital, Islamabad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="flex min-h-full flex-col font-sans"
        // Avoid noisy hydration warnings from browser extensions that inject
        // attributes (e.g. cz-shortcut-listen) onto <body>.
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
