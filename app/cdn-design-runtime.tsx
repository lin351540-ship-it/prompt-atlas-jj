"use client";

import { useEffect } from "react";

const CDN_MODULES = {
  motion: [
    "https://esm.sh/motion@12.43.0/mini?bundle",
    "https://cdn.jsdelivr.net/npm/motion@12.43.0/mini/+esm",
  ],
  tilt: [
    "https://cdn.jsdelivr.net/npm/vanilla-tilt@1.8.1/+esm",
    "https://esm.sh/vanilla-tilt@1.8.1",
  ],
} as const;

type MotionModule = {
  animate: (
    target: Element,
    keyframes: Record<string, string[] | number[]>,
    options: Record<string, unknown>,
  ) => unknown;
};

type TiltElement = HTMLElement & {
  vanillaTilt?: { destroy: () => void };
};

type TiltModule = {
  default: {
    init: (target: Element, options: Record<string, unknown>) => void;
  };
};

async function importFromCdn<T>(sources: readonly string[]) {
  let lastError: unknown;
  for (const source of sources) {
    try {
      return await import(/* @vite-ignore */ source) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export default function CdnDesignRuntime() {
  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    let disposed = false;
    let revealObserver: IntersectionObserver | undefined;
    let tiltObserver: IntersectionObserver | undefined;
    let mutationObserver: MutationObserver | undefined;
    const revealed = new WeakSet<Element>();
    const tiltObserved = new WeakSet<Element>();

    if (reducedMotion) {
      root.dataset.designCdn = "reduced";
      return;
    }

    root.dataset.designCdn = "loading";

    const initialize = async () => {
      try {
        const [motionModule, tiltModule] = await Promise.all([
          importFromCdn<MotionModule>(CDN_MODULES.motion),
          importFromCdn<TiltModule>(CDN_MODULES.tilt),
        ]);
        if (disposed) return;

        root.dataset.designCdn = "ready";
        revealObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || revealed.has(entry.target)) return;
            revealed.add(entry.target);
            revealObserver?.unobserve(entry.target);
            motionModule.animate(entry.target, {
              opacity: [0, 1],
              transform: ["translate3d(0, 24px, 0)", "translate3d(0, 0, 0)"],
              filter: ["blur(9px)", "blur(0px)"],
            }, {
              duration: 0.78,
              ease: [0.16, 1, 0.3, 1],
            });
          });
        }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

        if (!coarsePointer) {
          tiltObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              const element = entry.target as TiltElement;
              const mode = element.dataset.cdnTilt;
              if (!entry.isIntersecting) {
                if (mode === "card") element.vanillaTilt?.destroy();
                return;
              }
              if (element.vanillaTilt) return;
              tiltModule.default.init(element, {
                max: mode === "hero" ? 1.65 : mode === "panel" ? 1.25 : mode === "source" ? 2.4 : 3.1,
                perspective: mode === "hero" ? 1900 : 1500,
                scale: mode === "card" ? 1.008 : 1.003,
                speed: 680,
                glare: true,
                "max-glare": mode === "hero" ? 0.08 : 0.12,
                gyroscope: false,
                transition: true,
                reset: true,
                easing: "cubic-bezier(.16,1,.3,1)",
              });
            });
          }, { rootMargin: "420px 0px", threshold: 0.01 });
        }

        const enhance = (scope: ParentNode) => {
          scope.querySelectorAll<HTMLElement>("[data-cdn-reveal]").forEach((element) => {
            if (!revealed.has(element)) revealObserver?.observe(element);
          });

          if (coarsePointer) return;
          scope.querySelectorAll<TiltElement>("[data-cdn-tilt]").forEach((element) => {
            if (tiltObserved.has(element)) return;
            tiltObserved.add(element);
            tiltObserver?.observe(element);
          });
        };

        enhance(document);
        mutationObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) enhance(node);
            });
          });
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });
      } catch {
        if (!disposed) root.dataset.designCdn = "fallback";
      }
    };

    void initialize();
    return () => {
      disposed = true;
      revealObserver?.disconnect();
      tiltObserver?.disconnect();
      mutationObserver?.disconnect();
      document.querySelectorAll<TiltElement>("[data-cdn-tilt]").forEach((element) => element.vanillaTilt?.destroy());
      delete root.dataset.designCdn;
    };
  }, []);

  return null;
}
