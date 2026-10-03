(() => {
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));

  function lockProgress(section) {
    const rect = section.getBoundingClientRect();
    const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
    return clamp(-rect.top / travel);
  }

  function updateLock() {
    const section = document.querySelector("[data-fm-lock]");
    if (!section) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const p = reduced ? 1 : lockProgress(section);
    const grid = section.querySelector("[data-lock-grid]");
    const tiles = [...section.querySelectorAll(".fm-tile")];
    const rules = [...section.querySelectorAll("[data-lock-rule]")];
    const status = section.querySelector("[data-lock-status]");
    const line = section.querySelector(".fm-lock-status");

    const eased = 1 - Math.pow(1 - p, 2.2);
    const gap = (1 - eased) * 26;
    if (grid) grid.style.gap = gap + "px";

    const starts = [
      {r:-4.5, x:-18, y:12, s:1.08, sat:.62, hue:-12, c:.92},
      {r:3.8, x:16, y:-9, s:1.12, sat:1.24, hue:14, c:1.12},
      {r:2.7, x:-12, y:-14, s:1.06, sat:.78, hue:8, c:1.16},
      {r:-3.2, x:14, y:12, s:1.1, sat:1.16, hue:-9, c:.9}
    ];

    tiles.forEach((tile, i) => {
      const s = starts[i];
      const inv = 1 - eased;
      tile.style.transform = `translate3d(${s.x * inv}px,${s.y * inv}px,0) rotate(${s.r * inv}deg) scale(${1 + (s.s - 1) * inv})`;
      tile.style.filter = `saturate(${1 + (s.sat - 1) * inv}) hue-rotate(${s.hue * inv}deg) contrast(${1 + (s.c - 1) * inv})`;
    });

    rules.forEach((rule, i) => {
      const center = 0.2 + i * 0.18;
      const distance = Math.abs(p - center);
      const opacity = clamp(1 - distance / 0.18, 0.26, 1);
      rule.style.opacity = String(reduced ? 1 : opacity);
    });

    if (status) {
      status.textContent = p > .82 ? "LOCKED" : p > .28 ? "CONVERGING" : "DRIFT";
    }
    if (line) line.style.setProperty("--lock-line", String(eased));
  }

  function updateFolio() {
    const chapters = [...document.querySelectorAll("[data-fm-chapter]")];
    const marker = window.innerHeight * 0.36;
    let active = chapters[0];

    for (const section of chapters) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= marker) active = section;
    }

    if (!active) return;
    const [num, title] = active.dataset.fmChapter.split("|");
    const numEl = document.querySelector("[data-folio-number]");
    const titleEl = document.querySelector("[data-folio-title]");
    if (numEl) numEl.textContent = num;
    if (titleEl) titleEl.textContent = title;
  }

  let raf = 0;
  function requestUpdate() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      updateLock();
      updateFolio();
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
