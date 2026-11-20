/* =========================================================================
   core.js: shared layout, helpers, theme, scroll, reveal and site search.
   Loaded on every page after data.js and before pages.js.
   ========================================================================= */
window.UI = (function () {
  "use strict";
  const D = window.PORTFOLIO, P = D.profile;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const page = document.body.dataset.page || "home";
  const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").toLowerCase();
  const isMe = n => (P.authorMatch || []).some(m => norm(n).includes(norm(m)));
  const pad2 = n => String(n).padStart(2, "0");

  const rich = s => esc(s)
    .replace(/\*([^*]+)\*/g, '<em class="it">$1</em>')
    .replace(/\{([^}]+)\}/g, '<span class="hl">$1</span>')
    .replace(/_([^_]+)_/g, '<span class="ul">$1<svg viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true"><use href="#squiggle"/></svg></span>');
  const set = (id, html) => { const el = typeof id === "string" ? document.getElementById(id) : id; if (el) el.innerHTML = html; return el; };
  const txt = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; return el; };

  /* ---------- publication helpers ---------- */
  const pubs = D.publications;
  const pubLink = p => p.doi ? "https://doi.org/" + p.doi : (p.url || "");
  const pubIsFirst = p => p.first != null ? p.first : isMe(p.authors.split(",")[0]);
  const typeLabel = { journal: "Journal", conference: "Conference", review: "Under review", thesis: "Thesis" };

  /* ---------- layout ---------- */
  const NAV_L = [["index.html", "Home", "home"], ["about.html", "About", "about"], ["blog.html", "Blog", "blog"], ["consultancy.html", "Consultancy", "consultancy"]];
  const NAV_R = [["research.html", "Research", "research"], ["teaching.html", "Teaching", "teaching"], ["development.html", "Development", "development"]];
  const navLink = ([h, l, k]) => `<a href="${h}"${k === page ? ' class="is-active" aria-current="page"' : ""}>${l}</a>`;
  const parts = P.name.split(" ");

  function layout() {
    document.body.insertAdjacentHTML("afterbegin", `
      <a class="skip" href="#main">Skip to content</a>
      <div class="progress" id="progress"></div>
      <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><path id="squiggle" d="M3 9 C 40 3, 90 4, 140 6 S 240 10, 297 4" /></defs></svg>
      <header class="nav" id="nav">
        <nav class="nav__side nav__side--l" aria-label="Primary">${NAV_L.map(navLink).join("")}</nav>
        <a href="index.html" class="nav__logo" aria-label="${esc(P.name)}, home">
          <span class="logo-mark">${esc(P.initials)}</span>
          <span class="nav__name">${esc(parts.slice(0, -1).join(" "))} <b>${esc(parts[parts.length - 1])}</b></span>
        </a>
        <div class="nav__right">
          <nav class="nav__side nav__side--r" aria-label="Secondary">${NAV_R.map(navLink).join("")}</nav>
          <div class="nav__actions">
            <a href="index.html#contact" class="btn btn--cy btn--sm nav__cta">Let's talk <span class="arr">↗</span></a>
            <button class="iconbtn" id="cmdOpen" aria-label="Search the site (Ctrl K)" title="Search  ⌘K">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            </button>
            <button class="iconbtn" id="themeToggle" aria-label="Toggle dark mode">
              <svg class="i-sun" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
              <svg class="i-moon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
            </button>
            <button class="iconbtn nav__burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="mnav"><span></span><span></span></button>
          </div>
        </div>
      </header>
      <div class="mnav" id="mnav">
        ${[...NAV_L, ...NAV_R].map(navLink).join("")}
        <a href="index.html#contact" class="mnav__cta">Let's talk ↗</a>
      </div>`);

    const year = new Date().getFullYear();
    document.body.insertAdjacentHTML("beforeend", `
      <footer class="footer">
        <div class="wrap">
          <div class="fcta">
            <div><p class="label">Let's work together</p><p class="fcta__t">Have a project, a paper or a <em class="it">question?</em></p></div>
            <a class="btn btn--cy btn--lg" href="mailto:${esc(P.email)}">${esc(P.email)} <span class="arr">↗</span></a>
          </div>
          <div class="fcols">
            <div><h4 class="mono">Pages</h4>${[...NAV_L, ...NAV_R].map(l => `<a href="${l[0]}">${l[1]}</a>`).join("")}</div>
            <div><h4 class="mono">Profiles</h4>${P.socials.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join("")}</div>
            <div><h4 class="mono">Contact</h4><a href="mailto:${esc(P.email)}">${esc(P.email)}</a><span>${esc(P.affiliation)}</span><span>${esc(P.location)}</span><a href="${esc(P.cv)}" target="_blank" rel="noopener">Download CV ↗</a></div>
          </div>
        </div>
        <span class="footer__big" aria-hidden="true">${esc(P.shortName)}<b>.</b></span>
        <div class="wrap footer__row mono"><span>© ${year} ${esc(P.name)}</span><span>Design · Develop · Deploy</span><a href="#main">Back to top ↑</a></div>
      </footer>
      <div class="cmd" id="cmd" hidden>
        <div class="cmd__backdrop" data-close></div>
        <div class="cmd__panel" role="dialog" aria-modal="true" aria-label="Search the site">
          <div class="cmd__bar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input class="cmd__input" id="cmdInput" placeholder="Search papers, projects, courses, skills…" autocomplete="off" spellcheck="false" aria-controls="cmdList" />
            <kbd class="mono">esc</kbd>
          </div>
          <ul class="cmd__list" id="cmdList" role="listbox"></ul>
          <div class="cmd__foot mono"><span>↑↓ move</span><span>↵ open</span><span id="cmdCount"></span></div>
        </div>
      </div>`);
  }

  /* ---------- search index ---------- */
  let INDEX = [];
  function buildIndex() {
    const add = (type, title, sub, url, extra = "", weight = 0) => INDEX.push({ type, title, sub, url, weight, hay: norm([title, sub, extra].join(" ")), tnorm: norm(title) });
    [["index.html", "Home"], ["about.html", "About & CV"], ["blog.html", "Blog"], ["research.html", "Research & publications"], ["development.html", "Development"], ["teaching.html", "Teaching"], ["consultancy.html", "Consultancy & services"], ["research.html#grants", "Grants & funding"], ["index.html#contact", "Contact"]]
      .forEach(([u, t]) => add("Page", t, "", u, t === "Contact" ? `${P.email} ${P.location} ${P.affiliation} email` : t === "About & CV" ? P.bio.join(" ") : "", 3));
    pubs.forEach(p => add(p.type === "review" ? "Under review" : typeLabel[p.type], p.title, `${p.venue} · ${p.year}`, `research.html#p-${p.id}`, `${p.authors} ${(p.tags || []).join(" ")} ${p.details || ""} ${p.doi || ""} ${p.award || ""} ${p.q || ""}`, 2));
    D.areas.items.forEach(a => add("Research area", a.title, a.text, a.match.length ? `research.html?topic=${encodeURIComponent(a.match[0])}` : "index.html#areas", a.match.join(" "), 1));
    D.grants.forEach(g => add("Grant", g.title, `${g.code} · ${g.amount}`, "research.html#grants", `${g.funder} ${g.role} ${g.text}`, 1));
    D.products.forEach(p => add("Development", p.name, p.field, "development.html#products", p.blurb));
    D.clients.forEach(c => add("Client", c.name, c.what, "development.html#clients", c.url));
    D.courses.forEach(c => add("Course", c.title, `${c.where} · ${c.when}`, "teaching.html#courses", `${c.sub} ${c.text} ${c.repos.map(r => r.label).join(" ")}`));
    D.fyps.forEach(f => add("Student project", f.name, f.what, "teaching.html#fyps", f.kind));
    D.committees.forEach(c => add("Committee", c.name, `${c.role} · ${c.level}`, "teaching.html#committees"));
    D.services.forEach(v => add("Service", v.title, "Consultancy", "consultancy.html#services", `${v.text} ${v.deliver.join(" ")}`, 2));
    D.experience.forEach(e => add("Experience", e.role, `${e.org} · ${e.period}`, "about.html#journey", e.points.join(" ")));
    D.education.forEach(e => add("Education", e.degree, `${e.school} · ${e.years}`, "about.html#education", `${e.note} ${e.detail}`));
    D.honors.forEach(h => add("Honour", h.title, `${h.org} · ${h.year}`, "about.html#honors", h.text));
    D.skills.forEach(s => s.items.forEach(i => add("Skill", i, s.group, "about.html#skills")));
    D.certifications.forEach(c => add("Certification", c.group, c.when, "about.html#certifications", c.items));
    D.posts.forEach(n => add("Blog", n.title, `${n.tag} · ${n.date}`, n.body ? `blog.html?p=${encodeURIComponent(n.id)}` : `blog.html#b-${n.id}`, `${n.summary || ""} ${(n.body || []).join(" ")}`));
    P.socials.forEach(s => add("Profile", s.label, s.url.replace(/^https?:\/\//, ""), s.url));
    add("Action", "Download CV", "PDF", P.cv, "resume curriculum vitae", 2);
    add("Action", "Copy email address", P.email, "#copy-email", "contact mail", 2);
    add("Action", "Toggle dark mode", "", "#toggle-theme", "theme light", 1);
  }
  function search(q) {
    const toks = norm(q).split(/\s+/).filter(Boolean);
    if (!toks.length) return INDEX.filter(i => i.type === "Page" || i.type === "Action");
    const out = [];
    for (const it of INDEX) {
      let score = it.weight, ok = true;
      for (const t of toks) {
        const at = it.hay.indexOf(t);
        if (at < 0) { ok = false; break; }
        if (it.tnorm.startsWith(t)) score += 6;
        else if (it.tnorm.includes(" " + t)) score += 4;
        else if (it.tnorm.includes(t)) score += 3;
        else score += 1;
      }
      if (ok) out.push([score, it]);
    }
    return out.sort((a, b) => b[0] - a[0]).map(x => x[1]);
  }

  function setupSearch() {
    const cmd = $("#cmd"), input = $("#cmdInput"), list = $("#cmdList"), count = $("#cmdCount");
    let items = [], sel = 0, lastFocus = null;
    const hlq = (s, q) => {
      let h = esc(s);
      norm(q).split(/\s+/).filter(t => t.length > 1).forEach(t => {
        const n = norm(s), i = n.indexOf(t);
        if (i >= 0) { const raw = s.slice(i, i + t.length); h = h.replace(esc(raw), `<mark>${esc(raw)}</mark>`); }
      });
      return h;
    };
    const draw = () => {
      const q = input.value.trim();
      const shown = items.slice(0, 60);
      let html = shown.map((it, i) => `<li role="option" class="${i === sel ? "is-sel" : ""}" data-i="${i}" aria-selected="${i === sel}">
          <span class="cmd__t">${hlq(it.title, q)}${it.sub ? `<small>${hlq(it.sub, q)}</small>` : ""}</span><span class="cmd__k">${esc(it.type)}</span></li>`).join("");
      if (q && !items.length) html = `<li class="cmd__empty">No results for “${esc(q)}”.</li>`;
      if (q) html += `<li class="cmd__all" data-all="1"><span class="cmd__t">Search all publications for “${esc(q)}”</span><span class="cmd__k">↵ ⇧</span></li>`;
      list.innerHTML = html;
      count.textContent = q ? `${items.length} result${items.length === 1 ? "" : "s"}` : "type to search";
      const s = $(".is-sel", list); if (s) s.scrollIntoView({ block: "nearest" });
    };
    const open = (q = "") => { lastFocus = document.activeElement; cmd.hidden = false; document.body.classList.add("no-scroll"); input.value = q; items = search(q); sel = 0; draw(); requestAnimationFrame(() => input.focus()); };
    const close = () => { cmd.hidden = true; document.body.classList.remove("no-scroll"); if (lastFocus) lastFocus.focus(); };
    const go = it => {
      close();
      if (it.url === "#copy-email") return copyEmail();
      if (it.url === "#toggle-theme") return toggleTheme();
      navigate(it.url);
    };
    const searchAll = () => { close(); location.href = "research.html?q=" + encodeURIComponent(input.value.trim()); };

    $("#cmdOpen").addEventListener("click", () => open());
    $$("[data-open-search]").forEach(b => b.addEventListener("click", () => open()));
    document.addEventListener("keydown", e => {
      const typing = /input|textarea|select/i.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); cmd.hidden ? open() : close(); return; }
      if (e.key === "/" && cmd.hidden && !typing) {
        e.preventDefault();
        const local = $("#pubSearch");
        if (local) { local.focus(); local.select(); } else open();
        return;
      }
      if (cmd.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(Math.min(items.length, 60) - 1, sel + 1); draw(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
      else if (e.key === "Enter") { e.preventDefault(); if (e.shiftKey || !items.length) { if (input.value.trim()) searchAll(); } else go(items[sel]); }
      else if (e.key === "Tab") { e.preventDefault(); input.focus(); }
    });
    input.addEventListener("input", () => { items = search(input.value); sel = 0; draw(); });
    list.addEventListener("click", e => {
      const li = e.target.closest("li"); if (!li) return;
      if (li.dataset.all) return searchAll();
      if (li.dataset.i != null) go(items[+li.dataset.i]);
    });
    list.addEventListener("mousemove", e => { const li = e.target.closest("li[data-i]"); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; $$("li[data-i]", list).forEach(x => x.classList.toggle("is-sel", x === li)); } });
    cmd.addEventListener("click", e => { if (e.target.hasAttribute("data-close")) close(); });
    return { open };
  }

  /* go to url; if it's an anchor on this page, scroll + flash */
  function navigate(url) {
    if (/^https?:|\.pdf$/.test(url)) { window.open(url, "_blank", "noopener"); return; }
    const [path, hash] = url.split("#");
    const here = location.pathname.split("/").pop() || "index.html";
    if ((path || "index.html") === here && hash) { history.replaceState(null, "", "#" + hash); focusTarget(hash); }
    else location.href = url;
  }
  function focusTarget(id) {
    if (window.UI.beforeFocus) window.UI.beforeFocus(id);
    const el = document.getElementById(id); if (!el) return;
    el.classList.add("is-in");
    $$(".rv", el).forEach(x => x.classList.add("is-in"));
    const isItem = !el.matches("section");
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: isItem ? "center" : "start" });
    if (isItem) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
  }

  /* ---------- theme, copy, nav, reveal ---------- */
  function toggleTheme() {
    const r = document.documentElement, next = r.dataset.theme === "dark" ? "light" : "dark";
    r.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  }
  function toast(msg) {
    let t = $("#toast");
    if (!t) { document.body.insertAdjacentHTML("beforeend", '<div class="toast" id="toast" role="status" aria-live="polite"></div>'); t = $("#toast"); }
    t.textContent = msg; t.classList.add("on");
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), 2200);
  }
  async function copyText(s, msg = "Copied") {
    try { await navigator.clipboard.writeText(s); toast(msg + " ✓"); return true; }
    catch (e) {
      const ta = document.createElement("textarea"); ta.value = s; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (_) {}
      ta.remove(); toast(ok ? msg + " ✓" : "Couldn't copy"); return ok;
    }
  }
  const copyEmail = () => copyText(P.email, "Email copied");

  const scrollFns = [];
  function onScroll(fn) { scrollFns.push(fn); }
  function setupScroll() {
    const nav = $("#nav"), bar = $("#progress"), mnav = $("#mnav"), burger = $("#burger");
    let lastY = scrollY, ticking = false;
    const update = () => {
      const y = scrollY, vh = innerHeight, h = document.documentElement.scrollHeight - vh;
      bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
      if (y > 300 && y > lastY + 6 && !mnav.classList.contains("is-open")) nav.classList.add("is-hidden");
      else if (y < lastY - 6 || y < 300) nav.classList.remove("is-hidden");
      lastY = y;
      scrollFns.forEach(f => f(vh));
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update);
    update();
    burger.addEventListener("click", () => { const o = mnav.classList.toggle("is-open"); burger.setAttribute("aria-expanded", o); });
    $$("a", mnav).forEach(a => a.addEventListener("click", () => { mnav.classList.remove("is-open"); burger.setAttribute("aria-expanded", false); }));
    document.addEventListener("click", e => { if (mnav.classList.contains("is-open") && !e.target.closest("#mnav, #burger")) { mnav.classList.remove("is-open"); burger.setAttribute("aria-expanded", false); } });
    $("#themeToggle").addEventListener("click", toggleTheme);
  }

  let io;
  function observe(root = document) {
    if (!io) io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add("is-in");
      $$("[data-count]", el).forEach(countUp);
      $$(".viz--ring .fg", el).forEach(c => c.style.strokeDasharray = `${c.dataset.seg} 999`);
      io.unobserve(el);
    }), { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    $$(".rv:not(.is-in)", root).forEach(el => io.observe(el));
  }
  function countUp(el) {
    if (el._done) return; el._done = true;
    const to = +el.dataset.count, dec = +el.dataset.dec || 0;
    const fmt = v => dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US");
    if (reduced) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1600;
    const f = now => { const k = clamp((now - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }
  function magnetic() {
    if (!fine || reduced) return;
    $$(".magnetic").forEach(b => {
      b.addEventListener("mousemove", e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`; });
      b.addEventListener("mouseleave", () => b.style.transform = "");
    });
  }

  /* ---------- boot (called by pages.js after rendering) ---------- */
  function boot() {
    buildIndex();
    const s = setupSearch();
    setupScroll();
    observe();
    magnetic();
    $$("[data-copy-email]").forEach(b => b.addEventListener("click", copyEmail));
    const ready = () => {
      document.body.classList.add("is-ready");
      if (location.hash.length > 1) setTimeout(() => focusTarget(decodeURIComponent(location.hash.slice(1))), 250);
    };
    (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, wait(1200)]) : wait(0)).then(() => requestAnimationFrame(ready));
    addEventListener("hashchange", () => focusTarget(decodeURIComponent(location.hash.slice(1))));
    return s;
  }

  layout();
  return { D, P, $, $$, esc, rich, set, txt, clamp, wait, reduced, fine, page, norm, isMe, pad2, pubs, pubLink, pubIsFirst, typeLabel,
    onScroll, observe, countUp, copyText, copyEmail, toast, navigate, focusTarget, boot, beforeFocus: null };
})();
