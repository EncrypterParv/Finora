import { LandingPage } from "@/components/landing/LandingPage";
import { InstrumentArt } from "@/components/landing/InstrumentArt";
import "@/components/landing/anatomy.css";
import "@/components/landing/landing.css";
import "@/components/landing/refinement.css";

export default function Home() {
  return <LandingPage art={<InstrumentArt />} />;
}
