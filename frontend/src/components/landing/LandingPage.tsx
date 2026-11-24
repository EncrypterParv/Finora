"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FinancialWorkbench } from "./FinancialWorkbench";
import { WealthExplorer } from "./WealthExplorer";
import { LandingPlans } from "./LandingPlans";
import { Arrow } from "./LandingBrand";
import { FinoraMark } from "@/components/brand/FinoraMark";
import { LandingFooter } from "./LandingFooter";
import { ThemeSelector } from "@/components/ui/ThemeSelector";

const InstrumentPreview = dynamic(() => import("./InstrumentPreview"), {
  loading: () => <p className="instrument-loading" role="status">Opening the walkthrough…</p>,
});

const steps = [
  {
    title: "Start with the everyday.",
    subtitle: "Your statements. One clear picture.",
    body: "Bring in a CSV statement. Finora puts dates, merchants, amounts, and categories into one consistent record, checking for duplicates along the way.",
    detail: "A clean foundation, before any calculation.",
    tag: "ORGANIZE",
    sample: "UPI / BLUE TOKAI / ₹320 → Food & Dining",
  },
  {
    title: "See the patterns hiding in plain sight.",
    subtitle: "A calendar that tells a story.",
    body: "A quiet Tuesday. An expensive weekend. See when money moves, which categories add up, and how recent spending compares with your usual pace.",
    detail: "Understand the habit behind the total.",
    tag: "UNDERSTAND",
    sample: "Weekend daily spend / ₹1,240 · Weekday / ₹680",
  },
  {
    title: "Look a little further ahead.",
    subtitle: "Your pace, projected forward.",
    body: "Turn your recent spending into a month-end estimate. See whether a budget could run out, then change the daily pace to explore a different outcome.",
    detail: "An estimate to plan with. Never a promise.",
    tag: "ANTICIPATE",
    sample: "₹18,000 spent + 15 × ₹900/day = ₹31,500",
  },
  {
    title: "Make the next move yours.",
    subtitle: "Small decisions. A longer view.",
    body: "Set a budget, build an emergency fund, or put more toward a goal. Finora connects the numbers to practical next steps, with the reasoning in view.",
    detail: "You stay in charge of every decision.",
    tag: "ACT",
    sample: "₹35,000 budget − ₹31,500 projection = ₹3,500 room",
  },
];

