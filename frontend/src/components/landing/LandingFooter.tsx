"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { Arrow, Wordmark } from "./LandingBrand";

export function LandingFooter() {
  const artRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const art = artRef.current;
    if (!art || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active = true;
    let animation: { revert: () => unknown } | undefined;
    const reset = () => {
      if (preference.matches) animation?.revert();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || preference.matches) return;
      observer.disconnect();
      void import("animejs").then(({ animate }) => {
        if (active && !preference.matches) {
          animation = animate(art, {
            y: [16, 0],
            opacity: [0.84, 1],
            duration: 700,
            ease: "out(3)",
          });
        }
      }).catch(() => { /* The illustration is visible without animation. */ });
    }, { threshold: 0.18 });
    observer.observe(art);
    preference.addEventListener("change", reset);
    return () => {
      active = false;
      observer.disconnect();
      preference.removeEventListener("change", reset);
      animation?.revert();
    };
  }, []);

  return (
    <footer className="finora-closing">
      <div className="closing-panel">
        <div className="closing-main">
          <div className="closing-message">
            <h2>Make room for <em>what matters.</em></h2>
            <p>See what you spend and what you’re saving for. Start with a bank statement, and review each transaction before you save it.</p>
            <Link href="/login" className="landing-button">Open your workspace <Arrow /></Link>
          </div>
          <nav className="closing-links" aria-label="Footer navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#your-money">Calendar and goals</a>
            <a href="#wealth">Wealth calculator</a>
            <a href="#plans">Plans</a>
            <a href="#questions">Common questions</a>
          </nav>
        </div>
        <Image
          ref={artRef}
          className="closing-illustration"
          src="/images/finora-footer-people.png"
          width={1440}
          height={480}
          sizes="(max-width: 760px) 100vw, (max-width: 1250px) 92vw, 1152px"
          alt=""
        />
      </div>
      <div className="closing-bottom">
        <Link href="/" aria-label="Finora home"><Wordmark /></Link>
        <small>© {new Date().getFullYear()} Finora</small>
        <a href="#top">Back to top <ArrowUp size={16} aria-hidden="true" /></a>
      </div>
    </footer>
  );
}
