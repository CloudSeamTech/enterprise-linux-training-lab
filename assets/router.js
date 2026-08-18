(() => {
  const dashboard = document.querySelector("main:not(#app-view)");
  const appView = document.querySelector("#app-view");
  const progressKey = laneKey => `efa-${laneKey}-progress-v1`;
  let activeLaneKey = "linux";
  let legacyPromise;

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const route = () => location.hash.replace(/^#\/?/, "").replace(/^\/+|\/+$/g, "");
  const completed = (laneKey=activeLaneKey) => { try { return JSON.parse(localStorage.getItem(progressKey(laneKey)) || "{}"); } catch { return {}; } };
  const laneData = laneKey => laneKey === "break-fix" ? window.EFA_DATA.breakFix : (window.EFA_DATA[laneKey]||window.EFA_DATA.linux);
  const setComplete = (slug, value, laneKey=activeLaneKey) => { const state=completed(laneKey); state[slug]=value; localStorage.setItem(progressKey(laneKey), JSON.stringify(state)); updateProgress(laneKey); };
  const percent = (laneKey=activeLaneKey) => Math.round(Object.values(completed(laneKey)).filter(Boolean).length / laneData(laneKey).lessons.length * 100);
  const updateProgress = (laneKey=activeLaneKey) => {
    const value=percent(laneKey);
    document.querySelectorAll("[data-progress-count]").forEach(el => { el.textContent=`${value}%`; });
    document.querySelectorAll("[data-progress-ring]").forEach(el => { el.style.setProperty("--progress",`${value}%`); });
    const bar=document.querySelector("[data-lane-progress-bar]"); if(bar) bar.style.width=`${value}%`;
    const text=document.querySelector("[data-lane-progress-text]"); if(text) text.textContent=`${value}% complete`;
  };

  const riskClass = risk => risk.toLowerCase().replaceAll(" ", "-");
  const DangerBadge = risk => `<span class="risk-badge ${riskClass(risk)}">${esc(risk)}</span>`;
  const GlassPanel = (title, body, eyebrow="") => `<section class="lesson-glass"><div class="lesson-glass-head">${eyebrow?`<span>${esc(eyebrow)}</span>`:""}<h2>${esc(title)}</h2></div>${body}</section>`;
  const FlowDiagram = parts => `<div class="concept-flow" aria-label="Concept flow">${parts.map((part,index)=>`${index?'<span class="concept-arrow" aria-hidden="true">→</span>':''}<div class="concept-node"><span>${String(index+1).padStart(2,"0")}</span><strong>${esc(part)}</strong></div>`).join("")}</div>`;
  const CommandCard = command => `<article class="command-card">
    <header><div><span class="component-label">${esc(command.kind||"COMMAND")}</span><code>${esc(command.command)}</code></div>${DangerBadge(command.risk)}</header>
    <button class="command-copy" type="button" data-copy="${esc(command.command)}" data-copy-label="Copy ${command.kind==="CLICK PATH"?"path":"command"}">Copy ${command.kind==="CLICK PATH"?"path":"command"}</button>
    <div class="command-reason"><h3>Why are we running this?</h3><p>${esc(command.why)}</p></div>
    <div class="command-anatomy"><h3>Every piece explained</h3>${command.pieces.map(([token,meaning])=>`<div><code>${esc(token)}</code><span>${esc(meaning)}</span></div>`).join("")}</div>
    <div class="command-watch"><h3>What to watch</h3><div>${command.watch.map(item=>`<span>${esc(item)}</span>`).join("")}</div></div>
    <div class="result-pair"><div class="result good"><span>What good looks like</span><p>${esc(command.good)}</p></div><div class="result bad"><span>What bad looks like</span><p>${esc(command.bad)}</p></div></div>
    <div class="command-next"><span>Next step</span><p>${esc(command.next)}</p></div>
  </article>`;
  const ProgressBar = laneKey => `<div class="lane-progress"><div><span>Lane progress</span><strong data-lane-progress-text>${percent(laneKey)}% complete</strong></div><div class="progress-track"><span data-lane-progress-bar style="width:${percent(laneKey)}%"></span></div></div>`;

  const AppShell = (content, sidebar="") => `<div class="app-page-shell">${sidebar?`<aside class="app-sidebar app-sidebar-${activeLaneKey}">${sidebar}</aside>`:""}<div class="app-page-content">${content}</div></div>`;
  const laneNav = (laneKey,active="") => { const lane=laneData(laneKey); return `<a class="sidebar-back" href="#/">← Dashboard</a><p>${esc(lane.title)}</p>${lane.lessons.map(lesson=>`<a class="${lesson.slug===active?"active":""}" href="#/${laneKey}/${lesson.slug}"><span>${lesson.number}</span>${esc(lesson.title)}</a>`).join("")}`; };

  const moduleCard = (lesson,laneKey) => {
    const done=Boolean(completed(laneKey)[lesson.slug]);
    return `<article class="module-glass ${done?"complete":""}">
      <div class="module-glass-top"><span>${lesson.number}</span><span>${esc(lesson.category||lesson.difficulty)}</span></div>
      <h2>${esc(lesson.title)}</h2><p>${esc(lesson.description)}</p>
      <div class="module-glass-meta"><span>${esc(lesson.estimate)}</span><span>${done?"Completed":"Not started"}</span></div>
      <a href="#/${laneKey}/${lesson.slug}">${done?"Continue":"Start module"}<b>↗</b></a>
    </article>`;
  };

  const renderLinuxLane = () => {
    activeLaneKey="linux";
    const linux=window.EFA_DATA.linux;
    const hero=`<section class="routed-hero"><p class="eyebrow">Lane ${linux.number} / ${esc(linux.category)}</p><h1>${esc(linux.title)}</h1><p>Build a safe operating model first, then learn exact commands, enterprise reasons, output interpretation, controlled fixes, and proof.</p>${ProgressBar("linux")}</section>`;
    const modules=`<section class="module-catalog"><div class="catalog-heading"><div><p class="eyebrow">Start here</p><h2>Linux Core curriculum</h2></div><p>12 modules · original course content migrated into the application shell</p></div><div class="module-catalog-grid">${linux.lessons.map(lesson=>moduleCard(lesson,"linux")).join("")}</div></section>`;
    const coverage=`<section class="migration-note"><span>Content-source status</span><h2>The original course remains intact behind the presentation layer.</h2><p>Linux basics, Bash, cron, updates, lifecycle, STIG, SCAP, SELinux, storage, networking, services, packages, processes, and Break/Fix source material are loaded into the modules above. No green legacy page is opened.</p></section>`;
    appView.innerHTML=AppShell(hero+modules+coverage,laneNav("linux"));
    document.title="Linux Core · Enterprise Field Academy";
    updateProgress("linux");
  };

  const renderBreakFixLane = () => {
    activeLaneKey="break-fix";
    const lane=window.EFA_DATA.breakFix;
    const required=["storage-full","cpu-low-server-slow","high-cpu","memory-pressure","io-wait","ssh","dnf","selinux"];
    const hero=`<section class="routed-hero breakfix-hero"><p class="eyebrow">Lane ${lane.number} / ${esc(lane.category)}</p><h1>${esc(lane.title)}</h1><p>${esc(lane.description)}</p>${ProgressBar("break-fix")}</section>`;
    const modules=`<section class="module-catalog"><div class="catalog-heading"><div><p class="eyebrow">Evidence first</p><h2>Choose the customer symptom</h2></div><p>${lane.lessons.length} guided scenarios · ${required.length} priority field drills · all inside the approved application shell</p></div><div class="module-catalog-grid breakfix-grid">${lane.lessons.map(lesson=>moduleCard(lesson,"break-fix")).join("")}</div></section>`;
    const coverage=`<section class="migration-note"><span>Field operating rule</span><h2>Do not jump from symptom to fix.</h2><p>Every scenario asks what problem we are answering, why each check comes next, what every command token means, what good and bad evidence looks like, which result selects the next branch, how to make the smallest safe correction, and how to prove recovery.</p></section>`;
    appView.innerHTML=AppShell(hero+modules+coverage,laneNav("break-fix"));
    document.title="Break/Fix Field Ops · Enterprise Field Academy";
    updateProgress("break-fix");
  };

  const renderPlatformLane = laneKey => {
    activeLaneKey=laneKey;
    const lane=laneData(laneKey);
    const hero=`<section class="routed-hero platform-hero"><p class="eyebrow">Lane ${lane.number} / ${esc(lane.category)}</p><h1>${esc(lane.title)}</h1><p>${esc(lane.description)}</p>${ProgressBar(laneKey)}</section>`;
    const modules=`<section class="module-catalog"><div class="catalog-heading"><div><p class="eyebrow">Complete curriculum</p><h2>${esc(lane.title)} learning path</h2></div><p>${lane.lessons.length} guided modules · preserved source material · vendor-workflow safety</p></div><div class="module-catalog-grid">${lane.lessons.map(item=>moduleCard(item,laneKey)).join("")}</div></section>`;
    const coverage=`<section class="migration-note"><span>Migration complete</span><h2>Original course material, new permanent shell.</h2><p>The preserved course and embedded hands-on lab are loaded as content behind these modules. Every procedure adds simple-first context, exact command or click-path anatomy, evidence gates, change risk, recovery, and proof without returning to the legacy presentation.</p></section>`;
    appView.innerHTML=AppShell(hero+modules+coverage,laneNav(laneKey));
    document.title=`${lane.title} · Enterprise Field Academy`;
    updateProgress(laneKey);
  };

  const renderDecisionTree = () => `<div class="decision-tree">
    <button type="button" class="tree-node root" data-tree-toggle="load">START · uptime</button>
    <div class="tree-branch" data-tree-branch="load"><span>Is load high?</span><div><button type="button" data-tree-toggle="yes-load">YES · inspect top</button><button type="button" data-tree-toggle="no-load">NO · inspect wait/dependency path</button></div></div>
    <div class="tree-branch" data-tree-branch="yes-load" hidden><span>Which work is runnable or blocked?</span><p>Use <code>top</code> and <code>vmstat 1 5</code>. High r points toward scheduling; high b points toward a wait.</p></div>
    <div class="tree-branch" data-tree-branch="no-load" hidden><span>What does vmstat prove?</span><div><b>high wa → storage</b><b>si/so → memory pressure</b><b>quiet counters → app/network/DNS/logs</b></div></div>
  </div>`;

  const renderScenarioTree = lesson => {
    if(lesson.slug==="cpu-low-server-slow") return renderDecisionTree();
    const branches=lesson.parts.slice(0,3);
    return `<div class="decision-tree scenario-tree">
      <button type="button" class="tree-node root" data-tree-toggle="bf-start">START · reproduce and timestamp the symptom</button>
      <div class="tree-branch" data-tree-branch="bf-start" hidden><span>Did the first read-only check reproduce abnormal evidence?</span><div><button type="button" data-tree-toggle="bf-yes">YES · follow the evidence owner</button><button type="button" data-tree-toggle="bf-no">NO · verify scope and time window</button></div></div>
      <div class="tree-branch" data-tree-branch="bf-yes" hidden><span>Supported branches</span><div>${branches.map(part=>`<b>${esc(part)}</b>`).join("")}</div><p>Choose only the branch supported by the command output and the customer timestamp.</p></div>
      <div class="tree-branch" data-tree-branch="bf-no" hidden><span>Do not force a cause</span><p>Repeat the exact customer action, confirm the correct host/service, widen the bounded time window, and compare with a healthy baseline.</p></div>
    </div>`;
  };

  const renderLesson = async (lesson,laneKey="linux") => {
    activeLaneKey=laneKey;
    const lane=laneData(laneKey);
    const routeBase=laneKey;
    const done=Boolean(completed(laneKey)[lesson.slug]);
    const breadcrumb=`<nav class="lesson-breadcrumb" aria-label="Breadcrumb"><a href="#/">Dashboard</a><span>›</span><a href="#/${routeBase}">${esc(lane.title)}</a><span>›</span><strong>${esc(lesson.title)}</strong></nav>`;
    const hero=`<section class="lesson-hero"><div><p class="eyebrow">${laneKey==="break-fix"?"Scenario":"Module"} ${lesson.number} / ${esc(lesson.difficulty)}</p><h1>${esc(lesson.title)}</h1><p class="lesson-goal"><span>What are we trying to figure out?</span>${esc(lesson.goal)}</p></div><div class="lesson-status"><span>${esc(lesson.estimate)}</span>${DangerBadge("READ ONLY")}<button type="button" data-complete="${esc(lesson.slug)}" data-complete-lane="${laneKey}" aria-pressed="${done}">${done?"Completed ✓":"Mark complete"}</button></div></section>`;
    const sections=[
      GlassPanel("The simple picture",`<p class="plain-picture">${esc(lesson.simple)}</p>`,`01`),
      GlassPanel("What parts are involved",FlowDiagram(lesson.parts),`02`),
      GlassPanel("Why this matters in an enterprise",`<p>${esc(lesson.enterprise)}</p>`,`03`),
      GlassPanel("Where am I?",`<div class="location-chip"><span>Working surface</span><strong>${esc(lesson.location)}</strong></div>`,`04`),
      GlassPanel("Step-by-step procedure",`<ol class="guided-steps">${lesson.steps.map(step=>`<li>${esc(step)}</li>`).join("")}</ol>`,`05`),
      GlassPanel("Command anatomy",lesson.commands.map(CommandCard).join(""),`06`),
      GlassPanel("What good looks like",`<div class="outcome good"><p>${esc(lesson.good)}</p></div>`,`07`),
      GlassPanel("What bad looks like",`<div class="outcome bad"><p>${esc(lesson.bad)}</p></div>`,`08`),
      GlassPanel("Why this result leads to the next step",`<p>${esc(lesson.next)}</p>`,`09`),
      GlassPanel("Safe fix",`<div class="safe-fix">${DangerBadge("CHANGES SYSTEM")}<p>${esc(lesson.safeFix)}</p></div>`,`10`),
      GlassPanel("Prove the fix",`<p>${esc(lesson.prove)}</p>`,`11`),
      GlassPanel("Dangerous shortcuts",`<div class="danger-list">${lesson.dangers.map(danger=>`<div>${DangerBadge(danger.toLowerCase().includes("rm -rf")?"DESTRUCTIVE":"HIGH RISK")}<p>${esc(danger)}</p></div>`).join("")}</div>`,`12`),
      GlassPanel("Knowledge check",`<details class="knowledge-check"><summary>${esc(lesson.quiz.question)}</summary><p>${esc(lesson.quiz.answer)}</p></details>`,`13`)
    ];
    if(lesson.slug==="break-fix-labs") sections.splice(5,0,GlassPanel("Interactive troubleshooting path",renderDecisionTree(),"FIELD TREE"));
    if(laneKey==="break-fix") sections.splice(5,0,GlassPanel("Choose the next evidence branch",renderScenarioTree(lesson),"FIELD TREE"));
    const sourceId=`source-${lesson.slug}`;
    sections.push(GlassPanel("Migrated original course material",`<p class="source-intro">This section is loaded from the preserved legacy HTML as content only. Its old styles, navigation, and scripts are not used.</p><div id="${sourceId}" class="migrated-source"><div class="source-loading">Loading preserved training material…</div></div>`,`SOURCE`));
    const next=nextLesson(lesson,laneKey);
    const content=breadcrumb+hero+`<div class="lesson-stack">${sections.join("")}</div><nav class="lesson-footer-nav"><a href="#/${routeBase}">← All ${esc(lane.title)} ${laneKey==="break-fix"?"scenarios":"modules"}</a><a href="#/${routeBase}/${next.slug}">Next: ${esc(next.title)} →</a></nav>`;
    appView.innerHTML=AppShell(content,laneNav(laneKey,lesson.slug));
    document.title=`${lesson.title} · ${lane.title} · Enterprise Field Academy`;
    updateProgress(laneKey);
    const source=document.querySelector(`#${sourceId}`);
    try { source.innerHTML=await getMigratedSource(lesson); } catch(error) { source.innerHTML=`<p class="source-error">The preserved source could not be loaded. The structured lesson above remains available.</p>`; }
  };

  const nextLesson = (lesson,laneKey="linux") => { const list=laneData(laneKey).lessons; return list[(list.indexOf(lesson)+1)%list.length]; };
  const scrub = node => {
    const clone=node.cloneNode(true);
    clone.querySelectorAll("script,style,iframe,nav,.moduleFooter,.moduleControls").forEach(el=>el.remove());
    clone.querySelectorAll("[id]").forEach(el=>el.removeAttribute("id"));
    clone.querySelectorAll("[style]").forEach(el=>el.removeAttribute("style"));
    return clone;
  };
  const loadLegacy = async () => {
    if(legacyPromise) return legacyPromise;
    legacyPromise=(async()=>{
      const html=await fetch("legacy-course.html").then(response=>{ if(!response.ok) throw new Error("source unavailable"); return response.text(); });
      const doc=new DOMParser().parseFromString(html,"text/html");
      const iframe=doc.querySelector('iframe[src^="data:text/html;base64,"]');
      let labDoc=null;
      if(iframe){
        const encoded=iframe.getAttribute("src").split(",",2)[1];
        const bytes=Uint8Array.from(atob(encoded),character=>character.charCodeAt(0));
        labDoc=new DOMParser().parseFromString(new TextDecoder().decode(bytes),"text/html");
      }
      return {doc,labDoc};
    })();
    return legacyPromise;
  };
  const getMigratedSource = async lesson => {
    const {doc,labDoc}=await loadLegacy();
    const holder=document.createElement("div");
    const headings=[];
    if(lesson.sourceSections){
      lesson.sourceSections.forEach(id=>{ const section=doc.querySelector(`#${CSS.escape(id)}`); if(section){ const clean=scrub(section); clean.className="source-section"; holder.append(clean); } });
    }
    const sourceRoots=(lesson.sourceRoots||[lesson.sourceRoot||"#linux"]).map(selector=>doc.querySelector(selector)).filter(Boolean);
    if(lesson.sourceLessonTerms?.length){
      sourceRoots.flatMap(root=>[...root.querySelectorAll(".lesson")]).forEach(candidate=>{
        if(lesson.sourceLessonTerms.some(term=>candidate.textContent.toLowerCase().includes(term.toLowerCase()))){ const clean=scrub(candidate); clean.classList.add("source-lesson"); holder.append(clean); }
      });
    }
    if(lesson.sourceTerms?.length){
      const candidates=sourceRoots.flatMap(root=>[...root.querySelectorAll(".kid,.command,h2,h3,.table,.warn,.danger,.why,.proof")]);
      candidates.forEach(candidate=>{ if(lesson.sourceTerms.some(term=>candidate.textContent.toLowerCase().includes(term.toLowerCase()))){ holder.append(scrub(candidate)); } });
    }
    if(labDoc && lesson.labModules){
      const modules=[...labDoc.querySelectorAll(".module")];
      lesson.labModules.forEach(index=>{ if(modules[index]){ const clean=scrub(modules[index]); clean.classList.add("source-lab-module"); holder.append(clean); } });
    }
    if(!holder.children.length) return `<p>No additional source fragment was mapped to this lesson.</p>`;
    return holder.innerHTML;
  };

  const renderNotFound = () => { appView.innerHTML=`<section class="routed-hero"><p class="eyebrow">Route not found</p><h1>That training view is not available.</h1><a class="button" href="#/">Return to dashboard</a></section>`; };

  const renderRoute = async () => {
    const current=route();
    if(!current){ dashboard.hidden=false; appView.hidden=true; document.title="Enterprise Field Academy"; window.scrollTo(0,0); return; }
    dashboard.hidden=true; appView.hidden=false; appView.innerHTML=`<div class="route-loading"><span></span><p>Loading training view…</p></div>`;
    const parts=current.split("/");
    if(parts[0]==="linux"){
      if(parts.length===1) renderLinuxLane();
      else {
        const aliases={files:"files-directories",permissions:"users-permissions",network:"networking",packages:"dnf",services:"systemd"};
        const slug=aliases[parts[1]]||parts[1];
        const lesson=window.EFA_DATA.linux.lessons.find(item=>item.slug===slug);
        if(lesson) await renderLesson(lesson,"linux"); else renderNotFound();
      }
    } else if(parts[0]==="break-fix"){
      if(parts.length===1) renderBreakFixLane();
      else {
        const aliases={"cpu-low":"cpu-low-server-slow","storage":"storage-full","packages":"dnf","security":"selinux"};
        const slug=aliases[parts[1]]||parts[1];
        const lesson=window.EFA_DATA.breakFix.lessons.find(item=>item.slug===slug);
        if(lesson) await renderLesson(lesson,"break-fix"); else renderNotFound();
      }
    } else if(window.EFA_DATA[parts[0]]?.lessons){
      const laneKey=parts[0];
      if(parts.length===1) renderPlatformLane(laneKey);
      else {
        const lesson=window.EFA_DATA[laneKey].lessons.find(item=>item.slug===parts[1]);
        if(lesson) await renderLesson(lesson,laneKey); else renderNotFound();
      }
    } else renderNotFound();
    window.scrollTo(0,0);
  };

  document.addEventListener("click", async event => {
    const completeButton=event.target.closest("[data-complete]");
    if(completeButton){ const slug=completeButton.dataset.complete; const laneKey=completeButton.dataset.completeLane||activeLaneKey; const value=completeButton.getAttribute("aria-pressed")!=="true"; setComplete(slug,value,laneKey); completeButton.setAttribute("aria-pressed",String(value)); completeButton.textContent=value?"Completed ✓":"Mark complete"; }
    const copyButton=event.target.closest("[data-copy]");
    if(copyButton){ try{ await navigator.clipboard.writeText(copyButton.dataset.copy); copyButton.textContent="Copied"; }catch{ copyButton.textContent="Select text";} setTimeout(()=>copyButton.textContent=copyButton.dataset.copyLabel||"Copy command",1200); }
    const treeButton=event.target.closest("[data-tree-toggle]");
    if(treeButton){ const branch=document.querySelector(`[data-tree-branch="${CSS.escape(treeButton.dataset.treeToggle)}"]`); if(branch) branch.hidden=!branch.hidden; }
  });
  window.addEventListener("hashchange",renderRoute);
  renderRoute();
})();