export function LandingPage() {
  const [stage, setStage] = useState(0);
  const [showInstrument, setShowInstrument] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const landingRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const jumpRef = useRef<((index: number) => void) | null>(null);
  useEffect(() => {
    const updateHeader = () => setHeaderScrolled(window.scrollY > 20);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    const root = landingRef.current;
    if (!root) return;
    let active = true;
    let requested = false;
    let cleanup: (() => void) | undefined;
    const preference = window.matchMedia("(prefers-reduced-motion: no-preference) and (min-width: 761px)");
    const start = () => {
      if (requested || !preference.matches) return;
      requested = true;
      void import("./landing-motion").then(({ mountLandingMotion }) => {
        if (active) cleanup = mountLandingMotion(root, setStage, (jump) => { jumpRef.current = jump; });
      }).catch(() => { /* The static layout stays usable if the motion chunk cannot load. */ });
    };
    preference.addEventListener("change", start);
    const timer = window.setTimeout(start, 120);
    return () => {
      active = false;
      window.clearTimeout(timer);
      preference.removeEventListener("change", start);
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting && !processRef.current?.classList.contains("motion-enhanced"))
            setStage(Number((entry.target as HTMLElement).dataset.step));
      },
      { rootMargin: "-25% 0px -40% 0px", threshold: 0 },
    );
    processRef.current
      ?.querySelectorAll("[data-step]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return (
    <div className="finora-landing" id="top" ref={landingRef}>
      <a className="landing-skip" href="#main">
        Skip to content
      </a>
      <div className="fixed top-4 inset-x-0 z-50 px-4 md:px-8 pointer-events-none">
        <header className="landing-header-floating pointer-events-auto mx-auto flex items-center justify-between" data-scrolled={headerScrolled}>
          {/* Left: Pill navigation buttons */}
          <nav className="flex items-center gap-1.5 md:gap-2 shrink-0" aria-label="Main navigation">
            <a href="#how-it-works" className="landing-pill-btn">
              About
            </a>
            <a href="#your-money" className="landing-pill-btn">
              Product
            </a>
            <a href="#plans" className="landing-pill-btn hidden sm:inline-flex">
              FAQ
            </a>
          </nav>

          {/* Center: Brand Wordmark */}
          <Link href="/" aria-label="Finora home" className="flex items-center shrink-0 hover:opacity-90 transition-opacity">
            <FinoraMark size="sm" showWordmark={true} />
          </Link>

          {/* Right: Theme Selector & Log In Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeSelector pill />
            <Link className="landing-pill-btn group flex items-center gap-2 font-bold" href="/login">
              <span>Log in</span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/20 group-hover:scale-110 transition-transform">
                <Arrow diagonal />
              </span>
            </Link>
          </div>
        </header>
      </div>
      <main id="main" tabIndex={-1}>
        <section className="landing-masthead" aria-labelledby="landing-title">
          <div className="masthead-scene">
            <picture className="masthead-art">
              <source media="(max-width: 700px)" srcSet="/images/statement-review-hero-mobile.webp" />
              <Image src="/images/statement-review-hero.webp" alt="" width={1672} height={941} unoptimized fetchPriority="high" loading="eager" />
            </picture>
            <div className="masthead-copy">
              <h1 id="landing-title">See your money <em>take shape.</em></h1>
              <div className="masthead-actions">
                <p>
                  Bring in a bank statement. Review your transactions, see where
                  your money went, and plan what comes next.
                </p>
                <Link className="landing-button" href="/login">
                  Open your workspace <Arrow />
                </Link>
              </div>
            </div>
          </div>
          <div className="masthead-note">
            <p>Import a statement. Review each record before you save. No bank login required.</p>
            <a href="#how-it-works">How it works <ArrowDown size={16} aria-hidden="true" /></a>
          </div>
        </section>
        <section className="landing-intro" id="how-it-works">
          <h2>
            A transaction is a number.
            <br />
            <em>What it tells you is the point.</em>
          </h2>
          <div className="intro-still-life">
            <Image src="/images/statement-still-life.png" alt="" width={610} height={610} sizes="220px" />
            <p>
              Finora connects what happened, what’s changing, and what you can do
              next. Start with a statement that you review before saving.
            </p>
          </div>
        </section>
        <section
          className="process-section"
          aria-label="How Finora turns transactions into understanding"
          ref={processRef}
        >
          <div className="process-visual">
            <div className="process-tabs" aria-label="Explore the four stages">
              {steps.map((step, index) => (
                <button
                  key={step.tag}
                  aria-pressed={stage === index}
                  onClick={() => {
                    if (jumpRef.current) {
                      jumpRef.current(index);
                      return;
                    }
                    setStage(index);
                    document
                      .getElementById(`process-${index}`)
                      ?.scrollIntoView({
                        behavior: window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches
                          ? "auto"
                          : "smooth",
                        block: "center",
                      });
                  }}
                >
                  {index + 1}
                  <span>{step.tag}</span>
                </button>
              ))}
            </div>
            <FinancialWorkbench stage={stage} />
            <p className="figure-caption">
              From a single transaction to a considered next step. Explore the
              stages as you scroll.
            </p>
          </div>
          <div className="process-stories">
            <div className="process-track">
            {steps.map((step, index) => (
              <article
                id={`process-${index}`}
                data-step={index}
                key={step.title}
                className={
                  stage === index ? "process-story active" : "process-story"
                }
              >
                <span className="process-number">
                  {String(index + 1).padStart(2, "0")} / {step.tag}
                </span>
                <h3>{step.title}</h3>
                <strong>{step.subtitle}</strong>
                <p>{step.body}</p>
                <div className="process-sample">{step.sample}</div>
                <p className="process-detail">{step.detail}</p>
                <div className="mobile-process-panel">
                  <FinancialWorkbench stage={index} />
                </div>
              </article>
            ))}
            </div>
          </div>
        </section>
        <details className="instrument-preview" onToggle={(event) => setShowInstrument(event.currentTarget.open)}>
          <summary>Explore the interactive cash flow walkthrough</summary>
          {showInstrument && <InstrumentPreview />}
        </details>
        <section className="money-section" id="your-money">
          <div className="section-heading">
            <h2>
              One life.
              <br />
              <em>See the whole picture.</em>
            </h2>
            <p>
              From splitting rent and buying your first coffee to saving for
              life after graduation.
            </p>
          </div>
          <div className="money-grid">
            <article className="calendar-feature">
              <div className="feature-meta">
                THE FINANCIAL CALENDAR <span>ILLUSTRATIVE WEEK</span>
              </div>
              <div className="feature-still-life">
                <Image src="/images/calendar-still-life.png" alt="" width={720} height={480} sizes="(max-width: 760px) 70vw, 300px" />
              </div>
              <div className="mini-calendar">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div key={i}>
                    <span>{day}</span>
                    <b className={`heat heat-${i}`}>{12 + i}</b>
                    <small>
                      {
                        [
                          "₹680",
                          "₹320",
                          "₹450",
                          "₹210",
                          "₹980",
                          "₹1,240",
                          "₹790",
                        ][i]
                      }
                    </small>
                  </div>
                ))}
              </div>
              <h3>Every day has a money story.</h3>
              <p>
                A calendar view makes busy spending days and quiet ones easy to
                spot.
              </p>
            </article>
            <article className="goal-feature">
              <div className="feature-meta">SAVINGS GOALS <span>ILLUSTRATIVE GOAL</span></div>
              <div className="feature-still-life">
                <Image src="/images/savings-still-life.png" alt="" width={720} height={360} sizes="(max-width: 760px) 70vw, 300px" />
              </div>
              <div className="goal-track">
                <span>Emergency fund</span>
                <strong>
                  ₹1,50,000 <small>/ ₹3,00,000</small>
                </strong>
                <div>
                  <i />
                </div>
                <span>Halfway to a little more peace of mind.</span>
              </div>
              <h3>Keep your future in view.</h3>
              <p>
                Explore how changing your monthly contribution could change your
                timeline.
              </p>
            </article>
          </div>
        </section>
        <WealthExplorer />
        <LandingPlans />
        <section className="honesty-section" id="questions">
          <div>
            <h2>
              A little clarity
              <br />
              <em>before you begin.</em>
            </h2>
            <p>Good financial tools should be clear about what they do.</p>
          </div>
          <div className="landing-faq">
            {[
              [
                "Is this connected to my real bank?",
                "No. Finora does not connect to your bank. You can add a statement file and review the extracted records; we never ask for your online banking password or full account number.",
              ],
              [
                "How does the intelligence work?",
                "The current approach combines spending averages, statistical comparisons, and transparent rules. Trained machine learning models are a future direction; forecasts are estimates, not guarantees.",
              ],
              [
                "What will I see after signing in?",
                "Your workspace starts empty. Add an account label and a bank statement to see your own records. Nothing is saved from a statement until you review and confirm it.",
              ],
              [
                "Will Finora move my money?",
                "No. Finora helps explain and plan. It does not make payments, execute trades, or move funds.",
              ],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <span aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
