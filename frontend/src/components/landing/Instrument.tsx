"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const assemblies = [
  {
    label: "Statements",
    description: "A statement enters. Every transaction finds its place.",
  },
  {
    label: "Patterns",
    description: "The everyday becomes a pattern you can understand.",
  },
  {
    label: "Forecasts",
    description: "Your spending pace becomes a view of what comes next.",
  },
];

export function Instrument({ art }: { art: ReactNode }) {
  const figure = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(true);
  const [assembly, setAssembly] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [manual, setManual] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduced(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    let intersecting = false;
    const syncVisibility = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        syncVisibility();
      },
      { threshold: 0.15 },
    );
    if (figure.current) observer.observe(figure.current);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", syncPreference);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  const running = playing && visible && !reduced && open;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setAssembly((current) => (current + 1) % assemblies.length),
      4200,
    );
    return () => window.clearInterval(timer);
  }, [running, assembly]);

  function selectPart(index: number) {
    setAssembly(index);
    setPlaying(false);
    setManual(true);
    setOpen(true);
    setReplay((current) => current + 1);
  }

  return (
    <figure
      ref={figure}
      className="money-instrument iso"
      data-theme="light"
      data-open={open}
      data-stage={assembly + 1}
      data-active={visible && !reduced && open && (playing || manual)}
      data-running={running}
      data-playing={playing}
    >
      <div className="instrument-caption">
        <span>The cash-flow engine</span>
        <span className="instrument-live">
          {running ? "A closer look, in motion" : "Explore the parts"}
        </span>
      </div>
      <div
        className="instrument-drawing"
        key={replay}
        onClick={(event) => {
          const part = (event.target as Element).closest("[data-assembly]");
          if (part) selectPart(Number(part.getAttribute("data-assembly")));
        }}
      >
        {art}
        <div
          className="instrument-annotation"
          aria-live={playing ? "off" : "polite"}
        >
          <span>{assemblies[assembly].description}</span>
        </div>
      </div>
      <div
        className="instrument-parts"
        role="group"
        aria-label="Explore the instrument assemblies"
      >
        {assemblies.map((part, index) => (
          <button
            key={part.label}
            type="button"
            aria-pressed={assembly === index}
            onClick={() => selectPart(index)}
          >
            <span className="assembly-index" aria-hidden="true">
              {index + 1}
            </span>
            {part.label}
          </button>
        ))}
      </div>
      <div className="instrument-toolbar">
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            if (open) {
              setPlaying(false);
              setManual(false);
            }
          }}
          aria-pressed={open}
        >
          {open ? "Assemble" : "Look inside"}
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
        <button
          type="button"
          className="instrument-tour"
          disabled={reduced}
          onClick={() => {
            setPlaying(!playing);
            setManual(false);
            setOpen(true);
          }}
          aria-pressed={playing && !reduced}
          aria-label={
            playing && !reduced
              ? "Pause instrument animation"
              : "Play instrument animation"
          }
        >
          {playing && !reduced ? "Pause tour" : "Play tour"}
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            {playing && !reduced ? (
              <path d="M4 3h3v10H4zm5 0h3v10H9z" fill="currentColor" />
            ) : (
              <path d="m4 2 9 6-9 6Z" fill="currentColor" />
            )}
          </svg>
        </button>
      </div>
      <figcaption className="instrument-footnote">
        <span>
          {reduced
            ? "Reduced motion enabled. Select a part to explore."
            : "Select a part to take a closer look."}
        </span>
        <span>Conceptual model</span>
      </figcaption>
    </figure>
  );
}
