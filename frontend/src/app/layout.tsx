import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
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
    <html lang="en">
      <body className="min-h-screen bg-[#f8f4e7] text-[#271c19] antialiased">
        <QueryProvider>
          {children}
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
