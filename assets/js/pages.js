/* =========================================================================
   pages.js: renders each page from data.js, then boots shared behaviour.
   ========================================================================= */
(function () {
  "use strict";
  const U = window.UI, D = U.D, P = U.P, { $, $$, esc, rich, set, txt, clamp, reduced, pad2 } = U;

  /* ================= shared components ================= */
  const pheroHTML = ({ label, title, lead, crumb, side = "", meta = "" }) => `
    <div class="wrap phero__in">
      <div class="phero__text">
        <nav class="crumbs mono rv" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><span aria-current="page">${esc(crumb)}</span></nav>
        <p class="label rv">${esc(label)}</p>
        <h1 class="h-xxl rv" style="--d:.05s">${rich(title)}</h1>
        ${lead ? `<p class="lead rv" style="--d:.12s">${esc(lead)}</p>` : ""}
        ${meta}
      </div>
      ${side}
    </div>
    <div class="phero__deco" aria-hidden="true"><i></i><i></i><i></i><span class="phero__sweep"></span></div>`;
  const secHead = (label, title, blurb = "", extra = "") => `
    <div class="split-head">
      <div><p class="label rv">${esc(label)}</p><h2 class="h-xl rv">${rich(title)}</h2></div>
      ${blurb ? `<p class="lead rv">${esc(blurb)}</p>` : extra}
    </div>`;
  const statTiles = arr => `<div class="tiles rv" style="--d:.2s">${arr.map(s => `
      <div class="tile"><b><span data-count="${s.v}" data-dec="${s.dec || 0}">0</span>${s.suf ? `<small>${esc(s.suf)}</small>` : ""}</b><span class="mono">${esc(s.l)}</span></div>`).join("")}</div>`;

  const published = U.pubs.filter(p => p.type === "journal" || p.type === "conference");
  const q1 = U.pubs.filter(p => p.q === "Q1");
  const sumIF = U.pubs.reduce((a, p) => a + (p.ifv || 0), 0);
  const firsts = U.pubs.filter(p => U.pubIsFirst(p) && p.type !== "thesis");
  const reviews = U.pubs.filter(p => p.type === "review");

  /* ---------- areas ---------- */
  function areasHTML() {
    return D.areas.items.map((a, i) => {
      const n = U.pubs.filter(p => p.type !== "review" && (p.tags || []).some(t => a.match.includes(t))).length;
      const href = a.match.length ? `research.html?topic=${encodeURIComponent(a.match[0])}` : "research.html";
      return `
        <li class="area rv"><a class="area__row" href="${href}">
          <span class="area__n">${pad2(i + 1)}</span>
          <span class="area__t">${esc(a.title)}</span>
          <span class="area__p">${esc(a.text)}${n ? ` <em class="area__c mono">${n} paper${n > 1 ? "s" : ""}</em>` : ""}</span>
          <span class="area__go" aria-hidden="true">→</span>
        </a></li>`;
    }).join("");
  }
  const inline = s => esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  /* ---------- stats with mini charts ---------- */
  function statsHTML() {
    return D.stats.map(s => `
      <div class="stat rv">
        <div class="stat__num"><span data-count="${s.value}" data-dec="${s.decimals || 0}">0</span>${s.suffix ? `<small>${esc(s.suffix)}</small>` : ""}</div>
        <div><h3>${esc(s.title)}</h3><p>${esc(s.sub)}</p></div>
        ${vizHTML(s)}
      </div>`).join("");
  }
  function vizHTML(s) {
    if (s.viz === "bars") {
      const c = {}; published.forEach(p => c[p.year] = (c[p.year] || 0) + (p.ifv || 0));
      const ys = Object.keys(c).map(Number), lo = Math.min(...ys), hi = Math.max(...ys), max = Math.max(...Object.values(c));
      let o = "", i = 0;
      for (let y = lo; y <= hi; y++, i++) o += `<span style="--i:${i};height:${Math.max(8, ((c[y] || 0) / max) * 100)}%" class="${c[y] === max ? "peak" : ""}" data-y="'${String(y).slice(2)}"></span>`;
      return `<div class="viz viz--bars" aria-hidden="true" title="Impact factor by year">${o}</div>`;
    }
    if (s.viz === "segments") {
      const n = 14, full = Math.floor(s.value), frac = s.value - full;
      return `<div class="viz viz--segments" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<span style="--i:${i}" class="${i < full ? "on" : i === full && frac > 0 ? "part" : ""}"></span>`).join("")}</div>`;
    }
    if (s.viz === "dots") return `<div class="viz viz--dots" aria-hidden="true">${(s.items || []).map((c, i) => `<span style="--i:${i}">${esc(c)}</span>`).join("")}</div>`;
    if (s.viz === "ring") {
      const n = s.parts || 3, C = 2 * Math.PI * 40, gap = 12, seg = C / n - gap;
      return `<div class="viz viz--ring" aria-hidden="true"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="40"/>${Array.from({ length: n }, (_, i) => `<circle class="fg${i === 0 ? " big" : ""}" cx="50" cy="50" r="40" data-seg="${seg}" style="stroke-dashoffset:${-(i * (C / n))};transition-delay:${0.2 + i * 0.15}s"/>`).join("")}</svg></div>`;
    }
    return "";
  }

  /* ---------- carousel ---------- */
  function cardsHTML() {
    return U.pubs.filter(p => p.card).map((p, i) => `
      <a class="rcard rcard--${esc(p.card.color)}" href="research.html#p-${p.id}">
        <div class="rcard__media">
          <span class="rcard__circ"></span>
          <span class="rcard__pill">${esc(p.venue.split(",")[0].replace(/^IEEE Transactions on /, "IEEE T-"))}</span>
          <span class="rcard__no">${pad2(i + 1)}</span>
          <span class="rcard__big">${esc(p.card.short)}</span>
          <span class="rcard__year">${p.year}</span>
        </div>
        <div class="rcard__body">
          <h3>${esc(p.card.line)}</h3>
          <p class="rcard__venue">${p.q ? `<b>${esc(p.q)}</b> · ` : ""}${p.ifv ? `IF ${p.ifv} · ` : ""}${p.award ? `★ ${esc(p.award)}` : esc(U.typeLabel[p.type])}</p>
          <div class="rcard__foot"><span class="mono">${(p.tags || []).slice(0, 3).map(esc).join(" · ")}</span><span class="rcard__go">↗</span></div>
        </div>
      </a>`).join("") + `
      <a class="rcard rcard--more" href="research.html">
        <span class="rcard__morenum">${U.pubs.length}</span>
        <span class="rcard__moretxt">papers in total.<br><b>See them all →</b></span>
      </a>`;
  }
  function setupCarousel() {
    const car = $("#carousel"), bar = $("#carBar"); if (!car) return;
    const step = () => { const c = $(".rcard", car); return c ? c.offsetWidth + 22 : 400; };
    $("#carPrev").addEventListener("click", () => car.scrollBy({ left: -step(), behavior: "smooth" }));
    $("#carNext").addEventListener("click", () => car.scrollBy({ left: step(), behavior: "smooth" }));
    const upd = () => { const w = car.clientWidth / car.scrollWidth, max = car.scrollWidth - car.clientWidth; bar.style.width = (w * 100) + "%"; bar.style.transform = `translateX(${max > 0 ? (car.scrollLeft / max) * ((1 / w) - 1) * 100 : 0}%)`; };
    car.addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); upd();
    let down = false, sx = 0, sl = 0, moved = false;
    car.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = car.scrollLeft; });
    addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; car.classList.add("is-drag"); } if (moved) car.scrollLeft = sl - dx; });
    addEventListener("pointerup", () => { if (!down) return; down = false; car.classList.remove("is-drag"); });
    car.addEventListener("click", e => { if (moved) { e.preventDefault(); moved = false; } }, true);
    car.addEventListener("dragstart", e => e.preventDefault());
  }

  /* ---------- word-by-word fill ---------- */
  function wordFill(el) {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const f = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => { if (!part) return; if (/^\s+$/.test(part)) f.appendChild(document.createTextNode(part)); else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; f.appendChild(s); } });
        n.replaceWith(f);
      } else if (n.nodeType === 1 && n.tagName.toLowerCase() !== "svg") walk(n);
    });
    walk(el);
    const words = $$(".w", el);
    U.onScroll(vh => { const r = el.getBoundingClientRect(); const k = reduced ? 1 : clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3)); const n = Math.round(k * words.length); words.forEach((w, i) => w.classList.toggle("on", i < n)); });
  }

  /* ---------- now panel terminal ---------- */
  function setupNow() {
    const N = D.now, tabs = (set("tabs", N.tabs.map((t, i) => `<button class="tab" role="tab" data-i="${i}"><span class="mono">${pad2(i + 1)}</span><b>${esc(t.name)}</b></button>`).join("")), $$("#tabs .tab"));
    const body = $("#termBody"), file = $("#termFile"), cap = $("#termCap"), HOLD = 7000;
    let cur = -1, token = 0, timer = null, started = false;
    const cls = l => /^\$/.test(l) ? "p" : /^✓/.test(l) ? "ok" : "k";
    const show = async i => {
      cur = i; const my = ++token;
      tabs.forEach((t, j) => { t.classList.remove("is-on"); t.setAttribute("aria-selected", j === i); });
      void tabs[i].offsetWidth; tabs[i].classList.add("is-on"); tabs[i].style.setProperty("--tab-ms", HOLD + "ms");
      file.textContent = N.tabs[i].file;
      cap.innerHTML = esc(N.tabs[i].caption).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
      clearTimeout(timer); timer = setTimeout(() => show((cur + 1) % N.tabs.length), HOLD);
      body.innerHTML = "";
      for (const line of N.tabs[i].lines) {
        const span = document.createElement("span"); span.className = cls(line); body.appendChild(span);
        const caret = document.createElement("span"); caret.className = "cur"; body.appendChild(caret);
        if (reduced) span.textContent = line;
        else for (let c = 0; c < line.length; c++) { if (my !== token) return; span.textContent += line[c]; await U.wait(line.startsWith("$") ? 32 : 11); }
        caret.remove(); body.appendChild(document.createTextNode("\n"));
        if (my !== token) return; await U.wait(reduced ? 0 : 240);
      }
      const caret = document.createElement("span"); caret.className = "cur"; body.appendChild(caret);
    };
    tabs.forEach((t, i) => t.addEventListener("click", () => show(i)));
    new IntersectionObserver(es => { if (es[0].isIntersecting && !started) { started = true; show(0); } }, { threshold: 0.3 }).observe($("#now"));
  }

  /* ---------- journey ---------- */
  function journeyHTML() {
    return `
      <div class="journey">
        <div class="journey__list">
          <p class="label rv">${esc(D.journey.label)}</p>
          <h2 class="h-xl rv">${rich(D.journey.title)}</h2>
          <ol class="steps" id="steps">${D.experience.map((j, i) => `
            <li class="jstep${i === 0 ? " is-on" : ""}" data-i="${i}">
              <button class="jstep__h"><span class="jstep__n">${pad2(i + 1)}</span><span class="jstep__r">${esc(j.role)}</span><span class="jstep__p">${esc(j.period)}</span></button>
              <div class="jstep__b"><div>
                <p class="jstep__org">${esc(j.org)}</p>
                <ul>${j.points.map(pt => `<li>${esc(pt)}</li>`).join("")}</ul>
              </div></div>
            </li>`).join("")}</ol>
        </div>
        <div class="journey__stage" aria-hidden="true"><div class="stage">
          <span class="stage__year" id="stageYear"></span>
          <div class="stage__card"><div class="globe" id="globe"></div><div class="stage__meta mono"><span id="stagePlace"></span><span id="stageKind"></span></div></div>
        </div></div>
      </div>`;
  }
  function setupJourney() {
    const steps = $$(".jstep"), E = D.experience, places = D.journey.places || {};
    const used = [...new Set(E.map(e => e.place))].filter(p => places[p]);
    const lats = used.map(p => places[p].lat), lons = used.map(p => places[p].lon);
    const la0 = Math.min(...lats), la1 = Math.max(...lats), lo0 = Math.min(...lons), lo1 = Math.max(...lons);
    const pos = name => { const p = places[name]; if (!p) return { x: 50, y: 50 }; return { x: 17 + ((p.lon - lo0) / ((lo1 - lo0) || 1)) * 66, y: 20 + ((la1 - p.lat) / ((la1 - la0) || 1)) * 60 }; };
    // pins that sit close together: the upper one gets its label above
    const crowded = name => { const a = pos(name); return used.some(o => { if (o === name) return false; const b = pos(o); return Math.abs(a.x - b.x) < 14 && Math.abs(a.y - b.y) < 22 && b.y > a.y; }); };
    const chrono = E.map((e, i) => ({ place: e.place, i })).reverse(), route = [];
    chrono.forEach(c => { if (!route.length || route[route.length - 1].place !== c.place) route.push(c); });
    const H = 62.5, seen = new Set();
    const arcs = route.slice(1).map((c, k) => {
      const key = [route[k].place, c.place].sort().join("|"); const dup = seen.has(key); seen.add(key);
      const a = pos(route[k].place), b = pos(c.place), ax = a.x, ay = a.y * H / 100, bx = b.x, by = b.y * H / 100;
      const mx = (ax + bx) / 2, my = Math.min(ay, by) - Math.abs(bx - ax) * 0.25 - (dup ? 8 : 3);
      return `<path class="route" data-to="${c.i}" d="M${ax} ${ay} Q${mx} ${my} ${bx} ${by}"/>`;
    }).join("");
    set("globe", `<svg viewBox="0 0 100 ${H}" preserveAspectRatio="none">${arcs}</svg>` + used.map(p => { const q = pos(p); return `<span class="gpin${crowded(p) ? " up" : ""}${q.x < 30 ? " l" : ""}" data-place="${esc(p)}" style="left:${q.x}%;top:${q.y}%"><i></i><span>${esc(places[p].city || p)}</span></span>`; }).join(""));
    const routes = $$("#globe .route"), pins = $$("#globe .gpin");
    let active = -1;
    const activate = i => {
      if (i === active) return; active = i;
      steps.forEach((s, j) => s.classList.toggle("is-on", j === i));
      const e = E[i], pl = places[e.place] || {};
      txt("stageYear", e.start);
      txt("stagePlace", `${pl.city || e.place}${pl.lat != null ? ` · ${pl.lat.toFixed(2)}°, ${pl.lon.toFixed(2)}°` : ""}`);
      txt("stageKind", e.kind);
      pins.forEach(p => p.classList.toggle("on", p.dataset.place === e.place));
      routes.forEach(r => r.classList.toggle("done", +r.dataset.to >= i));
    };
    steps.forEach((s, i) => $(".jstep__h", s).addEventListener("click", () => { if (innerWidth <= 960) return; activate(i); scrollTo({ top: s.getBoundingClientRect().top + scrollY - innerHeight * 0.4, behavior: reduced ? "auto" : "smooth" }); }));
    activate(0);
    U.onScroll(vh => { if (innerWidth <= 960) return; let idx = 0; steps.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * 0.5) idx = i; }); activate(idx); });
  }

  /* ---------- shelf ---------- */
  function shelfHTML(items) {
    const heights = [100, 90, 82, 94, 86, 96];
    return items.map((v, i) => `
      <div class="spine spine--${esc(v.color)}${i === 0 ? " is-on" : ""}" style="--h:${heights[i % heights.length]}%" role="button" tabindex="${i === 0 ? -1 : 0}" aria-expanded="${i === 0}" aria-label="${esc(v.name)}">
        <span class="spine__b">${esc(v.badge)}</span>
        <span class="spine__v">${esc(v.name)}</span>
        <div class="spine__c">
          <span class="spine__no">${pad2(i + 1)}</span>
          <span class="mono">${esc(v.field)} · ${esc(v.period)}</span>
          <h3>${esc(v.name)}</h3>
          <p>${esc(v.blurb)}</p>
          ${v.url ? `<a class="btn btn--ink btn--sm" href="${esc(v.url)}" target="_blank" rel="noopener" tabindex="${i === 0 ? 0 : -1}">${esc(v.linkLabel || "Visit")} <span class="arr">↗</span></a>` : ""}
        </div>
      </div>`).join("");
  }
  function setupShelf() {
    const spines = $$(".spine");
    const on = s => spines.forEach(x => { const a = x === s; x.classList.toggle("is-on", a); x.setAttribute("aria-expanded", a); x.setAttribute("tabindex", a ? "-1" : "0"); $$("a", x).forEach(l => l.tabIndex = a ? 0 : -1); });
    spines.forEach(s => {
      s.addEventListener("click", e => { if (!e.target.closest("a")) on(s); });
      s.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && !s.classList.contains("is-on")) { e.preventDefault(); on(s); } });
    });
  }

  /* ================= PAGES ================= */
  const pages = {
    home() {
      txt("kicker", P.kicker);
      set("proof", `<span class="qchip">Q1</span><b class="ul-text">${esc(P.proof)}</b>`);
      set("flags", P.countries.map(c => `<span>${esc(c)}</span>`).join(""));
      txt("countriesNote", P.countriesNote);
      set("heroTitle", P.heroTitle.map((l, i) => `<span class="ln"><span style="--ld:${0.1 + i * 0.12}s">${rich(l)}</span></span>`).join(""));
      $$("#heroTitle .hl").forEach(h => h.style.setProperty("--hd", "1s"));
      txt("heroSub", P.heroSub); txt("heroSubEnd", P.heroSubEnd);
      $("#cvBtn").href = P.cv;
      txt("handNote", P.handNote);
      const arch = $("#arch"), img = $("#photo");
      txt("photoFallback", P.initials); img.alt = P.name;
      img.onerror = () => arch.classList.add("no-photo");
      if (P.photo) img.src = P.photo; else arch.classList.add("no-photo");
      set("floaters", P.floating.map(f => `<div class="floater floater--${esc(f.side)}"><span class="floater__b">${esc(f.badge)}</span><span><b>${esc(f.title)}</b><small>${esc(f.sub)}</small></span></div>`).join(""));

      txt("whyLabel", D.why.label); wordFill(set("whyTitle", rich(D.why.title)));
      set("stats", statsHTML());
      txt("featLabel", D.featured.label); set("featTitle", rich(D.featured.title));
      set("cards", cardsHTML()); setupCarousel();

      const N = D.now;
      txt("nowLabel", N.label); set("nowTitle", rich(N.title)); txt("nowText", N.text);
      const a = $("#nowPrimary"); a.href = N.primary.href; a.innerHTML = `${esc(N.primary.label)} <span class="arr">→</span>`;
      const b = $("#nowSecondary"); b.href = N.secondary.href; b.innerHTML = `${esc(N.secondary.label)} ↗`;
      txt("nowFoot", N.footnote); setupNow();

      set("areasHead", secHead(D.areas.label, D.areas.title, D.areas.blurb));
      set("areasList", areasHTML());

      set("newsHead", secHead(D.blogPage.label, "Lately, *in brief.*", "", `<a class="btn btn--ghost rv" href="blog.html">All posts <span class="arr">→</span></a>`));
      set("newsList", D.posts.slice(0, 4).map((n, i) => postItem(n, i)).join(""));

      set("cTitle", rich(D.contact.title)); txt("cText", `${D.contact.text} Based in ${P.location}.`); txt("cNote", D.contact.note);
      txt("mailText", P.email);
      set("socials", P.socials.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join(""));
      if (!reduced && U.fine) {
        const dome = $("#dome"), fl = $("#floaters");
        addEventListener("mousemove", e => { const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5; fl.style.transform = `translate(${x * -18}px, ${y * -12}px)`; dome.style.transform = `translateX(calc(-50% + ${x * 8}px))`; }, { passive: true });
      }
      return () => setupRotator();
    },

    research() { return setupPublications(); },

    development() {
      const R = D.devPage;
      set("phero", pheroHTML({ ...R, crumb: "Development", meta: statTiles([{ v: 20, suf: "+", l: "Commercial apps" }, { v: D.products.length, l: "Featured products" }, { v: D.clients.length, l: "Client sites listed" }, { v: 8, suf: "+", l: "Years of experience" }]) }));
      set("prodHead", secHead("Featured products", "Pick one *off the shelf.*", "Click a spine to open it."));
      set("shelf", shelfHTML(D.products)); setupShelf();
      set("clientHead", secHead("Client work", "Websites & portals for *real businesses.*", "A selection of the commercial sites I've developed."));
      set("clientGrid", D.clients.map((c, i) => `
        <a class="client rv" style="--d:${(i % 4) * 0.05}s" href="${esc(c.url)}" target="_blank" rel="noopener">
          <span class="client__i">${esc(c.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2))}</span>
          <span><b>${esc(c.name)}</b>${c.what ? `<small>${esc(c.what)}</small>` : ""}</span>
          <span class="client__d mono">${esc(c.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))} ↗</span>
        </a>`).join(""));
    },

    teaching() {
      const T = D.teachingPage;
      set("phero", pheroHTML({ ...T, crumb: "Teaching", meta: statTiles([{ v: 1000, suf: "+", l: "Students & professionals mentored" }, { v: 14, suf: "+", l: "FYPs supervised" }, { v: D.courses.length, l: "Courses taught" }, { v: D.committees.length, l: "Committee roles" }]) }));
      set("courseHead", secHead("Courses", "What I *teach.*", "Courses at COMSATS University Islamabad (Sahiwal), the University of Sahiwal and Government Postgraduate College Sahiwal."));
      set("courseGrid", D.courses.map((c, i) => `
        <article class="course course--${esc(c.color)} rv" style="--d:${(i % 2) * 0.08}s">
          <div class="course__top"><span class="mono">${esc(c.where)}</span><span class="mono">${esc(c.when)}</span></div>
          <h3>${esc(c.title)}</h3><p class="course__sub">${esc(c.sub)}</p>
          ${c.text ? `<p>${esc(c.text)}</p>` : ""}
          ${c.repos.length ? `<div class="course__repos">${c.repos.map(r => `<a href="${esc(r.url)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5Z"/></svg>${esc(r.label)}</a>`).join("")}</div>` : ""}
        </article>`).join(""));
      set("methodList", D.methods.map((m, i) => `<li class="method rv" style="--d:${i * 0.08}s"><span class="method__n">${pad2(i + 1)}</span><b>${esc(m.title)}</b>${m.text ? `<p>${esc(m.text)}</p>` : ""}</li>`).join(""));
      set("fypHead", secHead("Supervision", "Final-year projects *I've supervised.*", "", `<a class="btn btn--ghost rv" href="${esc(D.fypArchive)}" target="_blank" rel="noopener">Project archive <span class="arr">↗</span></a>`));
      set("fypGrid", D.fyps.map((f, i) => `<li class="fyp rv" style="--d:${(i % 4) * 0.04}s"><span class="fyp__k mono">${esc(f.kind)}</span><b>${esc(f.name)}</b><span>${esc(f.what)}</span></li>`).join(""));
      set("comHead", secHead("Academic service", "Committees & *governance.*", "", `<a class="btn btn--ghost rv" href="${esc(D.committeeArchive)}" target="_blank" rel="noopener">Notifications <span class="arr">↗</span></a>`));
      set("comList", D.committees.map(c => `<li class="com rv"><span class="tag${c.role !== "Member" ? " tag--cy" : ""}">${esc(c.role)}</span><b>${esc(c.name)}</b><span class="mono">${esc(c.level)} level</span></li>`).join(""));
    },

    consultancy() {
      const C = D.consultPage;
      const mail = `mailto:${P.email}?subject=${encodeURIComponent("Consultancy enquiry")}`;
      set("phero", pheroHTML({ ...C, crumb: "Consultancy", meta: statTiles([{ v: 20, suf: "+", l: "Commercial apps delivered" }, { v: 57.5, dec: 1, l: "Cumulative impact factor" }, { v: 1000, suf: "+", l: "Students & professionals mentored" }, { v: 8, suf: "+", l: "Years of experience" }])
        + `<div class="hero__cta hero__cta--left rv" style="--d:.25s"><a class="btn btn--cy btn--lg" href="${mail}">Start a conversation <span class="arr">→</span></a><a class="btn btn--ghost btn--lg" href="#services">See services</a></div>` }));
      set("svcHead", secHead("Services", "What I can *help with.*", "Each service is backed by published work or shipped products. Click an item to see the evidence."));
      set("svcGrid", D.services.map((v, i) => `
        <article class="svc svc--${esc(v.color)} rv" style="--d:${(i % 2) * 0.08}s">
          <div class="svc__top"><span class="svc__badge">${esc(v.n)}</span><span class="mono">${pad2(i + 1)}</span></div>
          <h3>${esc(v.title)}</h3>
          <p>${esc(v.text)}</p>
          <ul class="svc__list">${v.deliver.map(d => `<li>${esc(d)}</li>`).join("")}</ul>
          <div class="svc__proof"><span class="mono">Backed by</span>${v.proof.map(pr => `<a href="${esc(pr.href)}">${esc(pr.label)}</a>`).join("")}</div>
        </article>`).join(""));
      set("procHead", secHead("Process", "How we'd *work together.*"));
      set("procList", D.process.map((m, i) => `<li class="method rv" style="--d:${i * 0.08}s"><span class="method__n">${pad2(i + 1)}</span><b>${esc(m.title)}</b><p>${esc(m.text)}</p></li>`).join(""));
      set("engList", D.engagements.map((e, i) => `<div class="eng rv" style="--d:${i * 0.08}s"><span class="mono">${pad2(i + 1)}</span><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p></div>`).join(""));
      set("sectorList", D.sectors.map(x => `<span class="chip">${esc(x)}</span>`).join(""));
      set("consultCta", `<div class="fcta fcta--big rv"><div><p class="label">Let's talk</p><p class="fcta__t">Tell me about your project, <em class="it">I'll reply by email.</em></p></div><a class="btn btn--cy btn--lg" href="${mail}">${esc(P.email)} <span class="arr">↗</span></a></div>`);
    },

    about() {
      const A = D.aboutPage;
      set("phero", pheroHTML({ ...A, crumb: "About", lead: "", side: `
        <figure class="aphoto rv" style="--d:.15s"><img src="${esc(P.photo)}" alt="${esc(P.name)}" width="440" height="550" /><figcaption class="mono">${esc(P.role)}<br>${esc(P.affiliation)}<br><span class="aphoto__loc">📍 Based in ${esc(P.location)}</span></figcaption></figure>`,
        meta: `<div class="bio rv" style="--d:.15s">${P.bio.map(p => `<p>${esc(p)}</p>`).join("")}</div>
          <div class="hero__cta hero__cta--left rv" style="--d:.2s"><a class="btn btn--cy btn--lg" href="${esc(P.cv)}" target="_blank" rel="noopener">Download CV <span class="arr">↓</span></a><button class="btn btn--ghost btn--lg" data-copy-email>Copy email</button></div>
          <div class="idlinks rv" style="--d:.25s">${P.socials.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join("")}</div>` }));
      set("subnav", [["journey", "Experience"], ["education", "Education"], ["honors", "Honours"], ["skills", "Skills"], ["certifications", "Languages & certificates"], ["teaching.html", "Teaching →"]]
        .map(([id, l]) => `<a href="${id.includes(".") ? id : "#" + id}">${l}</a>`).join(""));
      const subLinks = $$("#subnav a"); let lastSub = null;
      U.onScroll(vh => { let cur = null; subLinks.forEach(a => { const s = document.getElementById(a.getAttribute("href").replace(/^#/, "")); if (s && s.getBoundingClientRect().top < vh * 0.35) cur = a; }); subLinks.forEach(a => a.classList.toggle("is-on", a === cur)); if (cur && cur !== lastSub) { lastSub = cur; const bar = $("#subnav"); bar.scrollTo({ left: cur.offsetLeft - bar.clientWidth / 2 + cur.offsetWidth / 2, behavior: reduced ? "auto" : "smooth" }); } });
      set("journey", journeyHTML()); setupJourney();
      set("eduHead", secHead("Education", "Where I _learned it._"));
      set("eduGrid", D.education.map((e, i) => `
        <article class="ecard rv" style="--d:${i * 0.08}s">
          <span class="ecard__i">${pad2(i + 1)}</span><span class="ecard__y">${esc(e.years)}</span>
          <h3>${esc(e.degree)}</h3><p class="ecard__s">${esc(e.school)}</p>
          <p class="ecard__note">${esc(e.note)}</p><p class="ecard__d">${esc(e.detail)}</p>
          ${e.link ? `<a class="ecard__link" href="${esc(e.link.url)}" target="_blank" rel="noopener">${esc(e.link.label)} ↗</a>` : ""}
        </article>`).join(""));
      set("honHead", secHead("Honours & awards", "Recognition *along the way.*"));
      set("honList", D.honors.map(h => `<li class="hon rv"><span class="hon__y">${esc(h.year)}</span><div><b>${esc(h.title)}</b><p>${esc(h.text)}</p></div><span class="hon__o">${esc(h.org)}</span></li>`).join(""));
      set("skillHead", secHead("Toolbox", "Technical *skills.*"));
      set("skillGrid", D.skills.map((s, i) => `<div class="skill rv" style="--d:${(i % 3) * 0.06}s"><h3>${esc(s.group)}</h3><div class="chips chips--static">${s.items.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div></div>`).join(""));
      set("langList", D.languages.map(l => `<li><b>${esc(l.name)}</b><span>${esc(l.level)}</span>${l.note ? `<small class="mono">${esc(l.note)}</small>` : ""}</li>`).join(""));
      set("certList", D.certifications.map(c => `<li><span class="mono">${esc(c.when)}</span><b>${esc(c.group)}</b><p>${esc(c.items)}</p></li>`).join(""));
    },

    blog() {
      const B = D.blogPage, posts = D.posts;
      const id = new URLSearchParams(location.search).get("p");
      const post = id && posts.find(x => x.id === id && x.body);
      if (post) {
        document.title = `${post.title} | ${P.name}`;
        set("phero", pheroHTML({ label: `${post.tag} · ${post.date}`, title: post.title, lead: post.summary || "", crumb: "Blog" }).replace('<span aria-current="page">Blog</span>', '<a href="blog.html">Blog</a>'));
        set("blogMain", `<article class="post rv">${post.body.map(p => `<p>${inline(p)}</p>`).join("")}${post.url ? `<p><a class="btn btn--ghost btn--sm" href="${esc(post.url)}" target="_blank" rel="noopener">Source <span class="arr">↗</span></a></p>` : ""}<p><a class="link-btn" href="blog.html">← All posts</a></p></article>`);
        return;
      }
      set("phero", pheroHTML({ ...B, crumb: "Blog" }));
      const tags = ["All", ...new Set(posts.map(n => n.tag))];
      set("blogMain", `<div class="chips rv" id="blogFilters">${tags.map((t, i) => `<button class="chip${i === 0 ? " is-on" : ""}" data-f="${esc(t)}">${esc(t)} <sup>${t === "All" ? posts.length : posts.filter(n => n.tag === t).length}</sup></button>`).join("")}</div>
        <ul class="news news--full" id="blogList">${posts.map((n, i) => postItem(n, i, true)).join("")}</ul>`);
      const chips = $$("#blogFilters .chip");
      chips.forEach(c => c.addEventListener("click", () => {
        chips.forEach(x => x.classList.toggle("is-on", x === c));
        $$("#blogList .nitem").forEach(li => { li.hidden = !(c.dataset.f === "All" || li.dataset.tag === c.dataset.f); if (!li.hidden) li.classList.add("is-in"); });
      }));
    },
  };

  function postItem(n, i, full) {
    const href = n.body ? `blog.html?p=${encodeURIComponent(n.id)}` : n.url;
    const ext = !n.body && n.url;
    const inner = `<span class="nitem__d">${esc(n.date)}</span><span class="tag">${esc(n.tag)}</span><span class="nitem__t">${esc(n.title)}${i === 0 ? '<span class="newb">new</span>' : ""}${full && n.summary ? `<small>${esc(n.summary)}</small>` : ""}</span>${href ? `<span class="nitem__a">${ext ? "↗" : "→"}</span>` : "<span></span>"}`;
    return href
      ? `<li class="nitem nitem--link rv" id="b-${esc(n.id)}" data-tag="${esc(n.tag)}"><a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${inner}</a></li>`
      : `<li class="nitem rv" id="b-${esc(n.id)}" data-tag="${esc(n.tag)}"><div>${inner}</div></li>`;
  }

  function grantsHTML() {
    return D.grants.map((g, i) => `
      <article class="grant grant--${esc(g.color)} rv" style="--d:${i * 0.08}s">
        <div class="grant__top"><span class="mono">${esc(g.code)}</span><span class="mono">${esc(g.period)}</span></div>
        <div class="grant__amt">${esc(g.amount)}</div>
        <h3>${esc(g.title)}</h3>
        <p>${esc(g.text)}</p>
        <div class="grant__foot"><span><b>${esc(g.role)}</b></span><span>${esc(g.funder)}</span></div>
      </article>`).join("");
  }

  function setupRotator() {
    const rot = $("#rot"), w = $("#rotWord"), words = P.rotating; let i = 0;
    const fit = () => { const pad = parseFloat(getComputedStyle(rot).paddingLeft) * 2; rot.style.width = (w.offsetWidth + pad) + "px"; };
    w.textContent = words[0]; fit();
    $("#heroTitle").classList.add("is-in");
    if (reduced || words.length < 2) return;
    setInterval(() => { w.classList.add("out"); setTimeout(() => { i = (i + 1) % words.length; w.textContent = words[i]; w.classList.remove("out"); w.classList.add("in-start"); fit(); void w.offsetWidth; w.classList.remove("in-start"); }, 420); }, 2600);
    addEventListener("resize", fit);
  }

  /* ================= PUBLICATIONS APP ================= */
  function setupPublications() {
    const R = D.pubPage, all = U.pubs.map((p, i) => ({ ...p, _i: i, _first: U.pubIsFirst(p) }));
    set("phero", pheroHTML({ ...R, crumb: "Research", meta: statTiles([
      { v: published.length, l: "Published" }, { v: q1.length, l: "SCIE-Q1" }, { v: sumIF, dec: 1, l: "Cumulative IF" }, { v: firsts.length, l: "First-author" }, { v: reviews.length, l: "Under review" }]) }));
    set("grantsHead", secHead("Funded research", "Grants I *help lead.*", "One national and two university research grants, as technical coordinator or technical lead."));
    set("grantsList", grantsHTML());
    set("pubHead", secHead("Publications", "Every paper, *in one place.*", "Search, filter by topic or year, and copy a citation or BibTeX in one click."));

    // chart by year (stacked)
    const years = [...new Set(all.map(p => p.year))].sort();
    const byY = y => ({ j: all.filter(p => p.year === y && p.type === "journal").length, c: all.filter(p => p.year === y && p.type === "conference").length, r: all.filter(p => p.year === y && (p.type === "review" || p.type === "thesis")).length });
    const maxY = Math.max(...years.map(y => { const b = byY(y); return b.j + b.c + b.r; }));
    set("chart", `<div class="chart__bars">${years.map(y => { const b = byY(y), t = b.j + b.c + b.r; return `
      <button class="chart__col" data-year="${y}" aria-label="${y}: ${t} papers" title="${y}: ${b.j} journal, ${b.c} conference, ${b.r} other">
        <span class="chart__stack" style="height:${(t / maxY) * 100}%">${b.r ? `<i class="r" style="flex:${b.r}"></i>` : ""}${b.c ? `<i class="c" style="flex:${b.c}"></i>` : ""}${b.j ? `<i class="j" style="flex:${b.j}"></i>` : ""}</span>
        <b>${t}</b><span class="mono">${y}</span></button>`; }).join("")}</div>
      <div class="chart__key mono"><span><i class="j"></i>Journal</span><span><i class="c"></i>Conference</span><span><i class="r"></i>Review / thesis</span><span class="chart__hint">Click a year to filter</span></div>`);

    const tagCount = {}; all.forEach(p => (p.tags || []).forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
    const tags = Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]);
    const types = [["all", "All"], ["journal", "Journals"], ["conference", "Conferences"], ["review", "Under review"], ["thesis", "Thesis"]];
    set("typeTabs", types.map(([k, l]) => `<button class="seg__b" data-type="${k}" role="tab">${l}<sup>${k === "all" ? all.length : all.filter(p => p.type === k).length}</sup></button>`).join(""));
    set("topicChips", `<button class="chip" data-topic="">All topics</button>` + tags.map(t => `<button class="chip" data-topic="${esc(t)}">${esc(t)} <sup>${tagCount[t]}</sup></button>`).join(""));

    const st = { q: "", type: "all", topic: "", q1: false, first: false, sort: "new", year: "" };
    const sp = new URLSearchParams(location.search);
    ["q", "type", "topic", "sort", "year"].forEach(k => { if (sp.get(k)) st[k] = sp.get(k); });
    st.q1 = sp.get("q1") === "1"; st.first = sp.get("first") === "1";
    const input = $("#pubSearch"); input.value = st.q;

    const hay = p => U.norm([p.title, p.authors, p.venue, p.details, p.year, (p.tags || []).join(" "), p.doi, p.award, p.status, p.q, U.typeLabel[p.type]].join(" "));
    all.forEach(p => p._hay = hay(p));
    const toks = () => U.norm(st.q).split(/\s+/).filter(Boolean);
    const mark = (s, ts) => {
      let out = esc(s); if (!ts.length) return out;
      const n = U.norm(s), ranges = [];
      ts.forEach(t => { let i = n.indexOf(t); while (i >= 0 && t.length > 1) { ranges.push([i, i + t.length]); i = n.indexOf(t, i + t.length); } });
      if (!ranges.length) return out;
      ranges.sort((a, b) => a[0] - b[0]); const merged = [];
      ranges.forEach(r => { const l = merged[merged.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else merged.push([...r]); });
      let res = "", last = 0; merged.forEach(([a, b]) => { res += esc(s.slice(last, a)) + "<mark>" + esc(s.slice(a, b)) + "</mark>"; last = b; });
      return res + esc(s.slice(last));
    };

    const filtered = () => {
      const ts = toks();
      let list = all.filter(p =>
        (st.type === "all" || p.type === st.type) &&
        (!st.topic || (p.tags || []).includes(st.topic)) &&
        (!st.q1 || p.q === "Q1") && (!st.first || p._first) &&
        (!st.year || String(p.year) === String(st.year)) &&
        ts.every(t => p._hay.includes(t)));
      const order = { journal: 0, conference: 1, review: 2, thesis: 3 };
      if (st.sort === "if") list.sort((a, b) => (b.ifv || 0) - (a.ifv || 0) || b.year - a.year);
      else if (st.sort === "old") list.sort((a, b) => a.year - b.year || order[a.type] - order[b.type] || a._i - b._i);
      else list.sort((a, b) => b.year - a.year || order[a.type] - order[b.type] || a._i - b._i);
      return list;
    };

    const card = (p, ts, n) => {
      const link = U.pubLink(p);
      const authors = p.authors.split(",").map(a => a.trim()).map(a => U.isMe(a) ? `<b>${mark(a, ts)}</b>` : mark(a, ts)).join(", ");
      return `
        <li class="pc rv is-in" id="p-${esc(p.id)}">
          <span class="pc__n mono">${pad2(n)}</span>
          <div class="pc__body">
            <div class="pc__badges">
              ${p.status ? "" : `<span class="tag">${esc(U.typeLabel[p.type])}</span>`}
              ${p.q ? `<span class="tag tag--cy">${esc(p.index || "")} ${esc(p.q)}</span>` : ""}
              ${p.ifv ? `<span class="tag tag--ink">IF ${p.ifv}</span>` : ""}
              ${p.award ? `<span class="tag tag--sun">★ ${esc(p.award)}</span>` : ""}
              ${p.status ? `<span class="tag tag--warn">${esc(p.status)}</span>` : ""}
              ${p._first ? `<span class="tag">First author</span>` : ""}
              <span class="pc__y mono">${p.year}</span>
            </div>
            <h3 class="pc__t">${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${mark(p.title, ts)}</a>` : mark(p.title, ts)}</h3>
            <p class="pc__a">${authors}</p>
            <p class="pc__v"><em>${mark(p.venue, ts)}</em>${p.details ? `, ${mark(p.details, ts)}` : ""}${p.doi ? ` · <span class="mono pc__doi">doi:${mark(p.doi, ts)}</span>` : ""}</p>
            <div class="pc__tags">${(p.tags || []).map(t => `<button class="pc__tag" data-topic="${esc(t)}">#${esc(t)}</button>`).join("")}</div>
            <div class="pc__bib" hidden><pre class="mono">${esc(bibtex(p))}</pre><button class="pbtn pbtn--cy" data-copybib="${p._i}">Copy BibTeX</button></div>
          </div>
          <div class="pc__act">
            ${link ? `<a class="pbtn pbtn--cy" href="${esc(link)}" target="_blank" rel="noopener">${p.doi ? "DOI" : "Read"} ↗</a>` : ""}
            <button class="pbtn" data-cite="${p._i}">Cite</button>
            <button class="pbtn" data-bib="${p._i}" aria-expanded="false">BibTeX</button>
          </div>
        </li>`;
    };

    const render = () => {
      const list = filtered(), ts = toks();
      let html = "", lastY = null, n = 0;
      list.forEach(p => {
        if (st.sort !== "if" && p.year !== lastY) { lastY = p.year; html += `<li class="pyear"><span>${p.year}</span><i></i><span class="mono">${list.filter(x => x.year === p.year).length} item${list.filter(x => x.year === p.year).length > 1 ? "s" : ""}</span></li>`; }
        html += card(p, ts, ++n);
      });
      set("pubList", html);
      $("#pubEmpty").hidden = list.length > 0;
      txt("pubCount", `Showing ${list.length} of ${all.length}`);
      // control states
      $$("#typeTabs .seg__b").forEach(b => { const on = b.dataset.type === st.type; b.classList.toggle("is-on", on); b.setAttribute("aria-selected", on); });
      $$("#topicChips .chip").forEach(b => b.classList.toggle("is-on", b.dataset.topic === st.topic));
      $("#fQ1").setAttribute("aria-pressed", st.q1); $("#fFirst").setAttribute("aria-pressed", st.first);
      $("#pubSort").value = st.sort;
      $$("#chart .chart__col").forEach(c => c.classList.toggle("is-on", c.dataset.year === String(st.year)));
      $("#chart").classList.toggle("has-year", !!st.year);
      $("#pubClear").hidden = !st.q;
      const active = [st.q && `“${st.q}”`, st.type !== "all" && U.typeLabel[st.type], st.topic && `#${st.topic}`, st.year, st.q1 && "Q1 only", st.first && "First author"].filter(Boolean);
      set("pubActive", active.length ? `<span class="mono">Filters:</span> ${active.map(a => `<span class="tag">${esc(a)}</span>`).join(" ")} <button class="link-btn" id="pubReset">Reset all</button>` : "");
      const r = $("#pubReset"); if (r) r.addEventListener("click", reset);
      // url sync
      const q = new URLSearchParams();
      if (st.q) q.set("q", st.q); if (st.type !== "all") q.set("type", st.type); if (st.topic) q.set("topic", st.topic);
      if (st.year) q.set("year", st.year); if (st.q1) q.set("q1", "1"); if (st.first) q.set("first", "1"); if (st.sort !== "new") q.set("sort", st.sort);
      history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash);
    };
    const reset = () => { Object.assign(st, { q: "", type: "all", topic: "", q1: false, first: false, sort: "new", year: "" }); input.value = ""; render(); };
    $("#pubEmptyReset").addEventListener("click", reset);

    let deb; input.addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(() => { st.q = input.value.trim(); render(); }, 90); });
    input.addEventListener("keydown", e => { if (e.key === "Escape") { input.value = ""; st.q = ""; render(); } });
    $("#pubClear").addEventListener("click", () => { input.value = ""; st.q = ""; render(); input.focus(); });
    $("#typeTabs").addEventListener("click", e => { const b = e.target.closest(".seg__b"); if (b) { st.type = b.dataset.type; render(); } });
    $("#topicChips").addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) { st.topic = b.dataset.topic; render(); } });
    $("#fQ1").addEventListener("click", () => { st.q1 = !st.q1; render(); });
    $("#fFirst").addEventListener("click", () => { st.first = !st.first; render(); });
    $("#pubSort").addEventListener("change", e => { st.sort = e.target.value; render(); });
    $("#chart").addEventListener("click", e => { const c = e.target.closest(".chart__col"); if (c) { st.year = st.year === c.dataset.year ? "" : c.dataset.year; render(); $("#pubTools").scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); } });
    $("#pubList").addEventListener("click", e => {
      const t = e.target.closest(".pc__tag"); if (t) { st.topic = t.dataset.topic; render(); $("#pubTools").scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); return; }
      const c = e.target.closest("[data-cite]"); if (c) { U.copyText(apa(all[+c.dataset.cite]), "Citation copied"); return; }
      const cb = e.target.closest("[data-copybib]"); if (cb) { U.copyText(bibtex(all[+cb.dataset.copybib]), "BibTeX copied"); return; }
      const b = e.target.closest("[data-bib]");
      if (b) { const box = $(".pc__bib", b.closest(".pc")); const open = box.hidden; box.hidden = !open; b.setAttribute("aria-expanded", open); b.classList.toggle("is-on", open); }
    });
    $("#pubExport").addEventListener("click", () => {
      const list = filtered(), blob = new Blob([list.map(bibtex).join("\n\n") + "\n"], { type: "application/x-bibtex" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "muhammad-jamil-publications.bib"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000); U.toast(`Exported ${list.length} entries`);
    });
    // when the global search jumps to a paper that's filtered out, clear filters first
    U.beforeFocus = id => { if (id.startsWith("p-") && !document.getElementById(id)) reset(); };
    render();
  }

  /* ---------- citations ---------- */
  const splitAuthors = p => p.authors.split(",").map(a => a.trim()).filter(Boolean);
  const surname = n => n.split(/\s+/).pop();
  const apaName = n => { const w = n.split(/\s+/), last = w.pop(); return `${last}, ${w.map(x => x[0] + ".").join(" ")}`; };
  function apa(p) {
    const a = splitAuthors(p).map(apaName);
    const au = a.length > 1 ? a.slice(0, -1).join(", ") + ", & " + a[a.length - 1] : a[0];
    const link = U.pubLink(p);
    return `${au} (${p.year}). ${p.title}. ${p.venue}${p.details ? ", " + p.details : ""}.${p.status ? " " + p.status + "." : ""}${link ? " " + link : ""}`;
  }
  function bibtex(p) {
    const key = (U.norm(surname(splitAuthors(p)[0])).replace(/[^a-z]/g, "") + p.year + (U.norm(p.title).replace(/[^a-z\s]/g, "").split(/\s+/).find(w => w.length > 3 && !["with", "from", "using", "based", "towards", "novel"].includes(w)) || "paper"));
    const kind = { journal: "article", conference: "inproceedings", review: "unpublished", thesis: "mastersthesis" }[p.type];
    const f = [["title", `{${p.title}}`], ["author", splitAuthors(p).join(" and ")]];
    if (p.type === "journal") f.push(["journal", p.venue]);
    if (p.type === "conference") f.push(["booktitle", p.venue]);
    if (p.type === "thesis") f.push(["school", p.venue.replace(/^MS Thesis,\s*/, "")]);
    if (p.type === "review") f.push(["note", `${p.status}, ${p.venue}`]);
    f.push(["year", String(p.year)]);
    if (p.details) f.push(["note", p.details]);
    if (p.doi) f.push(["doi", p.doi]);
    else if (p.url) f.push(["url", p.url]);
    const seen = new Set(), rows = f.filter(([k]) => { if (seen.has(k)) return false; seen.add(k); return true; });
    return `@${kind}{${key},\n${rows.map(([k, v]) => `  ${k.padEnd(9)} = {${v}}`).join(",\n")}\n}`;
  }

  /* ================= run ================= */
  const fn = pages[U.page];
  const after = fn ? fn() : null;
  U.boot();
  if (typeof after === "function") (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, U.wait(1200)]) : U.wait(0)).then(after);
})();
