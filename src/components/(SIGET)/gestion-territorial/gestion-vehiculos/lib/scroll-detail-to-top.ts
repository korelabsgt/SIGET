"use client";

import { useEffect } from "react";

export function scrollGvDetailToTop() {
  if (typeof window === "undefined") return;

  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  document.querySelectorAll("[data-gv-scroll-root]").forEach((node) => {
    if (node instanceof HTMLElement) {
      node.scrollTop = 0;
    }
  });
}

export function useGvDetailScrollToTop(active: boolean, itemKey?: string | null) {
  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;

    scrollGvDetailToTop();
    const frame = requestAnimationFrame(scrollGvDetailToTop);
    return () => cancelAnimationFrame(frame);
  }, [active, itemKey]);
}
