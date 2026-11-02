"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Instrument } from "./Instrument";
import { FinancialWorkbench } from "./FinancialWorkbench";
import { WealthExplorer } from "./WealthExplorer";

export function Wordmark() {
  return (
    <span className="landing-wordmark">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 4h24v6H11v6h12v6H11v6H4Z" fill="currentColor" />
        <path d="m17 4 11 6V4ZM17 16l6 6v-6Z" fill="#8b9b7d" />
      </svg>
      finora
    </span>
  );
}
export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
    </svg>
  );
}
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

export function LandingPage({ art }: { art: ReactNode }) {
  const [stage, setStage] = useState(0);
  const processRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
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
    <div className="finora-landing">
      <a className="landing-skip" href="#main">
        Skip to content
      </a>
      <header className="landing-header">
        <Link href="/" aria-label="Finora home">
          <Wordmark />
        </Link>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#your-money">The bigger picture</a>
          <a href="#wealth">Your future</a>
        </nav>
        <Link className="landing-login" href="/login">
          Log in <Arrow diagonal />
        </Link>
      </header>
      <main id="main" tabIndex={-1}>
        <section className="landing-hero">
          <div className="hero-copy">
            <h1>
              Your money.
              <br />
              With a little
              <br />
              <em>more meaning.</em>
            </h1>
            <p>
              You work hard for your money. See where it goes, what your habits
              cost, and what it could become.
            </p>
            <div className="hero-actions">
              <Link className="landing-button" href="/login">
                See what you could be missing <Arrow />
              </Link>
              <a className="landing-text-link" href="#how-it-works">
                Take a closer look <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="hero-note">
              Your transactions, patterns, and forecasts. One considered view.
            </div>
          </div>
          <div className="hero-figure">
            <Instrument art={art} />
          </div>
          <div className="hero-baseline">
            <span>PERSONAL FINANCE, PUT IN PERSPECTIVE.</span>
            <p>
              One place for your cash flow, your habits,
              <br />
              and the plans that come next.
            </p>
            <a href="#how-it-works" aria-label="Scroll to how Finora works">
              <Arrow />
            </a>
          </div>
        </section>
        <section className="landing-intro" id="how-it-works">
          <h2>
            A transaction is a number.
            <br />
            <em>What it tells you is the point.</em>
          </h2>
          <p>
            The small expenses are easy to overlook. Their effect on your future
            is harder to ignore. Finora connects what happened, what’s changing,
            and what you can do next.
          </p>
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
        </section>
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
              <div className="feature-meta">GOALS WITH DIRECTION</div>
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
        <section className="honesty-section">
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
                "No. This preview uses synthetic sample data and simulated bank integrations. You can explore without connecting an account or sharing credentials.",
              ],
              [
                "How does the intelligence work?",
                "The current approach combines spending averages, statistical comparisons, and transparent rules. Trained machine learning models are a future direction; forecasts are estimates, not guarantees.",
              ],
              [
                "What can I try in the demo?",
                "Explore financial positions, the transaction calendar, budgets, goals, and spending insights. Use admin for both username and password. Demo changes stay in your browser session.",
              ],
              [
                "Will Finora move my money?",
                "No. Finora helps explain and plan. The preview does not make payments, execute trades, or move funds.",
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
        <section className="landing-final">
          <h2>
            Your future deserves
            <br />
            <em>more than a guess.</em>
          </h2>
          <p>Start with a clearer picture. Decide what comes next.</p>
          <Link href="/login" className="landing-button">
            Step inside Finora <Arrow />
          </Link>
          <small>Explore with sample data. No account setup.</small>
        </section>
      </main>
      <footer className="landing-footer">
        <Link href="/" aria-label="Finora home">
          <Wordmark />
        </Link>
        <span>Made for a more considered financial life.</span>
        <span>© {new Date().getFullYear()} Finora · Frontend preview</span>
      </footer>
    </div>
  );
}
