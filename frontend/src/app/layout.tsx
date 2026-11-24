import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://finora-sem3.vercel.app",
  ),
  title: {
    default: "Finora — See your money take shape",
    template: "%s | Finora",
  },
  description:
    "Turn your bank statements into a clear view of what you spend, what you save, and what you can plan for. Review every record before it is saved.",
  applicationName: "Finora",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Finora",
    title: "Finora — See your money take shape",
    description:
      "A considered view of your spending, savings, and plans. Bring in a statement, review each record, and decide what comes next.",
    url: "/",
    locale: "en_IN",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Finora — See your money take shape" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finora — See your money take shape",
    description:
      "A considered view of your spending, savings, and plans. Review statement records before you save them.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
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
