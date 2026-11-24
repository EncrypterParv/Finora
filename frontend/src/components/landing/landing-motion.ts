import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

type JumpToStep = (index: number) => void;

export function mountLandingMotion(
  root: HTMLElement,
  onStep: (index: number) => void,
  setJump: (jump: JumpToStep | null) => void,
) {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();

  media.add("(prefers-reduced-motion: no-preference) and (min-width: 761px)", () => {
    const hero = root.querySelector<HTMLElement>(".masthead-scene");
    const image = hero?.querySelector<HTMLImageElement>(".masthead-art img");
    if (!hero || !image) return;
    gsap.to(image, {
      scale: 1.12,
      yPercent: 2,
      transformOrigin: "65% 42%",
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.4 },
    });
    return () => {
      image.style.removeProperty("transform");
      image.style.removeProperty("transform-origin");
    };
  }, root);

  media.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 850px) and (pointer: fine)", () => {
    const story = root.querySelector<HTMLElement>(".process-section");
    const viewport = story?.querySelector<HTMLElement>(".process-stories");
    const track = viewport?.querySelector<HTMLElement>(".process-track");
    const steps = track?.querySelectorAll<HTMLElement>("[data-step]");
    if (!story || !viewport || !track || !steps || steps.length < 2) return;

    const header = root.querySelector<HTMLElement>(".landing-header-floating, .landing-header");
    const lenis = new Lenis({ autoRaf: false, lerp: 0.13 });
    const tick = (seconds: number) => lenis.raf(seconds * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    story.classList.add("motion-enhanced");

    const lastStep = steps.length - 1;
    let current = -1;
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: story,
        start: () => `top top+=${header?.offsetHeight ?? 88}`,
        end: () => `+=${Math.round(window.innerHeight * 0.68 * lastStep)}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: ({ progress }) => {
          const index = Math.round(progress * lastStep);
          if (index !== current) {
            current = index;
            onStep(index);
          }
        },
      },
    });
    for (let index = 1; index <= lastStep; index += 1) {
      timeline.to(track, {
        x: () => -(track.scrollWidth - viewport.clientWidth) * index / lastStep,
        duration: 0.58,
        ease: "none",
      }, index - 1 + 0.21);
    }
    timeline.to({}, { duration: 0.21 });

    setJump((index) => {
      const trigger = timeline.scrollTrigger;
      if (trigger) {
        const top = trigger.start + (trigger.end - trigger.start) * index / lastStep;
        lenis.scrollTo(top, { duration: 0.45 });
      }
    });

    return () => {
      setJump(null);
      story.classList.remove("motion-enhanced");
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, root);

  return () => media.revert();
}
