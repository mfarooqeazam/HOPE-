// @ts-check
/* ==========================================================================
   The Project Hope — site behaviour
   Plain JavaScript, no framework, no build step, no dependencies.

   TYPE CHECKING
     The `@ts-check` line above turns on TypeScript's checker for this file.
     Types come from JSDoc comments, so you get real type errors — wrong
     argument types, typos on properties, null dereferences — without a
     compile step and without a .ts extension. Run `npm run check:types`.

   PROGRESSIVE ENHANCEMENT
     If this file fails to load, the site still reads, navigates and submits.
     Nothing essential depends on JavaScript.
   ========================================================================== */
(function () {
  "use strict";

  /** @typedef {{SUPABASE_URL?:string, SUPABASE_ANON_KEY?:string, FALLBACK_PHONE?:string, FALLBACK_WHATSAPP?:string}} HopeConfig */

  /* The .js class is what opts elements into starting hidden. Setting it from
     JS guarantees a page without JS never hides anything. */
  document.documentElement.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** @type {HopeConfig} */
  var cfg = /** @type {any} */ (window).HOPE_CONFIG || {};

  /**
   * @param {string} sel
   * @param {ParentNode} [root]
   * @returns {HTMLElement[]}
   */
  function all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ---- footer year ------------------------------------------------------ */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---- mobile menu ------------------------------------------------------ */
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("navMenu");

  if (toggle && menu) {
    /** @param {boolean} open */
    var setOpen = function (open) {
      /** @type {HTMLElement} */ (menu).classList.toggle("is-open", open);
      /** @type {HTMLElement} */ (toggle).setAttribute("aria-expanded", open ? "true" : "false");
      /** @type {HTMLElement} */ (toggle).textContent = open ? "Close" : "Menu";
    };
    toggle.addEventListener("click", function () {
      setOpen(!(/** @type {HTMLElement} */ (menu).classList.contains("is-open")));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && /** @type {HTMLElement} */ (menu).classList.contains("is-open")) {
        setOpen(false);
        /** @type {HTMLElement} */ (toggle).focus();
      }
    });
    menu.addEventListener("click", function (e) {
      if (/** @type {HTMLElement} */ (e.target).closest("a")) setOpen(false);
    });
    var mq = window.matchMedia("(min-width: 1001px)");
    if (mq.addEventListener) mq.addEventListener("change", function () { setOpen(false); });
  }

  /* ======================================================================
     MOTION
     Budget: <=24px travel, once only, transform/opacity only, nothing loops,
     no parallax, no pinning. See .claude/skills/hope-motion-system.
     ====================================================================== */

  /* ---- headline word split ----------------------------------------------
     Wraps each word in a span so it can rise into place. Only applied to
     headings with no child elements, so markup like <em> is never destroyed.
     Whitespace stays as real text nodes, which keeps screen-reader output
     identical to the unsplit heading. */
  if (!reduced) {
    all("h1, .banner h1, .hero h1, section > .wrap > h2").forEach(function (el) {
      if (el.children.length || el.textContent === null) return;
      var words = el.textContent.split(/(\s+)/);
      if (words.length > 24) return;                 // leave long headings alone
      el.textContent = "";
      var i = 0;
      words.forEach(function (w) {
        if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(w)); return; }
        var s = document.createElement("span");
        s.className = "w";
        s.textContent = w;
        s.style.transitionDelay = Math.min(i, 8) * 45 + "ms";   // capped stagger
        el.appendChild(s);
        i++;
      });
      el.setAttribute("data-split", "");
      if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "");
    });
  }

  /* ---- section entrance --------------------------------------------------
     Marks every section below the fold so it fades and rises into view. The
     attribute is set from JS, never in the HTML, so a page without scripting
     hides nothing. Hero and trust band are skipped: both are already on
     screen at load, and animating them would only delay the first paint. */
  if (!reduced) {
    all("main > section").forEach(function (sec) {
      if (sec.classList.contains("hero") ||
          sec.classList.contains("band") ||
          sec.classList.contains("banner")) return;
      sec.setAttribute("data-sec", "");
    });
  }


  /* ---- scroll reveals ----------------------------------------------------
     Sections replay. Each one fades and rises every time it comes back into
     view, not just the first time, because a transition you can only ever
     see once is a transition most visitors never see at all.

     Replaying is the reason the old 2.5s failsafe had to go: it added .in to
     every section on the page two and a half seconds after load, so by the
     time anyone scrolled there was nothing left to animate. The failsafe now
     only rescues what is actually on screen; anything below the fold is the
     observer's job, and the observer is feature-detected.

     Elements outside a section still reveal once and stay revealed. */
  if (!reduced && "IntersectionObserver" in window) {

    /** @param {Element} host @param {boolean} on */
    function setGroup(host, on) {
      var isGroup = host.hasAttribute("data-reveal-group");
      var items = isGroup
        ? Array.prototype.slice.call(host.children)
        : [host];
      items.forEach(function (el, i) {
        var node = /** @type {HTMLElement} */ (el);
        if (!on) { node.classList.remove("in"); return; }
        if (i < 5) setTimeout(function () { node.classList.add("in"); }, i * 70);
        else node.classList.add("in");
      });
    }

    /* Sections: toggled, so they play again on every pass. The bottom margin
       delays the entrance slightly; the generous top margin means a section
       only resets once it is well clear of the viewport, never while any of
       it is still readable. */
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var sec = /** @type {HTMLElement} */ (entry.target);
        if (entry.isIntersecting) {
          sec.classList.add("in");
          all("[data-reveal],[data-reveal-group]", sec).forEach(function (el) {
            setGroup(el, true);
          });
        } else {
          sec.classList.remove("in");
          all("[data-reveal],[data-reveal-group]", sec).forEach(function (el) {
            setGroup(el, false);
          });
        }
      });
    }, { rootMargin: "10% 0px -10% 0px" });

    all("[data-sec]").forEach(function (el) {
      all("[data-reveal-group]", el).forEach(function (g) {
        Array.prototype.forEach.call(g.children, function (c) {
          /** @type {HTMLElement} */ (c).setAttribute("data-reveal", "");
        });
      });
      secIO.observe(el);
    });

    /* Anything not inside a replaying section reveals once and stays. */
    var onceIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        setGroup(entry.target, true);
        onceIO.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });

    all("[data-reveal],[data-reveal-group]").forEach(function (el) {
      if (el.closest("[data-sec]")) return;
      if (el.hasAttribute("data-reveal-group")) {
        Array.prototype.forEach.call(el.children, function (c) {
          /** @type {HTMLElement} */ (c).setAttribute("data-reveal", "");
        });
      }
      onceIO.observe(el);
    });

    /* Failsafe, scoped to what is on screen now. Content must never sit
       invisible because motion failed, but rescuing the whole page here is
       what broke the replay in the first place. */
    setTimeout(function () {
      all("[data-reveal]:not(.in),[data-sec]:not(.in)").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
      });
    }, 2500);
  } else {
    document.documentElement.classList.remove("js");
  }

  /* ---- scroll-linked: progress bar + process connector -------------------
     Both are scrubbed, i.e. they map directly to scroll position rather than
     moving on their own. One shared rAF-throttled listener does both, so
     there is only ever one scroll handler on the page. */
  var head = document.querySelector(".head");
  var bar = document.getElementById("progress");
  var steps = document.querySelector(".steps");
  /** @type {HTMLElement|null} */
  var line = null;

  if (steps && !reduced) {
    line = document.createElement("div");
    line.className = "steps__line";
    line.setAttribute("aria-hidden", "true");
    steps.insertBefore(line, steps.firstChild);
  }

  if ((bar || line) && !reduced) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        if (head) head.classList.toggle("is-stuck", window.scrollY > 8);
        if (bar) {
          var h = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.transform = "scaleX(" + (h > 0 ? window.scrollY / h : 0) + ")";
        }
        if (line && steps) {
          var r = steps.getBoundingClientRect();
          var from = window.innerHeight * 0.85;      // start when it enters
          var span = r.height + window.innerHeight * 0.35;
          var p = span > 0 ? (from - r.top) / span : 0;
          line.style.transform = "scaleX(" + Math.max(0, Math.min(1, p)) + ")";
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
  }

  /* ======================================================================
     FORMS
     Each form names its destination table with data-table. Submissions go
     straight to Supabase's REST API — no client library, so nothing extra
     loads and the Content-Security-Policy stays tight.
     ====================================================================== */

  /**
   * Turn a form into a plain object, respecting field types.
   * Checkbox groups sharing a name become arrays, which is what a Postgres
   * text[] column expects.
   * @param {HTMLFormElement} form
   * @returns {Record<string, any>}
   */
  function serialise(form) {
    /** @type {Record<string, any>} */
    var out = {};

    all("input[name],select[name],textarea[name]", form).forEach(function (node) {
      var el = /** @type {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} */ (node);
      var name = el.name;
      if (!name || el.closest(".hp")) return;              // skip the honeypot

      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        var group = all('input[type=checkbox][name="' + name + '"]', form);
        if (group.length > 1) {
          out[name] = group
            .filter(function (c) { return /** @type {HTMLInputElement} */ (c).checked; })
            .map(function (c) { return /** @type {HTMLInputElement} */ (c).value; });
        } else {
          out[name] = el.checked;
        }
        return;
      }
      if (el instanceof HTMLInputElement && el.type === "radio") {
        if (el.checked) out[name] = el.value;
        return;
      }

      var v = String(el.value).trim();
      if (v === "") return;                                // omit empties, keep NULLs clean
      out[name] = (el instanceof HTMLInputElement && el.type === "number") ? Number(v) : v;
    });

    if (form.dataset.kind) out.kind = form.dataset.kind;
    out.source_page = location.pathname.split("/").pop() || "index.html";
    return out;
  }

  /** @param {HTMLFormElement} form */
  function initForm(form) {
    var status = form.querySelector(".form-status");
    var submit = /** @type {HTMLButtonElement|null} */ (form.querySelector("button[type=submit]"));

    /** @param {HTMLElement} input @param {string} message */
    function showError(input, message) {
      var box = form.querySelector("#" + input.id + "-err");
      input.setAttribute("aria-invalid", "true");
      if (box) box.textContent = message;
    }
    /** @param {HTMLElement} input */
    function clearError(input) {
      var box = form.querySelector("#" + input.id + "-err");
      input.removeAttribute("aria-invalid");
      if (box) box.textContent = "";
    }
    /** @param {"ok"|"bad"} kind @param {string} text */
    function say(kind, text) {
      if (!status) return;
      status.className = "form-status form-status--" + kind;
      status.textContent = text;
    }

    /* Validate on blur and submit, never on keystroke — errors appearing while
       someone is still typing read as scolding, which matters on a form used
       by anxious parents. */
    all("input,textarea,select", form).forEach(function (node) {
      node.addEventListener("blur", function () {
        var el = /** @type {HTMLInputElement} */ (node);
        if (el.hasAttribute("required") && !String(el.value).trim()) return;
        clearError(el);
      });
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (status) { status.textContent = ""; status.className = "form-status"; }

      var trap = /** @type {HTMLInputElement|null} */ (form.querySelector(".hp input"));
      if (trap && trap.value) return;                      // bot

      /** @type {HTMLElement|null} */
      var firstBad = null;

      all("[required]", form).forEach(function (node) {
        var el = /** @type {HTMLInputElement} */ (node);
        var ok = (el.type === "checkbox") ? el.checked : String(el.value).trim() !== "";
        if (!ok) {
          showError(el, el.dataset.error || "This field is required.");
          if (!firstBad) firstBad = el;
        } else {
          clearError(el);
        }
      });

      var email = /** @type {HTMLInputElement|null} */ (form.querySelector("input[type=email]"));
      if (email && email.value.trim() && email.value.indexOf("@") === -1) {
        showError(email, "Please include an @ in the email address.");
        if (!firstBad) firstBad = email;
      }

      if (firstBad) {
        /** @type {HTMLElement} */ (firstBad).focus();     // never wipe what they typed
        return;
      }

      var table = form.dataset.table;
      if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || !table) {
        say("ok",
          "This form is complete and valid, but the database is not connected yet, " +
          "so nothing was sent. Please call or WhatsApp us on " +
          (cfg.FALLBACK_PHONE || "our number") + " in the meantime.");
        return;
      }

      if (submit) { submit.setAttribute("aria-busy", "true"); submit.disabled = true; }

      fetch(cfg.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/" + table, {
        method: "POST",
        headers: {
          "apikey": cfg.SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + cfg.SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(serialise(form))
      }).then(function (res) {
        if (!res.ok) return res.text().then(function (t) { throw new Error(t || String(res.status)); });
        form.reset();
        say("ok", form.dataset.success || "Thank you — we have your details and will be in touch.");
        if (status instanceof HTMLElement) status.focus();
        return undefined;
      }).catch(function () {
        say("bad",
          "Sorry, that didn't send. Please call or WhatsApp us on " +
          (cfg.FALLBACK_PHONE || "our number") + " and we'll pick it up from there.");
      }).then(function () {
        if (submit) { submit.removeAttribute("aria-busy"); submit.disabled = false; }
      });
    });
  }

  all("form.enquiry").forEach(function (f) { initForm(/** @type {HTMLFormElement} */ (f)); });

  /* ---- world reach map ---------------------------------------------------
     Ported from design/HopeReachMap.dc.html. Enhancement only: the geometry,
     the layer flags and the full country lists are already in the HTML, so
     with scripting off you lose hover and filtering and nothing else.

     The design's hard-won rules, kept exactly:
       - Three independent state variables - hovered, selected, filter - read
         by a single render(). Hover never writes selection. That separation
         is what fixed a sticky-hover bug.
       - Emphasis draws as a mirror path on a layer ABOVE the land. Nothing
         in the land group is ever reordered mid-hover, which was the
         original cause of stuck highlights.
       - Fill is the only carrier of data. Strokes stay uniform.

     Added here, because the handoff lists it as a gap to fix: the map was
     mouse-only. The 97 countries that carry data now form a roving-tabindex
     composite - one tab stop, arrow keys to move between countries ordered
     west to east, Enter to pin, Escape to clear. The country lists below the
     map drive the same state, so there are two keyboard routes. */
  (function reachMap() {
    /* const, not var: the type checker only keeps a null-narrowing across
       closure boundaries for bindings that cannot be reassigned. */
    const frame = /** @type {HTMLElement|null} */ (document.querySelector("[data-map-frame]"));
    const svg = /** @type {SVGSVGElement|null} */ (document.querySelector("[data-map-svg]"));
    const panel = /** @type {HTMLElement|null} */ (document.querySelector("[data-panel]"));
    const hi = /** @type {SVGPathElement|null} */ (document.querySelector("[data-hi]"));
    if (!frame || !svg || !panel || !hi) return;

    /** @typedef {{rest:string, mid:string, full:string, head:string, items:string[]}} ReachLayer */
    /** Resting / filtered / emphasised fills per layer, from the design.
     *  @type {Object<string, ReachLayer>} */
    var L = {
      ip: { rest: "#35646B", mid: "#21565F", full: "#174F59",
            head: "HOPE in person",
            items: ["ABA, speech, occupational therapy, physiotherapy",
                    "Inclusive school \u2014 therapy or a place funded by need"] },
      tr: { rest: "#A6B6A5", mid: "#9AAF9C", full: "#91A995",
            head: "professional training",
            items: ["IBA \u2014 270 hours \u00b7 IBT \u2014 40 hours",
                    "Supervision, mentorship and CEUs"] },
      th: { rest: "#CF9789", mid: "#CC8677", full: "#C97868",
            head: "therapy",
            items: ["Therapy and behavioural support",
                    "Educational support, IEPs and BMPs"] },
      /* Gold is an information layer, not the map's colour. 97 countries at
         full strength made the world look gold, so it rests near 46% and
         only lifts when the IBAO filter isolates it. */
      ib: { rest: "#D9CDAE", mid: "#CAAF77", full: "#C8A96B",
            head: "IBAO global reach",
            items: ["Represented in IBAO's public certification directory"] }
    };
    var BASE = "#DCD8CF";
    var ORDER = ["ip", "tr", "th", "ib"];

    const shapes = /** @type {SVGPathElement[]} */ (
      Array.prototype.slice.call(svg.querySelectorAll("path[data-n]")));
    const navShapes = shapes.filter(function (el) { return el.hasAttribute("data-nav"); });
    const rule = /** @type {HTMLElement|null} */ (panel.querySelector("[data-panel-rule]"));
    const nameEl = /** @type {HTMLElement|null} */ (panel.querySelector("[data-panel-name]"));
    const bodyEl = /** @type {HTMLElement|null} */ (panel.querySelector("[data-panel-body]"));
    const chips = all(".reach__chip");
    if (!nameEl || !bodyEl) return;

    /* Re-bound after the guards. Function declarations are hoisted, so the
       checker will not carry a null-narrowing into them; binding the checked
       values to fresh consts does. */
    const hiPath = hi;
    const nameNode = nameEl;
    const bodyNode = bodyEl;
    const frameEl = frame;
    const panelEl = panel;

    /* Three state variables. One reader. */
    /** @type {SVGPathElement|null} */ var hovered = null;
    /** @type {SVGPathElement|null} */ var selected = null;
    /** @type {string|null} */ var filter = null;
    var navIndex = 0;

    /** @param {SVGPathElement} el @returns {string[]} */
    function layersOf(el) {
      return ORDER.filter(function (k) { return el.getAttribute("data-" + k) === "1"; });
    }
    /** @param {SVGPathElement} el @returns {string|undefined} */
    function firstOf(el) { return layersOf(el)[0]; }

    /** @param {SVGPathElement} el @returns {string} */
    function fillFor(el) {
      if (filter) return el.getAttribute("data-" + filter) === "1" ? L[filter].mid : BASE;
      var k = firstOf(el);
      return k ? L[k].rest : BASE;
    }
    function paint() {
      shapes.forEach(function (el) { el.style.fill = fillFor(el); });
    }

    /** @param {SVGPathElement|null} el @param {boolean} strong */
    function emphasise(el, strong) {
      if (!el) { hiPath.style.opacity = "0"; hiPath.style.fill = "none"; return; }
      var k = firstOf(el);
      hiPath.setAttribute("d", el.getAttribute("d") || "");
      hiPath.style.fill = k ? L[k].full : "#C9C4B8";
      hiPath.setAttribute("stroke", strong ? (k ? L[k].full : "#B4AEA1") : "none");
      hiPath.setAttribute("stroke-width", strong ? "1.2" : "0");
      hiPath.style.opacity = "1";
    }

    /** @param {string} head @param {string[]} items @param {string} colour
     *  @returns {HTMLDivElement} */
    function group(head, items, colour) {
      var wrap = document.createElement("div");
      var h = document.createElement("p");
      h.className = "reach__group-head";
      h.textContent = head;
      var ul = document.createElement("ul");
      ul.className = "reach__group-list";
      items.forEach(function (text) {
        var li = document.createElement("li");
        var dot = document.createElement("span");
        dot.className = "reach__dot";
        dot.style.setProperty("--dot", colour);
        var t = document.createElement("span");
        t.textContent = text;
        li.appendChild(dot); li.appendChild(t); ul.appendChild(li);
      });
      wrap.appendChild(h); wrap.appendChild(ul);
      return wrap;
    }

    /** @param {SVGPathElement} el */
    function show(el) {
      var hope = layersOf(el).filter(function (k) { return k !== "ib"; });
      var k = firstOf(el);
      nameNode.textContent = el.getAttribute("data-n") || "";
      if (rule) rule.style.background = k ? L[k].full : "#C6C1B4";
      bodyNode.innerHTML = "";

      if (hope.length) {
        var onSite = hope.indexOf("ip") > -1;
        /* ip.items already names the four therapies delivered on the ground,
           so a separate therapy group there would only restate them. */
        (onSite ? ["ip", "tr"] : hope).forEach(function (key) {
          if (!L[key]) return;
          var head = key === "ip" ? L.ip.head
            : (onSite ? L[key].head + ", on site" : "Online " + L[key].head);
          bodyNode.appendChild(group(head, L[key].items, L[key].full));
        });
      } else {
        bodyNode.appendChild(group("Available online", [
          "Online therapy, behavioural and educational support, IEPs and BMPs",
          "IBA and IBT training, supervision and CEUs",
          "No work here yet \u2014 delivery is possible from day one"
        ], "#A8A296"));
      }
      if (el.getAttribute("data-ib") === "1") {
        bodyNode.appendChild(group(L.ib.head, L.ib.items, L.ib.full));
      }

      /* Edge-aware: flips side, then clamps, so it never leaves the frame. */
      var fb = frameEl.getBoundingClientRect(), b = el.getBoundingClientRect();
      var pw = panelEl.offsetWidth || 242, ph = panelEl.offsetHeight || 150, gap = 14;
      var cx = b.left + b.width / 2 - fb.left, cy = b.top + b.height / 2 - fb.top;
      var x = b.right - fb.left + gap;
      if (x + pw > fb.width - 8) x = b.left - fb.left - gap - pw;
      if (x < 8) x = Math.min(Math.max(8, cx - pw / 2), Math.max(8, fb.width - pw - 8));
      var y = cy - ph / 2;
      if (y + ph > fb.height - 8) y = fb.height - ph - 8;
      if (y < 8) y = 8;
      panelEl.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
      panelEl.style.visibility = "visible";
      panelEl.style.opacity = "1";
    }
    function hidePanel() { panelEl.style.opacity = "0"; panelEl.style.visibility = "hidden"; }

    /* The single reader of all three state variables. */
    function render() {
      paint();
      var focus = hovered || selected;
      emphasise(focus, !!selected && focus === selected);
      if (focus) show(focus); else hidePanel();
      var name = selected ? selected.getAttribute("data-n") : null;
      chips.forEach(function (c) {
        c.setAttribute("aria-current", c.getAttribute("data-go") === name ? "true" : "false");
      });
    }

    shapes.forEach(function (el) {
      el.addEventListener("mouseenter", function () { hovered = el; render(); });
      el.addEventListener("mouseleave", function () {
        if (hovered === el) hovered = null;
        render();
      });
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        selected = selected === el ? null : el;
        render();
      });
    });
    frameEl.addEventListener("click", function () { selected = null; render(); });
    frameEl.addEventListener("mouseleave", function () { hovered = null; render(); });

    /* ---- keyboard: roving tabindex over the countries carrying data ------ */
    /** @param {number} i */
    function focusNav(i) {
      if (!navShapes.length) return;
      navIndex = (i + navShapes.length) % navShapes.length;
      navShapes.forEach(function (el, j) {
        el.setAttribute("tabindex", j === navIndex ? "0" : "-1");
      });
      navShapes[navIndex].focus();
    }

    if (navShapes.length) {
      /* West to east, so Left and Right feel geographic rather than
         document-ordered. Measured once, from the projected geometry. */
      navShapes.sort(function (a, b) {
        try {
          return /** @type {SVGGraphicsElement} */ (a).getBBox().x -
                 /** @type {SVGGraphicsElement} */ (b).getBBox().x;
        } catch (err) { return 0; }
      });
      navShapes.forEach(function (el, i) {
        el.setAttribute("tabindex", i === 0 ? "0" : "-1");
        el.setAttribute("role", "button");
        el.addEventListener("focus", function () {
          navIndex = i; hovered = el; render();
        });
        el.addEventListener("blur", function () {
          if (hovered === el) { hovered = null; render(); }
        });
        el.addEventListener("keydown", function (e) {
          var k = e.key;
          if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); focusNav(navIndex + 1); }
          else if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); focusNav(navIndex - 1); }
          else if (k === "Home") { e.preventDefault(); focusNav(0); }
          else if (k === "End") { e.preventDefault(); focusNav(navShapes.length - 1); }
          else if (k === "Enter" || k === " ") {
            e.preventDefault();
            selected = selected === el ? null : el;
            render();
          }
        });
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && selected) { selected = null; render(); }
    });

    /* ---- filters --------------------------------------------------------- */
    var btns = all("[data-filter]");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-filter");
        filter = (id === "all" || filter === id) ? null : id;
        selected = null; hovered = null;
        btns.forEach(function (x) {
          var on = x.getAttribute("data-filter") === filter ||
                   (!filter && x.getAttribute("data-filter") === "all");
          x.setAttribute("aria-pressed", on ? "true" : "false");
        });
        render();
      });
    });

    /* ---- country lists drive the same state ------------------------------ */
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var want = c.getAttribute("data-go");
        var target = shapes.filter(function (el) {
          return el.getAttribute("data-n") === want;
        })[0];
        if (!target) return;
        selected = selected === target ? null : target;
        hovered = null;
        render();
        if (selected) {
          frameEl.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
        }
      });
    });

    render();
  })();
})();
