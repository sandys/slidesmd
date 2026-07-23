// Slide fx runtime — bento-style count-up numbers and entrance staggers,
// keyed off element classes set from markdown via <!-- .element: class="…" -->.
// Ported from bento's present.ts fx runtime onto the vendored anim engine;
// timings and offsets match bento (fade nudge 16px, slide sweep 120px,
// stagger 0.12 + step*0.05, count-up 1.15s power2.out).

import { anim, resetXform } from "@/vendor/bento/anim";

const ENTER_FX: Record<string, { x?: number; y?: number; slide?: boolean }> = {
  "fx-enter": { y: 16 },
  "fx-enter-down": { y: -16 },
  "fx-enter-left": { x: 120, slide: true },
  "fx-enter-right": { x: -120, slide: true },
};

const ENTER_SELECTOR = Object.keys(ENTER_FX)
  .map((cls) => `.${cls}`)
  .join(", ");

const NUMBER_RE = /\d+(?:[.,]\d+)?/g;

function runCountUp(node: HTMLElement): () => void {
  const original = node.textContent ?? "";
  if (!/\d/.test(original)) return () => {};
  const state = { p: 0 };
  const render = () => {
    node.textContent = original.replace(NUMBER_RE, (match) => {
      const parts = /^(\d+)(?:([.,])(\d+))?$/.exec(match);
      if (!parts) return match;
      const separator = parts[2];
      const decimals = parts[3]?.length ?? 0;
      const value = parseFloat(separator ? `${parts[1]}.${parts[3]}` : parts[1]);
      const current = (value * state.p).toFixed(decimals);
      return separator ? current.replace(".", separator) : current;
    });
  };
  const tween = anim.to(state, {
    p: 1,
    duration: 1.15,
    delay: 0.15,
    ease: "power2.out",
    onUpdate: render,
    onComplete: () => {
      node.textContent = original; // guarantee an exact restore
    },
  });
  render();
  return () => {
    tween.kill();
    node.textContent = original;
  };
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Runs all fx inside one slide (entrances, count-ups, ken-burns) and returns
// a disposer that kills the tweens and restores the DOM. Never used in print
// mode — unanimated output is final-state by construction because entrance
// initial states are only applied when a tween starts.
export function runSlideFx(slideEl: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => {};
  const cleanups: Array<() => void> = [];

  let step = 0;
  slideEl.querySelectorAll<HTMLElement>(ENTER_SELECTOR).forEach((el) => {
    const cls = Object.keys(ENTER_FX).find((c) => el.classList.contains(c));
    if (!cls) return;
    const fx = ENTER_FX[cls];
    anim.fromTo(
      el,
      { opacity: 0, x: fx.x ?? 0, y: fx.y ?? 0 },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: fx.slide ? 0.75 : 0.55,
        delay: 0.12 + Math.min(step, 24) * 0.05,
        ease: fx.slide ? "power3.out" : "power2.out",
      },
    );
    step += 1;
    cleanups.push(() => {
      anim.killTweensOf(el);
      el.style.opacity = "";
      el.style.transform = "";
      resetXform(el);
    });
  });

  slideEl.querySelectorAll<HTMLElement>(".fx-countup").forEach((el) => {
    cleanups.push(runCountUp(el));
  });

  slideEl.querySelectorAll<HTMLElement>(".fx-kenburns").forEach((el) => {
    anim.fromTo(
      el,
      { scale: 1.02 },
      {
        scale: 1.1,
        duration: 26,
        repeat: -1,
        yoyo: true,
        transformOrigin: "50% 40%",
        ease: "sine.inOut",
      },
    );
    cleanups.push(() => {
      anim.killTweensOf(el);
      el.style.transform = "";
      resetXform(el);
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
