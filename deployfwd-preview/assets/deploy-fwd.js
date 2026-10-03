(() => {
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));

  function actProgress(el) {
    const rect = el.getBoundingClientRect();
    const travel = Math.max(el.offsetHeight - window.innerHeight, 1);
    return clamp(-rect.top / travel);
  }

  function updateCollapse() {
    const act = document.querySelector("[data-df-collapse]");
    if (!act) return;
    const p = actProgress(act);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = reduced ? 1 : p;

    const left = Math.max(9, 50 - q * 41);
    const stage = act.querySelector(".df-collapse-stage");
    stage.style.setProperty("--df-left", left + "%");

    const fragments = [...act.querySelectorAll("[data-fragment]")];
    fragments.forEach((node, i) => {
      const start = 0.08 + i * 0.075;
      const local = clamp((q - start) / 0.28);
      node.style.opacity = String(1 - local * 0.82);
      node.style.transform = `translate3d(${-local * (18 + i * 3)}px,${local * (i % 2 ? -7 : 7)}px,0)`;
    });

    const outer = act.querySelector(".df-loop-path:not(.df-loop-path-inner)");
    const inner = act.querySelector(".df-loop-path-inner");
    if (outer) outer.style.strokeDashoffset = String(1600 * (1 - clamp((q - 0.16) / 0.52)));
    if (inner) inner.style.strokeDashoffset = String(1200 * (1 - clamp((q - 0.27) / 0.48)));

    [...act.querySelectorAll(".df-node, .df-human-gate")].forEach((node, i) => {
      const local = clamp((q - (0.28 + i * 0.055)) / 0.14);
      node.style.opacity = String(local);
      node.style.transform = `translateY(${(1 - local) * 8}px)`;
    });

    const cta = act.querySelector(".df-final-cta");
    const ctaP = clamp((q - 0.72) / 0.16);
    if (cta) {
      cta.style.opacity = String(ctaP);
      cta.style.transform = `translateY(${(1 - ctaP) * 16}px)`;
    }
  }

  let raf = 0;
  function requestUpdate() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      updateCollapse();
    });
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("load", requestUpdate);

  if (window.ScrollCraft) {
    window.ScrollCraft.mount(document.body);
  }
  requestUpdate();
})();
