import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body
        className="flex min-h-full flex-col bg-background font-sans text-foreground"
        // Avoid noisy hydration warnings from browser extensions that inject
        // attributes (e.g. cz-shortcut-listen) onto <body>.
        suppressHydrationWarning
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
