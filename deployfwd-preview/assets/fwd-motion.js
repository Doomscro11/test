(() => {
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));

  function lockProgress(section) {
    const rect = section.getBoundingClientRect();
    const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
    return clamp(-rect.top / travel);
  }

  function updateMobileReview() {
    const cta = document.querySelector("[data-mobile-cta]");
    const trigger = document.querySelector("#problem");
    const stage = document.querySelector(".fm-lock-stage");
    const close = document.querySelector("#close");
    if (!cta || !trigger || !stage || !close) return;
    const stageRect = stage.getBoundingClientRect();
    const stageVisible =
      stageRect.top < window.innerHeight * 0.92 &&
      stageRect.bottom > window.innerHeight * 0.08;
    const visible =
      window.innerWidth <= 700 &&
      trigger.getBoundingClientRect().top < window.innerHeight * 0.55 &&
      close.getBoundingClientRect().top > window.innerHeight * 0.72 &&
      !stageVisible;
    cta.classList.toggle("is-visible", visible);
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
      {r:-4.5, x:-18, y:12, s:1.08},
      {r:3.8, x:16, y:-9, s:1.12},
      {r:2.7, x:-12, y:-14, s:1.06},
      {r:-3.2, x:14, y:12, s:1.1}
    ];
    const mergeStarts = [0.16, 0.34, 0.52, 0.7];

    tiles.forEach((tile, i) => {
      const start = mergeStarts[i];
      const merge = reduced ? 1 : clamp((p - start) / 0.18);
      const align = reduced ? 1 : clamp((p - Math.max(0, start - 0.12)) / 0.3);
      const state = starts[i];
      const inv = 1 - align;
      tile.style.setProperty("--lock-merge", String(merge));
      tile.style.transform = `translate3d(${state.x * inv}px,${state.y * inv}px,0) rotate(${state.r * inv}deg) scale(${1 + (state.s - 1) * inv})`;
      tile.style.filter = "none";
    });

    rules.forEach((rule, i) => {
      const center = 0.2 + i * 0.18;
      const distance = Math.abs(p - center);
      const opacity = clamp(1 - distance / 0.18, 0.26, 1);
      rule.style.opacity = String(reduced ? 1 : opacity);
    });

    if (status) {
      status.textContent = p > .88 ? "LOCKED" : p > .28 ? "CONVERGING" : "DRIFT";
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
      updateMobileReview();
    });
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("load", requestUpdate);

  document.querySelectorAll("[data-copy-email]").forEach((button) => {
    button.addEventListener("click", async () => {
      const email = button.getAttribute("data-copy-email") || "";
      const status = button.parentElement && button.parentElement.querySelector("[data-copy-status]");
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
        } else {
          const input = document.createElement("input");
          input.value = email;
          input.setAttribute("readonly", "");
          input.style.position = "fixed";
          input.style.opacity = "0";
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          input.remove();
        }
        if (status) status.textContent = "Copied";
      } catch (_) {
        if (status) status.textContent = email;
      }
    });
  });

  if (window.ScrollCraft) {
    window.ScrollCraft.mount(document.body);
  }
  requestUpdate();
})();
