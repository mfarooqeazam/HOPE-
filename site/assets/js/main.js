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


  /* ---- scroll reveals --------------------------------------------------- */
  if (!reduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var host = /** @type {HTMLElement} */ (entry.target);
        var isGroup = host.hasAttribute("data-reveal-group");
        var kids = isGroup
          ? /** @type {HTMLElement[]} */ (Array.prototype.slice.call(host.children, 0, 5))
          : [host];

        kids.forEach(function (el, i) {
          setTimeout(function () { el.classList.add("in"); }, i * 70);
        });
        if (isGroup) {
          Array.prototype.slice.call(host.children, 5).forEach(function (el) {
            /** @type {HTMLElement} */ (el).classList.add("in");
          });
        }
        io.unobserve(host);
      });
    }, { rootMargin: "0px 0px -12% 0px" });

    all("[data-reveal],[data-reveal-group],[data-sec]").forEach(function (el) {
      if (el.hasAttribute("data-reveal-group")) {
        Array.prototype.forEach.call(el.children, function (c) {
          /** @type {HTMLElement} */ (c).setAttribute("data-reveal", "");
        });
      }
      io.observe(el);
    });

    /* Failsafe — content must never stay invisible because motion failed */
    setTimeout(function () {
      all("[data-reveal]:not(.in),[data-sec]:not(.in)").forEach(function (el) {
        el.classList.add("in");
      });
    }, 2500);
  } else {
    document.documentElement.classList.remove("js");
  }

  /* ---- scroll-linked: progress bar + process connector -------------------
     Both are scrubbed, i.e. they map directly to scroll position rather than
     moving on their own. One shared rAF-throttled listener does both, so
     there is only ever one scroll handler on the page. */
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
     Enhancement only. The map, its tier colours and the full country lists
     are all in the HTML already (generated by tools/genmap.py), so with
     scripting off nothing disappears — you simply lose hover and filtering.

     Countries are not individually focusable: 164 tab stops would wreck
     keyboard navigation. The chips below the map are the keyboard route,
     and they drive the same highlight. */
  (function reachMap() {
    var landEl = document.querySelector(".reach__land");
    var panelEl = document.querySelector(".reach__panel");
    if (!landEl || !panelEl) return;
    var land = /** @type {Element} */ (landEl);
    var panel = /** @type {Element} */ (panelEl);
    var readout = document.getElementById("reachRead");

    /** @param {Element|null} path */
    function describe(path) {
      if (!path) { if (readout) readout.textContent = ""; return; }
      var tier = path.classList.contains("t1") ? "working here now"
               : path.classList.contains("t2") ? "therapy possible"
               : path.classList.contains("t3") ? "IBAO training eligible" : null;
      if (readout) {
        readout.textContent = tier
          ? path.getAttribute("data-n") + " \u2014 " + tier
          : "";
      }
    }

    /** @param {Element|null} path */
    function mark(path) {
      all(".is-on", /** @type {ParentNode} */ (land)).forEach(function (n) {
        n.classList.remove("is-on");
      });
      if (path && !path.classList.contains("hide")) path.classList.add("is-on");
      describe(path);
    }

    land.addEventListener("mouseover", function (e) {
      var t = /** @type {Element} */ (e.target);
      /* SVG elements expose className as SVGAnimatedString, not a string,
         so read the attribute instead. */
      if (t && t.tagName === "path" && t.getAttribute("class")) mark(t);
    });
    land.addEventListener("mouseleave", function () { mark(null); });

    /* Legend buttons toggle a tier off and on. */
    all(".key").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tier = btn.getAttribute("data-tier");
        var on = btn.getAttribute("aria-pressed") === "true";
        btn.setAttribute("aria-pressed", on ? "false" : "true");
        land.classList.toggle("hide-" + tier, on);
        mark(null);
      });
    });

    /* Chips are the keyboard and screen-reader route into the map. */
    all(".chip").forEach(function (chip) {
      var code = chip.getAttribute("data-go");
      var path = land.querySelector('[data-c="' + code + '"]');
      function show() { mark(path); }
      chip.addEventListener("mouseenter", show);
      chip.addEventListener("focus", show);
      chip.addEventListener("click", show);
      chip.addEventListener("blur", function () { mark(null); });
    });

    /* One-time entrance for the whole layer. */
    if (!reduced && "IntersectionObserver" in window) {
      var mo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { panel.classList.add("in"); mo.disconnect(); }
        });
      }, { rootMargin: "0px 0px -10% 0px" });
      mo.observe(panel);
    } else {
      panel.classList.add("in");
    }
  })();
})();
