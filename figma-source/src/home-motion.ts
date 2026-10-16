import { useEffect, type RefObject } from "react";

// Scoped to Home's own tree, including when it is mounted inside a ShadowRoot.
// No scroll listener, render loop, pinning or dependency on the Three.js hero.
export function useHomeMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>([
      ".hero .copy > *", ".hero-image",
      ".interior .copy > *", ".pipe-image",
      ".methods .copy > *:not(.method-list)", ".method-list button", ".method-visual > *",
      ".solutions .eyebrow", ".solutions h2", ".solution-item",
      ".industries .copy > *:not(ul)", ".industry-grid li",
      ".experience .copy > *", ".experience-grid > .stat",
      ".contact-copy > *:not(ul)", ".contact-details li", ".contact form > *",
      "footer .footer-inner > *", "footer .footer-legal",
    ].join(",")));
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealed = new Set<Element>();
    let observer: IntersectionObserver | undefined;
    const show = (element: Element, immediate = false) => {
      if (immediate) (element as HTMLElement).style.setProperty("--home-reveal-delay", "0ms");
      element.classList.add("is-home-visible");
      revealed.add(element);
      observer?.unobserve(element);
    };
    const start = () => {
      observer?.disconnect();
      if (preference.matches || !("IntersectionObserver" in window)) {
        targets.forEach(element => show(element, true));
        return;
      }
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) show(entry.target);
        }
      }, { threshold: 0.08 });
      targets.forEach(element => {
        if (revealed.has(element)) return;
        const index = Array.prototype.indexOf.call(element.parentElement?.children ?? [], element);
        element.style.setProperty("--home-reveal-delay", `${Math.min(index, 3) * 65}ms`);
        element.classList.add("home-reveal");
        observer!.observe(element);
      });
    };
    const focus = (event: FocusEvent) => {
      const target = (event.target as Element).closest<HTMLElement>(".home-reveal");
      if (target && root.contains(target)) show(target, true);
    };
    start();
    preference.addEventListener("change", start);
    root.addEventListener("focusin", focus);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", start);
      root.removeEventListener("focusin", focus);
      targets.forEach(element => {
        element.classList.remove("home-reveal", "is-home-visible");
        element.style.removeProperty("--home-reveal-delay");
      });
    };
  }, [rootRef]);
}
