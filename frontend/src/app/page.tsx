import { LandingPage } from "@/components/landing/LandingPage";
import "lenis/dist/lenis.css";
import "@/components/landing/anatomy.css";
import "@/components/landing/landing.css";
import "@/components/landing/refinement.css";
import "@/components/landing/identity.css";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Finora",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://finora-sem3.vercel.app",
    description:
      "A personal finance workspace for reviewing bank statement records, understanding spending, and planning budgets and savings goals.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPage />
    </>
  );
}
