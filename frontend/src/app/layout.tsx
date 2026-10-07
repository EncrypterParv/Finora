import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "FinancialCall — Financial Behaviour Intelligence",
  description: "Next-generation financial calendar, behaviour intelligence, and FIRE goal platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
