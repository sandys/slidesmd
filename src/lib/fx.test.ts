import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { runSlideFx } from "./fx";
import { anim } from "@/vendor/bento/anim";

beforeAll(() => {
  anim.setManual(true); // drive the clock by hand — never wait on real rAF
});

beforeEach(() => {
  anim.killAll();
});

const slideWith = (html: string) => {
  const slide = document.createElement("section");
  slide.innerHTML = html;
  document.body.appendChild(slide);
  return slide;
};

describe("runSlideFx count-up", () => {
  it("counts numbers up and restores the exact original text", () => {
    const slide = slideWith('<p class="fx-countup kpi">$1,250 and 100% up 3.5x</p>');
    const el = slide.querySelector("p")!;
    const original = el.textContent;

    const dispose = runSlideFx(slide);
    // renders the from-state (zeros) immediately
    expect(el.textContent).toBe("$0,000 and 0% up 0.0x");

    anim.tick(0.7); // past the 0.15s delay, mid-tween
    expect(el.textContent).not.toBe(original);
    expect(el.textContent).not.toBe("$0,000 and 0% up 0.0x");

    anim.tick(2); // completes
    expect(el.textContent).toBe(original);
    dispose();
    expect(el.textContent).toBe(original);
  });

  it("restores text when disposed mid-flight", () => {
    const slide = slideWith('<p class="fx-countup">42 things</p>');
    const el = slide.querySelector("p")!;
    const dispose = runSlideFx(slide);
    anim.tick(0.5);
    dispose();
    expect(el.textContent).toBe("42 things");
    expect(anim.activeCount).toBe(0);
  });
});

describe("runSlideFx entrances", () => {
  it("fades elements in with a stagger", () => {
    const slide = slideWith(
      '<div class="fx-enter">one</div><div class="fx-enter">two</div>',
    );
    const [first, second] = Array.from(slide.querySelectorAll<HTMLElement>("div"));

    runSlideFx(slide);
    // fromTo renders the from-state immediately
    expect(first.style.opacity).toBe("0");
    expect(second.style.opacity).toBe("0");

    anim.tick(5); // both tweens complete (delays 0.12 / 0.17 + 0.55s)
    expect(parseFloat(first.style.opacity)).toBe(1);
    expect(parseFloat(second.style.opacity)).toBe(1);
    expect(first.style.transform).not.toContain("translate(0px, 16px)");
  });

  it("cleans up styles on dispose", () => {
    const slide = slideWith('<div class="fx-enter-left">x</div>');
    const el = slide.querySelector<HTMLElement>("div")!;
    const dispose = runSlideFx(slide);
    anim.tick(0.2);
    dispose();
    expect(el.style.opacity).toBe("");
    expect(el.style.transform).toBe("");
    expect(anim.activeCount).toBe(0);
  });
});

describe("reduced motion", () => {
  it("does nothing when prefers-reduced-motion is set", () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as never;
    try {
      const slide = slideWith('<p class="fx-countup">99 red balloons</p>');
      const el = slide.querySelector("p")!;
      runSlideFx(slide);
      expect(el.textContent).toBe("99 red balloons");
      expect(anim.activeCount).toBe(0);
    } finally {
      window.matchMedia = original;
    }
  });
});
