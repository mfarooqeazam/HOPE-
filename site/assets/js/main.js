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

  /* GSAP, self-hosted and loaded before this file. It is an enhancement, not
     a dependency: if either script fails, every animation below falls back to
     the IntersectionObserver and CSS path that shipped before it, and with no
     JavaScript at all the .js class is never set so nothing is ever hidden.

     GSAP owns the whole page except the reach section, which keeps the older
     path so its timing stays exactly as it was. The hero also stays on CSS
     keyframes on purpose -- it is above the fold, and making the first thing
     a visitor sees wait for the library to parse would undo the work that
     got the largest contentful paint down. */
  var gsap = /** @type {any} */ (window).gsap;
  var useGsap = !reduced && !!gsap && "IntersectionObserver" in window;
  if (useGsap) document.documentElement.classList.add("gsap");

  /** The frozen section keeps the pre-GSAP path. @param {Element} el */
  function fallbackOwns(el) {
    return !useGsap || !!el.closest(".reach");
  }

  /** Motion budget: nothing travels further than this. */
  var TRAVEL = 14;

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
  /* The copyright year is written in the markup, not derived from the
     visitor's clock. A machine with a wrong date used to age the site. */

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
     identical to the unsplit heading.

     h1 is deliberately excluded. Every page's h1 is its largest contentful
     paint, and a split word starts at opacity 0, so splitting the h1 meant
     the LCP element stayed invisible until the observer had run and the
     stagger had finished -- 1873ms of render delay, measured, on a page
     whose server answered in 464ms. The h1 keeps its entrance, but as a
     transform-only rise that paints immediately (37.1). Below-the-fold h2s
     are not the LCP element and are split as before. */
  if (!reduced) {
    all("section > .wrap > h2").forEach(function (el) {
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

    /* Any container that lays its children out as a row or a grid is treated
       as a reveal group, so the cards in it arrive one after another instead
       of as a slab. Doing it here rather than in the markup means all fifteen
       pages get it without fifteen edits, and a page with scripting off is
       unaffected either way. */
    all(".grid, .steps, .trio, .gal, .tiles, .doors, .channels, .cards, .posts")
      .forEach(function (el) {
        if (el.closest(".reach")) return;              // frozen section
        if (!el.hasAttribute("data-reveal-group") && el.children.length > 1) {
          el.setAttribute("data-reveal-group", "");
        }
      });

    /** @param {Element} host @param {boolean} on */
    function setGroup(host, on) {
      var isGroup = host.hasAttribute("data-reveal-group");
      var items = isGroup
        ? Array.prototype.slice.call(host.children)
        : [host];
      items.forEach(function (el, i) {
        var node = /** @type {HTMLElement} */ (el);
        if (!on) { node.classList.remove("in"); return; }
        /* The reach section keeps the timer-based stagger it shipped with,
           to the millisecond. It is frozen by instruction, and its figures
           are a declared group, so the newer path would have quietly
           retimed them from 70ms steps to 55ms. */
        if (isGroup && host.closest(".reach")) {
          if (i < 5) setTimeout(function () { node.classList.add("in"); }, i * 70);
          else node.classList.add("in");
          return;
        }
        /* Everywhere else the stagger is a CSS custom property read by
           transition-delay, not a chain of timers. Timers drift under load
           and each one is a task on the main thread; a delay is resolved by
           the compositor. Capped at seven so a twelve-card grid still
           finishes inside ~400ms. */
        if (isGroup) node.style.setProperty("--i", String(Math.min(i, 7)));
        node.classList.add("in");
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

    all("[data-sec]").filter(fallbackOwns).forEach(function (el) {
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

    all("[data-reveal],[data-reveal-group]").filter(fallbackOwns).forEach(function (el) {
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

  /* ---- GSAP: section timelines, uncovers, counters ------------------------
     What GSAP is actually here for is ordering. Two independent observers can
     say "reveal this" and "reveal that", but they cannot say "and then" --
     each section now runs a timeline where the section arrives first and the
     cards inside it follow in sequence, off one trigger.

     Inside the budget, deliberately: nothing is scrubbed, nothing is pinned,
     nothing parallaxes, nothing repeats, and nothing travels further than
     TRAVEL. Those are the features GSAP is usually bought for, and they are
     the ones this audience cannot have. Reduced-motion never reaches here --
     useGsap is false and the CSS path takes over.

     .in is still added and removed alongside the tween, because a number of
     purely decorative CSS rules (the eyebrow rule, the drawn rule above each
     heading) key off it and would otherwise never fire. */
  if (useGsap) {
    var EASE = "power2.out";

    /** Everything except the frozen section. @param {Element} el */
    function mine(el) { return !el.closest(".reach"); }

    /** ScrollTrigger is deliberately not loaded. It is 43.5KB for scrubbing,
       pinning and parallax -- the three things this site's motion budget
       forbids outright, because the audience includes autistic children. What
       is actually needed from it is "tell me when this element is on screen",
       which IntersectionObserver already does, natively, for nothing. GSAP
       core stays, because the thing it does that nothing else does is order
       one tween after another.

       @param {Element} el
       @param {string} margin  rootMargin, i.e. how far up the fold to fire
       @param {() => void} enter
       @param {(() => void)=} back  called when scrolled back above it */
    function onView(el, margin, enter, back) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            enter();
            if (!back) io.unobserve(en.target);
          } else if (back && en.boundingClientRect.top > 0) {
            back();
          }
        });
      }, { rootMargin: margin });
      io.observe(el);
    }

    /* The same auto-promotion the fallback path does. */
    all(".grid, .steps, .trio, .gal, .tiles, .doors, .channels, .cards, .posts")
      .forEach(function (el) {
        if (!mine(el)) return;
        if (!el.hasAttribute("data-reveal-group") && el.children.length > 1) {
          el.setAttribute("data-reveal-group", "");
        }
      });
    all("[data-reveal-group]").forEach(function (g) {
      if (!mine(g)) return;
      Array.prototype.forEach.call(g.children, function (c) {
        /** @type {HTMLElement} */ (c).setAttribute("data-reveal", "");
      });
    });

    var gsSecs  = all("[data-sec]").filter(mine);
    var gsItems = all("[data-reveal]").filter(mine);
    var loose   = gsItems.filter(function (el) { return !el.closest("[data-sec]"); });

    /* Mark what GSAP drives so the stylesheet stops transitioning the same
       properties underneath it. Two engines writing one property is jank. */
    gsSecs.concat(gsItems).forEach(function (el) { el.classList.add("gs"); });
    gsap.set(gsSecs.concat(gsItems), { opacity: 0, y: TRAVEL });

    /** @param {HTMLElement[]} els @param {boolean} on */
    function mark(els, on) {
      els.forEach(function (el) { el.classList[on ? "add" : "remove"]("in"); });
    }

    /* One timeline per section: the section arrives, then the cards inside it
       follow in sequence off the same trigger. That ordering is what GSAP is
       here for -- two independent observers can say "reveal this" and "reveal
       that", but neither can say "and then".

       Nothing is scrubbed, pinned or repeated, and nothing travels further
       than TRAVEL. .in is added alongside the tween because several purely
       decorative CSS rules key off it and would otherwise never fire. */
    gsSecs.forEach(function (sec) {
      var kids = all("[data-reveal]", sec).filter(mine);
      var tl = gsap.timeline({ paused: true });
      tl.to(sec, { opacity: 1, y: 0, duration: .5, ease: EASE });
      if (kids.length) {
        /* amount, not each: a twelve-card grid staggers over the same 0.42s a
           four-card one does, instead of running for two-thirds of a second
           while the reader waits for the last tile. */
        tl.to(kids, {
          opacity: 1, y: 0, duration: .55, ease: EASE,
          stagger: { amount: Math.min(kids.length * 0.055, 0.42) }
        }, "-=0.3");
      }
      onView(sec, "0px 0px -14% 0px",
        function () { sec.classList.add("in"); mark(kids, true); tl.play(); },
        function () { sec.classList.remove("in"); mark(kids, false); tl.pause(0); });
    });

    /* Anything outside a section reveals once and stays. */
    loose.forEach(function (el) {
      onView(el, "0px 0px -8% 0px", function () {
        el.classList.add("in");
        gsap.to(el, { opacity: 1, y: 0, duration: .55, ease: EASE });
      });
    });

    /* Photographs wipe open, the image easing out of a slight scale behind
       them. The hero is excluded: it has its own CSS entrance, which does not
       wait for this library to download and parse. */
    all(".frame--comp, .photo.frame--comp, .card__img, .door__img, .banner__media, .portrait, .svc-card__img")
      .filter(function (el) { return mine(el) && !el.closest(".hero"); })
      .forEach(function (el) {
        var img = el.querySelector("img");
        onView(el, "0px 0px -12% 0px", function () {
          var tl = gsap.timeline();
          tl.fromTo(el, { clipPath: "inset(0 0 100% 0)" },
                        { clipPath: "inset(0 0 0% 0)", duration: .85, ease: EASE }, 0);
          if (img) tl.fromTo(img, { scale: 1.05 }, { scale: 1, duration: 1.1, ease: EASE }, 0);
        });
      });

    /* Numbers count up. Only the digits move: "1 in 31" keeps its words and
       "PKR 30,000" keeps its separators, and the exact original string is
       restored at the end so nothing is ever left approximated. */
    all(".stat b, .tile b").filter(mine).forEach(function (el) {
      var raw = el.textContent || "";
      var m = raw.match(/([\d,]*\d)/);
      if (!m) return;
      var digits = m[1];
      var target = parseInt(digits.replace(/,/g, ""), 10);
      if (!isFinite(target) || target < 10) return;   // counting 0 to 1 is a flicker
      var grouped = digits.indexOf(",") > -1;
      var head = raw.slice(0, m.index);
      var tail = raw.slice((m.index || 0) + digits.length);
      onView(el, "0px 0px -8% 0px", function () {
        var box = { v: 0 };
        gsap.to(box, {
          v: target, duration: .9, ease: EASE, snap: { v: 1 },
          onUpdate: function () {
            el.textContent = head + (grouped ? box.v.toLocaleString("en-GB") : String(box.v)) + tail;
          },
          onComplete: function () { el.textContent = raw; }
        });
      });
    });

    /* Failsafe, scoped to what is on screen. Content must never sit invisible
       because a library failed -- but rescuing the whole page would force
       every section open at once and leave nothing to play. */
    window.setTimeout(function () {
      all(".gs").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top > window.innerHeight || r.bottom < 0) return;
        if (parseFloat(window.getComputedStyle(el).opacity) > 0.99) return;
        gsap.set(el, { opacity: 1, y: 0 });
        el.classList.add("in");
      });
    }, 4000);
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

    /* Some forms collect more than their target table has columns for. Rather
       than lose the answers or wait on a migration, `data-fold` names the
       column everything else is folded into as readable text, and lists the
       fields the table actually has.

       This is what keeps the volunteer form working: `enquiries` has no
       volunteer_as or services column, so those answers are written into the
       message instead of being dropped on the floor. */
    var fold = form.dataset.fold;
    if (fold) {
      var keep = (form.dataset.keep || "").split(",").map(function (k) { return k.trim(); });
      keep.push(fold, "source_page");
      /** @type {string[]} */
      var lines = [];
      var base = out[fold] ? String(out[fold]).trim() : "";
      Object.keys(out).forEach(function (k) {
        if (keep.indexOf(k) > -1) return;
        var v = out[k];
        if (v === "" || v === null || v === undefined || v === false) { delete out[k]; return; }
        if (Array.isArray(v)) {
          if (!v.length) { delete out[k]; return; }
          v = v.join(", ");
        }
        if (v === true) v = "yes";
        var label = k.replace(/_/g, " ");
        lines.push(label.charAt(0).toUpperCase() + label.slice(1) + ": " + v);
        delete out[k];
      });
      out[fold] = (base ? base + "\n\n" : "") + lines.join("\n");
    }
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

  /* ---- photographs uncover ----------------------------------------------
     Every framed photograph is wiped open from the bottom as it is reached,
     rather than fading. The attribute is added here rather than in the
     markup, so with scripting off nothing is ever clipped.

     The hero is excluded: it is above the fold and has its own entrance.

     Two observers, not one. Clipping an element and scaling the image inside
     it costs a style recalc and a compositor layer, and doing that to a dozen
     photographs during load cost 137ms of blocking time when measured against
     a control build. So the first observer only *prepares* a photograph once
     it is within 700px of the viewport, and the second one opens it. The work
     is the same; it is spread across the scroll instead of landing at once. */
  (function uncoverImages() {
    if (useGsap) return;                       // the GSAP path does this one
    if (reduced || !("IntersectionObserver" in window)) return;
    var frames = all(".frame--comp, .photo.frame--comp, .card__img, .door__img, .banner__media, .portrait, .svc-card__img")
      .filter(function (el) { return !el.closest(".hero"); });
    if (!frames.length) return;

    /** every photograph that has been clipped, so the failsafe can open it */
    var prepared = /** @type {HTMLElement[]} */ ([]);

    var open = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        /** @type {HTMLElement} */ (en.target).classList.add("is-in");
        open.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });

    var prep = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = /** @type {HTMLElement} */ (en.target);
        prep.unobserve(el);
        el.setAttribute("data-uncover", "");
        prepared.push(el);
        /* Read a layout property so the clipped state is committed before the
           open state is observed. Without it a photograph that is prepared and
           reached in the same frame jumps instead of wiping. */
        void el.offsetHeight;
        open.observe(el);
      });
    }, { rootMargin: "700px 0px 700px 0px" });
    frames.forEach(function (el) { prep.observe(el); });

    /* Content must never be left clipped because motion failed. */
    window.setTimeout(function () {
      prepared.forEach(function (el) { el.classList.add("is-in"); });
    }, 3000);
  })();

  /* ---- numbers count -----------------------------------------------------
     The figures on Why it matters and the home vision tiles count up the
     first time they are reached. Only the digits move: "1 in 31" keeps its
     words, "PKR 30,000" keeps its separators, "2x" keeps its multiplier.
     Anything without a number in it is left alone.

     Runs once per element, on a rAF loop that stops when it is done, so
     there is no timer left running on the page. */
  (function countNumbers() {
    if (useGsap) return;                       // the GSAP path does this one
    if (reduced || !("IntersectionObserver" in window)) return;
    /* .reach__figures is excluded on purpose: the reach section is frozen by
       instruction, and counting its numbers would change how it renders. */
    var targets = all(".stat b, .tile b").filter(function (el) {
      return /\d/.test(el.textContent || "");
    });
    if (!targets.length) return;

    /** @param {HTMLElement} el */
    function run(el) {
      var raw = el.textContent || "";
      var m = raw.match(/([\d,]*\d)/);
      if (!m) return;
      var digits = m[1];
      var target = parseInt(digits.replace(/,/g, ""), 10);
      /* Counting 0-1 is not an animation, it is a flicker. Below 10 the
         number is read whole and counting only makes it look broken. */
      if (!isFinite(target) || target < 10) return;
      var grouped = digits.indexOf(",") > -1;
      var before = raw.slice(0, m.index);
      var after = raw.slice((m.index || 0) + digits.length);

      var t0 = 0;
      var DUR = 900;
      /** @param {number} now */
      function frame(now) {
        if (!t0) t0 = now;
        var k = Math.min(1, (now - t0) / DUR);
        /* Ease out: fast at the start, settling at the end, so the final
           value is readable rather than snapping into place. */
        var v = Math.round(target * (1 - Math.pow(1 - k, 3)));
        el.textContent = before + (grouped ? v.toLocaleString("en-GB") : String(v)) + after;
        if (k < 1) requestAnimationFrame(frame);
        else el.textContent = raw;          // restore the exact original
      }
      requestAnimationFrame(frame);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(/** @type {HTMLElement} */ (en.target));
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -20% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  })();

  /* ---- map arrival -------------------------------------------------------
     The countries drift in from the direction they sit in and settle. Purely
     presentational: this reads geometry to work out a direction and sets two
     custom properties. It touches no fill, no layer flag, no state and no
     part of the map's own logic.

     Distance is capped at 14px because that is the motion budget, and the
     budget exists for the audience rather than for taste. The impression of
     the map assembling comes from the stagger, not from how far anything
     travels. Runs once. */
  (function mapArrival() {
    if (reduced || !("IntersectionObserver" in window)) return;
    var svgEl = /** @type {SVGSVGElement|null} */ (document.querySelector("[data-map-svg]"));
    if (!svgEl) return;
    const svg = svgEl;
    var shapes = all("path[data-n]", svg);
    if (!shapes.length) return;

    var vb = (svg.getAttribute("viewBox") || "0 0 1000 406").split(/\s+/).map(Number);
    var w = vb[2] || 1000, h = vb[3] || 406;
    var cx = w / 2, cy = h / 2;
    var MAX = 14;                       // px, the whole budget

    /* getBBox() forces layout, and there are 175 of them. Doing that at load
       cost about 600ms of blocking time for an animation nobody had scrolled
       to yet. It now happens once, when the map is first approached, and the
       observer fires early enough that the work is finished before the map
       is actually on screen. */
    var prepared = false;
    function prepare() {
      if (prepared) return;
      prepared = true;
      shapes.forEach(function (el) {
        var b;
        try {
          b = /** @type {SVGGraphicsElement} */ (/** @type {unknown} */ (el)).getBBox();
        } catch (err) { return; }
        var x = b.x + b.width / 2, y = b.y + b.height / 2;
        var vx = x - cx, vy = y - cy;
        var len = Math.sqrt(vx * vx + vy * vy) || 1;
        /* Outward from the centre, so each country arrives from the side of
           the world it belongs to. */
        el.style.setProperty("--dx", (vx / len * MAX).toFixed(1) + "px");
        el.style.setProperty("--dy", (vy / len * MAX).toFixed(1) + "px");
        /* West to east, capped so the last country is never more than about
           half a second behind the first. */
        el.style.setProperty("--d", Math.round((x / w) * 520) + "ms");
      });
      svg.setAttribute("data-arrive", "");
    }

    /* Two observers: one well ahead of the map to do the measuring, one at
       the map itself to start the transition. */
    var pre = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        prepare();
        pre.disconnect();
      });
    }, { rootMargin: "600px 0px 600px 0px" });
    pre.observe(svg);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        prepare();
        requestAnimationFrame(function () { svg.classList.add("is-in"); });
        io.disconnect();
      });
    }, { rootMargin: "0px 0px -15% 0px" });
    io.observe(svg);

    /* If the observer never fires, the map must not stay invisible. */
    window.setTimeout(function () { svg.classList.add("is-in"); }, 3000);
  })();

  /* ---- therapy selector --------------------------------------------------
     Four cards, one panel. A proper tablist: one tab stop, arrow keys move
     between therapies, Home and End jump to the ends.

     Enhancement only. With scripting off every panel is visible and the page
     reads as four sections, which is exactly what it was before. */
  (function therapySelector() {
    var listEl = document.querySelector(".svc-cards[role='tablist']");
    if (!listEl) return;
    var tabs = /** @type {HTMLElement[]} */ (all("[role='tab']", listEl));
    var panels = /** @type {HTMLElement[]} */ (all(".svc-detail[role='tabpanel']"));
    if (!tabs.length || !panels.length) return;

    /** @param {string} id */
    function panelFor(id) {
      return panels.filter(function (p) { return p.id === id; })[0] || null;
    }

    /** @param {number} i @param {boolean} [focus] */
    function select(i, focus) {
      var tab = tabs[i];
      if (!tab) return;
      var wanted = tab.getAttribute("aria-controls") || "";
      var next = panelFor(wanted);
      if (!next) return;

      tabs.forEach(function (t, j) {
        t.setAttribute("aria-selected", j === i ? "true" : "false");
        t.setAttribute("tabindex", j === i ? "0" : "-1");
      });

      var current = panels.filter(function (p) { return !p.hidden; })[0];

      /* Clicking the open one closes it. Nothing is open at load, so the four
         therapies read as a row of equals rather than one being singled out
         for no reason. */
      if (current === next) {
        next.hidden = true;
        next.classList.remove("is-in");
        tab.setAttribute("aria-selected", "false");
        if (focus) tab.focus();
        return;
      }

      /* Fade the outgoing panel, swap, then let the blocks arrive in
         sequence. Height is not animated — animating height on a panel whose
         content varies is where this kind of component usually starts
         juddering. */
      function show() {
        panels.forEach(function (p) { p.hidden = p !== next; });
        next.classList.remove("is-in");
        next.classList.add("is-swapping");
        /* Two frames: one for the browser to apply the start state, one to
           transition away from it. */
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            next.classList.remove("is-swapping");
            next.classList.add("is-in");
          });
        });
        if (focus) tab.focus();
      }

      if (reduced || !current) { show(); return; }
      current.classList.add("is-swapping");
      window.setTimeout(show, 160);
    }

    /** @param {number} i */
    function focusTab(i) {
      tabs.forEach(function (t, j) { t.setAttribute("tabindex", j === i ? "0" : "-1"); });
      if (tabs[i]) tabs[i].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i); });
      tab.addEventListener("keydown", function (e) {
        var k = e.key;
        var last = tabs.length - 1;
        /* Arrow keys move focus only. Opening is a deliberate act — Enter or
           Space — so a keyboard user is not made to open all four on the way
           past. */
        if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); focusTab(i === last ? 0 : i + 1); }
        else if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); focusTab(i === 0 ? last : i - 1); }
        else if (k === "Home") { e.preventDefault(); focusTab(0); }
        else if (k === "End") { e.preventDefault(); focusTab(last); }
        else if (k === "Enter" || k === " ") { e.preventDefault(); select(i, true); }
      });
    });

    /* Nothing is open at load. With scripting off every panel is visible,
       which is the correct fallback — the page then reads as four sections. */
  })();

  /* ---- hero growth motif -------------------------------------------------
     Hovering or focusing one strand dims the others and names what it means.
     Enhancement only: with scripting off the illustration is still complete
     and still labelled, you simply cannot isolate a strand. */
  (function growth() {
    const figEl = /** @type {HTMLElement|null} */ (document.querySelector(".growth"));
    if (!figEl) return;
    const noteEl = figEl.querySelector("[data-growth-note]");
    if (!noteEl) return;
    /* Re-bound so the null narrowing carries into the handlers below. */
    const fig = figEl, note = noteEl;
    const REST = note.textContent || "";

    /** @type {Object<string,string>} */
    var TEXT = {
      therapy: "Therapy \u2014 ABA, speech and language, occupational therapy and physiotherapy, planned together rather than in parallel.",
      education: "Education \u2014 an inclusive classroom and individualised education plans, so a skill learned in session is practised the same week.",
      family: "Family \u2014 caregivers taught the strategies, not just told the outcome. What happens between sessions is what makes a skill stick.",
      training: "Training \u2014 IBA and IBT pathways, supervision and CEUs, so the standard of care here does not depend on who can afford to travel."
    };

    var parts = all("[data-arc]", fig);

    /** @param {string|null} key */
    function set(key) {
      fig.classList.toggle("is-on", !!key);
      parts.forEach(function (el) {
        el.classList.toggle("on", !!key && el.getAttribute("data-arc") === key);
      });
      note.textContent = key && TEXT[key] ? TEXT[key] : REST;
    }

    parts.forEach(function (el) {
      var key = el.getAttribute("data-arc");
      if (!key) return;
      el.addEventListener("mouseenter", function () { set(key); });
      el.addEventListener("focus", function () { set(key); });
      el.addEventListener("mouseleave", function () { set(null); });
      el.addEventListener("blur", function () { set(null); });
      if (el.tagName.toLowerCase() === "button") {
        el.addEventListener("click", function () { set(key); });
      }
    });
    fig.addEventListener("mouseleave", function () { set(null); });
  })();

  /* ---- first steps guide -------------------------------------------------
     Maps what a parent describes onto the services this centre actually
     offers. It is deliberately NOT a screener: nothing is scored, no risk
     band is produced, and no conclusion about the child is drawn. Writing a
     scoring instrument would mean inventing clinical content, and a wrong
     result given to a frightened parent does real harm.

     Everything runs in the browser. Nothing is stored and nothing is sent —
     which is also what the project's data rule requires: no clinical data
     is collected by this site. */
  (function firstSteps() {
    const formEl = /** @type {HTMLFormElement|null} */ (document.getElementById("firstSteps"));
    const outEl = document.getElementById("stepsResult");
    const bodyEl = document.getElementById("stepsBody");
    if (!formEl || !outEl || !bodyEl) return;
    /* Re-bound so the null check carries into the hoisted handlers below. */
    const form = formEl, out = outEl, body = bodyEl;

    /** What each concern usually points to, in this centre's own services. */
    /** @type {Object<string,{h:string,p:string,href:string}>} */
    var MAP = {
      comm: {
        h: "Speech and language therapy",
        p: "Understanding and using language — spoken, gestural, or through a communication aid. Communication is not only speech, and a child who cannot yet speak is not a child without something to say.",
        href: "therapy.html"
      },
      behav: {
        h: "Applied Behavior Analysis (ABA)",
        p: "We begin with a functional behavior assessment (FBA) to understand what a behaviour achieves for your child, then build a behavior intervention plan (BIP) around it. You are taught the strategies too.",
        href: "therapy.html"
      },
      social: {
        h: "ABA, alongside speech and language therapy",
        p: "Play and social interaction usually sit across both. Goals are chosen for real settings — home, school, the park — rather than for the therapy room.",
        href: "therapy.html"
      },
      daily: {
        h: "Occupational therapy",
        p: "The practical skills a day is made of — dressing, feeding, handwriting — and sensory processing, where ordinary input can feel overwhelming or insufficient.",
        href: "therapy.html"
      },
      move: {
        h: "Physiotherapy",
        p: "Movement, strength, balance and posture, worked on in ways that fit into ordinary life rather than staying in the treatment room.",
        href: "therapy.html"
      },
      school: {
        h: "Educational support and the inclusive school",
        p: "An individualised education plan (IEP), classroom support, and — where it is the right fit — a place at the school, with therapy inside the school day.",
        href: "school.html"
      },
      adult: {
        h: "Psychological therapy for adults",
        p: "Individual therapy with a clinical psychologist — CBT, REBT or psychodynamic, depending on what fits. Clinical psychology does not stop at eighteen, and almost every service in the country does.",
        href: "therapy.html#adults"
      },
      carer: {
        h: "Counselling for parents and carers",
        p: "Support for you, not about the person you care for. Caregiver stress is one of the things that decides whether therapy carries into real life — which is the founder's own research finding.",
        href: "therapy.html#adults"
      },
      unsure: {
        h: "Start with an assessment",
        p: "Not being able to name it is a common and entirely reasonable place to begin. An assessment exists precisely to answer that question, and you do not need a diagnosis or a referral first.",
        href: "therapy.html"
      }
    };

    /** @type {Object<string,string>} */
    var AGE_NOTE = {
      under2: "Under 2 is early, and early is good. Development moves quickly at this age, so a short review now is usually worth more than a long wait.",
      "2to5": "This is the age range where therapy and an inclusive school place most often run alongside each other.",
      "6to12": "At school age, the useful question is usually how support carries into the classroom, not just what happens in session.",
      teen: "Adolescence changes the goals — independence, daily routines and preparing for what comes after school.",
      adult: "Adult services are part of what we do. Most services in the country stop at eighteen; ours do not."
    };

    /** @param {string} tag @param {string|null} [cls] @param {string} [text] */
    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text) n.textContent = text;
      return n;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const age = /** @type {HTMLInputElement|null} */ (form.querySelector('input[name="age"]:checked'));
      var picked = all('input[name="concern"]:checked', form).map(function (i) {
        return /** @type {HTMLInputElement} */ (/** @type {unknown} */ (i)).value;
      });

      body.innerHTML = "";

      if (!age && !picked.length) {
        body.appendChild(el("p", null,
          "Choose an age or tick at least one thing you are noticing, and this will fill in."));
        out.hidden = false;
        out.focus();
        return;
      }

      if (age && AGE_NOTE[age.value]) {
        body.appendChild(el("p", "lede", AGE_NOTE[age.value]));
      }

      // "Not sure" on its own points at assessment; alongside anything else it
      // adds nothing, so it is dropped rather than repeated.
      if (picked.length > 1) {
        picked = picked.filter(function (k) { return k !== "unsure"; });
      }
      if (!picked.length) picked = ["unsure"];

      /** @type {Object<string, boolean>} */
      var seen = {};
      var list = el("div", "result__list");
      picked.forEach(function (k) {
        var m = MAP[k];
        if (!m || seen[m.h]) return;
        seen[m.h] = true;
        var card = el("div", "result__item");
        card.appendChild(el("h3", null, m.h));
        card.appendChild(el("p", null, m.p));
        var a = el("a", "more", "Read more");
        a.setAttribute("href", m.href);
        card.appendChild(a);
        list.appendChild(card);
      });
      body.appendChild(list);

      var next = el("p", "mt3");
      next.textContent = "Whichever of these applies, the path is the same: a conversation " +
        "that costs nothing, then a structured assessment, then a written plan in plain " +
        "language. If cost is the obstacle, say so at the first conversation rather than " +
        "the last — a number of places are funded rather than charged for.";
      body.appendChild(next);

      out.hidden = false;
      out.focus();
    });

    form.addEventListener("reset", function () {
      out.hidden = true;
      body.innerHTML = "";
    });
  })();

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
    const chips = all(".reach__name");
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
