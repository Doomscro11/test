(() => {
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));

  function actProgress(el) {
    const rect = el.getBoundingClientRect();
    const travel = Math.max(el.offsetHeight - window.innerHeight, 1);
    return clamp(-rect.top / travel);
  }

  function updateMobileAudit() {
    const cta = document.querySelector("[data-mobile-cta]");
    const trigger = document.querySelector(".df-flow-section");
    const close = document.querySelector("[data-df-collapse]");
    if (!cta || !trigger || !close) return;
    const visible =
      window.innerWidth <= 700 &&
      trigger.getBoundingClientRect().top < window.innerHeight * 0.55 &&
      close.getBoundingClientRect().top > window.innerHeight * 0.72;
    cta.classList.toggle("is-visible", visible);
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

    const manualCopy = act.querySelector(".df-collapse-copy");
    if (manualCopy) {
      const mobile = window.innerWidth <= 700;
      const dissolve = mobile ? clamp((q - 0.08) / 0.2) : 0;
      manualCopy.style.opacity = String(1 - dissolve);
      manualCopy.style.transform = mobile
        ? `translate3d(${-dissolve * 12}px,0,0)`
        : "";
    }

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
      updateMobileAudit();
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
