(() => {
  const progressKey = "efa-progress-v3";
  const fieldKey = "efa-field-mode-v3";
  const checkpoints = [...document.querySelectorAll("[data-checkpoint]")];
  const readProgress = () => {
    try { return JSON.parse(localStorage.getItem(progressKey) || "{}"); }
    catch { return {}; }
  };
  const updateProgress = () => {
    const progress = readProgress();
    checkpoints.forEach(input => { input.checked = Boolean(progress[input.dataset.checkpoint]); });
    const known = Math.max(8, checkpoints.length);
    const done = Object.values(progress).filter(Boolean).length;
    const percent = Math.min(100, Math.round((done / known) * 100));
    document.querySelectorAll("[data-progress-count]").forEach(el => { el.textContent = `${percent}%`; });
    document.querySelectorAll("[data-progress-ring]").forEach(el => { el.style.setProperty("--progress", `${percent}%`); });
  };
  checkpoints.forEach(input => input.addEventListener("change", () => {
    const progress = readProgress();
    progress[input.dataset.checkpoint] = input.checked;
    localStorage.setItem(progressKey, JSON.stringify(progress));
    updateProgress();
  }));

  const fieldButtons = [...document.querySelectorAll("[data-field-mode]")];
  const setFieldMode = active => {
    document.body.classList.toggle("field-mode", active);
    fieldButtons.forEach(button => button.setAttribute("aria-pressed", String(active)));
    localStorage.setItem(fieldKey, active ? "1" : "0");
  };
  fieldButtons.forEach(button => button.addEventListener("click", () => setFieldMode(!document.body.classList.contains("field-mode"))));
  setFieldMode(localStorage.getItem(fieldKey) === "1");

  const dialog = document.querySelector("[data-progress-dialog]");
  document.querySelectorAll("[data-progress-open]").forEach(button => button.addEventListener("click", () => dialog?.showModal()));
  document.querySelectorAll("[data-progress-close]").forEach(button => button.addEventListener("click", () => dialog?.close()));
  dialog?.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });

  document.querySelectorAll(".copy-command").forEach(button => button.addEventListener("click", async () => {
    const text = button.closest(".command-block")?.querySelector("pre")?.innerText || "";
    try { await navigator.clipboard.writeText(text); button.textContent = "Copied"; }
    catch { button.textContent = "Select text"; }
    setTimeout(() => { button.textContent = "Copy"; }, 1200);
  }));

  const search = document.querySelector("#task-search");
  const results = document.querySelector("[data-search-results]");
  const routes = [
    { terms: "customer cannot pull rpm package dnf repository satellite content view", title: "Customer cannot pull RPM", detail: "Satellite & Containers · Guided troubleshooting", url: "#/satellite/customer-cannot-pull-rpm" },
    { terms: "patch rhel updates lifecycle", title: "Patch RHEL", detail: "Linux Core · DNF and lifecycle", url: "#/linux/dnf" },
    { terms: "storage full disk space deleted open file", title: "Storage full", detail: "Break/Fix Field Ops · Storage evidence", url: "#/break-fix/storage-full" },
    { terms: "cpu low but server slow performance io wait memory swap", title: "CPU low but server slow", detail: "Break/Fix Field Ops · Performance evidence", url: "#/break-fix/cpu-low-server-slow" },
    { terms: "identity idm cac smart card certificate login", title: "CAC login failure", detail: "Identity / CAC · Guided troubleshooting", url: "#/identity-cac/troubleshooting" },
    { terms: "acas tenable scan credential security", title: "Credentialed scan troubleshooting", detail: "Security / ACAS · Linux credential path", url: "#/security-acas/credentialed-linux" },
    { terms: "vmware veeam backup recovery snapshot datastore", title: "VMware and recovery", detail: "VMware & Recovery · Complete curriculum", url: "#/vmware-recovery" }
  ];
  const renderResults = value => {
    if (!results) return;
    const words = value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!words.length) { results.hidden = true; return; }
    const matches = routes.map(route => ({ ...route, score: words.filter(word => `${route.terms} ${route.title}`.toLowerCase().includes(word)).length }))
      .filter(route => route.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
    results.innerHTML = matches.length ? matches.map(route => `<a class="search-result" href="${route.url}"><strong>${route.title}</strong><span>${route.detail}</span></a>`).join("") : `<div class="search-result"><strong>No direct match</strong><span>Open the complete course library to browse every module.</span></div>`;
    results.hidden = false;
  };
  search?.addEventListener("input", event => renderResults(event.target.value));
  search?.addEventListener("keydown", event => {
    if (event.key === "Enter") results?.querySelector("a")?.click();
    if (event.key === "Escape") { search.value = ""; results.hidden = true; }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "/" && search && document.activeElement !== search) { event.preventDefault(); search.focus(); }
  });
  document.querySelectorAll("[data-query]").forEach(button => button.addEventListener("click", () => {
    if (!search) return; search.value = button.dataset.query; renderResults(search.value); search.focus();
  }));
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".lane-card").forEach(card => {
      card.addEventListener("pointermove", event => {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - bounds.left}px`);
        card.style.setProperty("--my", `${event.clientY - bounds.top}px`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--mx", "50%");
        card.style.setProperty("--my", "0%");
      });
    });
  }
  document.addEventListener("click", event => { if (results && !event.target.closest(".search-shell")) results.hidden = true; });
  updateProgress();
})();
