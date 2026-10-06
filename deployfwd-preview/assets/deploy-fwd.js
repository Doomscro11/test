(() => {
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));

  function actProgress(el) {
    const rect = el.getBoundingClientRect();
    const travel = Math.max(el.offsetHeight - window.innerHeight, 1);
    return clamp(-rect.top / travel);
  }

  const liveStates = [
    {clock:"09:14", status:"INTAKE", owner:"Intake", next:"Parse RFQ", gate:"None", client:"Unchanged"},
    {clock:"09:14", status:"PARSED", owner:"Quote prep", next:"Validate specification", gate:"None", client:"Unchanged"},
    {clock:"09:15", status:"EXCEPTION", owner:"Quote prep", next:"Resolve supplier conflict", gate:"Required", client:"Unchanged"},
    {clock:"09:15", status:"AWAITING APPROVAL", owner:"Human approver", next:"Approve alternate supplier", gate:"Active", client:"Unchanged"},
    {clock:"09:17", status:"FOLLOW-UP", owner:"Supplier loop", next:"Receive ETA", gate:"Cleared", client:"Unchanged"},
    {clock:"09:23", status:"ETA CONFIRMED", owner:"Scheduler", next:"Recalculate schedule", gate:"Cleared", client:"Unchanged"},
    {clock:"09:24", status:"SCHEDULED", owner:"Client loop", next:"Prepare client status", gate:"None", client:"Pending update"},
    {clock:"09:24", status:"READY", owner:"Human approver", next:"Release client status", gate:"Release gate", client:"Ready for release"}
  ];

  function initLiveLoop() {
    const root = document.querySelector("[data-live-loop]");
    if (!root) return;
    const steps = [...root.querySelectorAll("[data-live-step]")];
    const run = root.querySelector("[data-live-run]");
    const fields = {
      clock: root.querySelector("[data-live-clock]"),
      status: root.querySelector("[data-live-state-status]"),
      owner: root.querySelector("[data-live-owner]"),
      next: root.querySelector("[data-live-next]"),
      gate: root.querySelector("[data-live-gate]"),
      client: root.querySelector("[data-live-client]"),
      progress: root.querySelector("[data-live-progress]")
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = 0;
    let current = -1;

    function render(index) {
      current = clamp(index, 0, liveStates.length - 1);
      steps.forEach((step, i) => {
        const active = i === current;
        const complete = i < current;
        step.classList.toggle("is-active", active);
        step.classList.toggle("is-complete", complete);
        step.setAttribute("aria-current", active ? "step" : "false");
      });
      const state = liveStates[current];
      if (fields.clock) fields.clock.textContent = state.clock;
      if (fields.status) fields.status.textContent = state.status;
      if (fields.owner) fields.owner.textContent = state.owner;
      if (fields.next) fields.next.textContent = state.next;
      if (fields.gate) fields.gate.textContent = state.gate;
      if (fields.client) fields.client.textContent = state.client;
      if (fields.progress) fields.progress.textContent = String(current + 1) + " / " + String(liveStates.length);
    }

    function stop(label) {
      if (timer) window.clearInterval(timer);
      timer = 0;
      if (run) {
        run.disabled = false;
        run.textContent = label || (current >= liveStates.length - 1 ? "Run again" : "Run operating loop");
      }
    }

    function continueFromGate() {
      root.classList.remove("is-gated");
      render(4);
      if (run) {
        run.disabled = true;
        run.textContent = "Running…";
      }
      timer = window.setInterval(() => {
        const next = current + 1;
        if (next >= liveStates.length) {
          stop();
          return;
        }
        render(next);
      }, 900);
    }

    function play() {
      stop();
      root.classList.remove("is-gated");
      render(0);
      if (reduced) {
        render(liveStates.length - 1);
        stop();
        return;
      }
      if (run) {
        run.disabled = true;
        run.textContent = "Running…";
      }
      timer = window.setInterval(() => {
        const next = current + 1;
        if (next >= liveStates.length) {
          stop();
          return;
        }
        render(next);
        if (next === 3) {
          window.clearInterval(timer);
          timer = 0;
          root.classList.add("is-gated");
          stop("Approve alternate supplier");
        }
      }, 900);
    }

    steps.forEach((step, i) => {
      step.addEventListener("click", () => {
        stop();
        render(i);
      });
    });
    if (run) {
      run.addEventListener("click", () => {
        if (root.classList.contains("is-gated") && current === 3) {
          continueFromGate();
        } else {
          play();
        }
      });
    }
    render(0);
  }

  function updateMobileAudit() {
    const cta = document.querySelector("[data-mobile-cta]");
    const trigger = document.querySelector(".df-flow-section");
    const live = document.querySelector(".df-live-section");
    const proof = document.querySelector(".df-proof-section");
    const close = document.querySelector("[data-df-collapse]");
    if (!cta || !trigger || !live || !proof || !close) return;
    const liveRect = live.getBoundingClientRect();
    const proofRect = proof.getBoundingClientRect();
    const liveVisible =
      liveRect.top < window.innerHeight * 0.92 &&
      liveRect.bottom > window.innerHeight * 0.08;
    const proofVisible =
      proofRect.top < window.innerHeight * 0.92 &&
      proofRect.bottom > window.innerHeight * 0.08;
    const visible =
      window.innerWidth <= 700 &&
      trigger.getBoundingClientRect().top < window.innerHeight * 0.55 &&
      close.getBoundingClientRect().top > window.innerHeight * 0.72 &&
      !liveVisible &&
      !proofVisible;
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

  initLiveLoop();

  if (window.ScrollCraft) {
    window.ScrollCraft.mount(document.body);
  }
  requestUpdate();
})();
