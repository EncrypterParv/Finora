import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Finora — Financial Behaviour Intelligence",
  description: "A clear view of your cash flow, spending behaviour, and long-term financial goals.",
  applicationName: "Finora",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="amoled" className="dark amoled">
      <body className="min-h-screen bg-[var(--finora-canvas,#000000)] text-[var(--finora-ink,#ffffff)] antialiased transition-colors duration-200">
        <ThemeProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
