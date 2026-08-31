// @ts-check
/* ==========================================================================
   The Project Hope — portal
   Loaded only by portal.html. Everything else on the site works without it.

   AUTHENTICATION
   Magic link, not passwords. The visitor gives an email, Supabase sends a
   one-time link, and the redirect returns tokens in the URL fragment. There
   is no password to guess, reuse or leak, which matters more than usual for
   an audience that will not be running a password manager.

   The access token is kept in sessionStorage, not localStorage: it dies with
   the tab. On a shared or family computer that is the difference between a
   session and a standing invitation.

   WHAT THIS FILE ASSUMES
   supabase/migration-02-portal.sql has been run, and Auth → Email is enabled
   in the Supabase dashboard. Until then sign-in returns an error, which is
   surfaced to the visitor rather than swallowed.
   ========================================================================== */
(function () {
  "use strict";

  var cfg = /** @type {any} */ (window).HOPE_CONFIG || {};
  var URL_BASE = String(cfg.SUPABASE_URL || "").replace(/\/+$/, "");
  var KEY = String(cfg.SUPABASE_ANON_KEY || "");
  var TOKEN_KEY = "hope.portal.token";

  var root = document.querySelector("[data-portal]");
  if (!root) return;
  var panel = /** @type {HTMLElement} */ (root);

  var outView = panel.querySelector("[data-portal-out]");
  var inView = panel.querySelector("[data-portal-in]");
  var form = /** @type {HTMLFormElement|null} */ (panel.querySelector("[data-portal-form]"));
  var body = panel.querySelector("[data-portal-body]");
  var nameEl = panel.querySelector("[data-portal-name]");
  var roleEl = panel.querySelector("[data-portal-role]");
  var signOutBtn = panel.querySelector("[data-portal-out-btn]");
  if (!outView || !inView || !form || !body || !nameEl || !roleEl) return;
  /* Re-bound so the null checks above carry into the handlers below. */
  const signInForm = form;
  const bodyEl = /** @type {HTMLElement} */ (body);
  const nameNode = /** @type {HTMLElement} */ (nameEl);
  const roleNode = /** @type {HTMLElement} */ (roleEl);
  const viewOut = /** @type {HTMLElement} */ (outView);
  const viewIn = /** @type {HTMLElement} */ (inView);

  panel.hidden = false;

  /** @param {string} tag @param {string|null} [cls] @param {string} [text] */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  /** @param {string} s */
  function esc(s) { return String(s == null ? "" : s); }

  /* ---- token ------------------------------------------------------------ */
  function readToken() {
    try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }
  /** @param {string|null} t */
  function writeToken(t) {
    try {
      if (t) sessionStorage.setItem(TOKEN_KEY, t);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* private mode — the session simply will not persist */ }
  }

  /* The magic link comes back as #access_token=…&refresh_token=… . Take the
     token, then strip the fragment so it is not left in history or copied
     into a message when someone shares the URL. */
  function captureFragment() {
    if (!window.location.hash || window.location.hash.indexOf("access_token") < 0) return;
    var q = new URLSearchParams(window.location.hash.slice(1));
    var t = q.get("access_token");
    if (t) writeToken(t);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  /** @param {string} path @returns {Promise<any[]>} */
  function get(path) {
    var t = readToken();
    if (!t) return Promise.reject(new Error("not signed in"));
    return fetch(URL_BASE + "/rest/v1/" + path, {
      headers: {
        apikey: KEY,
        Authorization: "Bearer " + t,
        Accept: "application/json"
      }
    }).then(function (r) {
      if (r.status === 401) { writeToken(null); throw new Error("session expired"); }
      if (!r.ok) throw new Error("request failed");
      return r.json();
    });
  }

  /* ---- sign in ---------------------------------------------------------- */
  signInForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var input = /** @type {HTMLInputElement|null} */ (signInForm.querySelector('input[name="email"]'));
    var statusNode = signInForm.querySelector(".form-status");
    var errEl = signInForm.querySelector(".err");
    if (!input || !statusNode) return;
    const status = statusNode;

    var email = input.value.trim();
    if (errEl) errEl.textContent = "";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
      if (errEl) errEl.textContent = input.getAttribute("data-error") || "Please check that address.";
      input.focus();
      return;
    }
    if (!URL_BASE || !KEY) {
      status.textContent = "The portal is not connected yet. Call or WhatsApp us on " +
        (cfg.FALLBACK_PHONE || "our number") + " and we will send you what you need.";
      return;
    }

    var btn = signInForm.querySelector('button[type="submit"]');
    if (btn) { /** @type {HTMLButtonElement} */ (btn).disabled = true; }
    status.textContent = "Sending…";

    fetch(URL_BASE + "/auth/v1/otp", {
      method: "POST",
      headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        create_user: false,          // portals are created by the centre
        options: { email_redirect_to: window.location.origin + window.location.pathname }
      })
    }).then(function (r) {
      /* Deliberately the same answer whether or not the address is on file.
         Telling a stranger which emails have accounts is a disclosure. */
      if (btn) { /** @type {HTMLButtonElement} */ (btn).disabled = false; }
      if (r.ok) {
        status.textContent = "If that address is on our records, a sign-in link is on its way. " +
          "It expires in an hour. Check spam if it has not arrived in a few minutes.";
        signInForm.reset();
      } else {
        status.textContent = "That did not go through. Call or WhatsApp us on " +
          (cfg.FALLBACK_PHONE || "our number") + " and we will sort it out.";
      }
    }).catch(function () {
      if (btn) { /** @type {HTMLButtonElement} */ (btn).disabled = false; }
      status.textContent = "No connection. Call or WhatsApp us on " +
        (cfg.FALLBACK_PHONE || "our number") + ".";
    });
  });

  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      writeToken(null);
      window.location.reload();
    });
  }

  /* ---- rendering -------------------------------------------------------- */
  /** @param {string} title @param {string} [blurb] */
  function section(title, blurb) {
    var wrap = el("section", "pblock");
    wrap.appendChild(el("h3", null, title));
    if (blurb) wrap.appendChild(el("p", "pblock__blurb", blurb));
    return wrap;
  }
  /** @param {string} text */
  function empty(text) { return el("p", "pblock__empty", text); }

  /** @param {Date} d */
  function when(d) {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  /** @param {HTMLElement} container */
  function renderFamily(container) {
    return Promise.all([
      get("documents?select=*&order=issued_on.desc"),
      get("sessions?select=*&order=starts_at.desc&limit=12"),
      get("fees?select=*&order=due_on.desc")
    ]).then(function (res) {
      var docs = res[0], sessions = res[1], fees = res[2];

      var s1 = section("Plans and reports",
        "Behavior intervention plans, individualised education plans and written reports. These are yours — download them, and bring them to appointments elsewhere.");
      if (!docs.length) s1.appendChild(empty("Nothing here yet. Your first plan appears after assessment."));
      docs.forEach(function (d) {
        var row = el("div", "prow");
        /** @type {Object<string,string>} */
        var LABEL = { bmp: "Behavior intervention plan", iep: "Individualised education plan",
                      report: "Report", invoice: "Invoice", consent: "Consent form", other: "Document" };
        row.appendChild(el("span", "prow__tag", LABEL[d.kind] || "Document"));
        row.appendChild(el("strong", null, esc(d.title)));
        if (d.summary) row.appendChild(el("p", null, esc(d.summary)));
        var meta = [];
        if (d.issued_on) meta.push("Issued " + when(new Date(d.issued_on)));
        if (d.review_due) meta.push("Review due " + when(new Date(d.review_due)));
        if (meta.length) row.appendChild(el("p", "prow__meta", meta.join(" · ")));
        s1.appendChild(row);
      });
      container.appendChild(s1);

      var s2 = section("Sessions",
        "Who your child saw, when, and what was worked on. The note is written for you, not for a file.");
      if (!sessions.length) s2.appendChild(empty("No sessions recorded yet."));
      sessions.forEach(function (v) {
        var row = el("div", "prow");
        row.appendChild(el("span", "prow__tag prow__tag--" + esc(v.status), esc(v.status)));
        var head = when(new Date(v.starts_at));
        if (v.clinician) head += " · " + esc(v.clinician);
        if (v.discipline) head += " · " + esc(v.discipline).toUpperCase();
        row.appendChild(el("strong", null, head));
        if (v.note) row.appendChild(el("p", null, esc(v.note)));
        if (v.home_task) {
          var t = el("p", "prow__task");
          t.appendChild(el("strong", null, "To try at home: "));
          t.appendChild(document.createTextNode(esc(v.home_task)));
          row.appendChild(t);
        }
        s2.appendChild(row);
      });
      container.appendChild(s2);

      var s3 = section("Fees",
        "What is owed, what has been paid, and what is funded rather than charged for.");
      if (!fees.length) s3.appendChild(empty("Nothing outstanding."));
      fees.forEach(function (f) {
        var row = el("div", "prow");
        row.appendChild(el("span", "prow__tag" + (f.funded ? " prow__tag--funded" : ""),
          f.funded ? "Funded place" : (f.paid_on ? "Paid" : "Due")));
        row.appendChild(el("strong", null, esc(f.description) + (f.period ? " — " + esc(f.period) : "")));
        if (!f.funded && f.amount_pkr != null) {
          row.appendChild(el("p", null, "PKR " + Number(f.amount_pkr).toLocaleString("en-GB")));
        }
        if (f.funded) row.appendChild(el("p", null, "Carried by the centre. Nothing to pay."));
        s3.appendChild(row);
      });
      container.appendChild(s3);
    });
  }

  /** @param {HTMLElement} container */
  function renderTrainee(container) {
    return Promise.all([
      get("enrolments?select=*,cohorts(*)"),
      get("materials?select=*&order=sort_order.asc")
    ]).then(function (res) {
      var enrols = res[0], mats = res[1];

      var s1 = section("Your pathway", "Where you are, and what is left.");
      if (!enrols.length) s1.appendChild(empty("You are not enrolled on a cohort yet."));
      enrols.forEach(function (e) {
        var c = e.cohorts || {};
        var row = el("div", "prow");
        row.appendChild(el("span", "prow__tag", String(c.pathway || "").toUpperCase()));
        row.appendChild(el("strong", null, esc(c.name || "Cohort")));
        if (e.hours_required) {
          var pct = Math.min(100, Math.round((e.hours_done / e.hours_required) * 100));
          var bar = el("div", "pbar");
          var fill = el("div", "pbar__fill");
          fill.style.width = pct + "%";
          bar.appendChild(fill);
          row.appendChild(bar);
          row.appendChild(el("p", "prow__meta",
            e.hours_done + " of " + e.hours_required + " hours · " + pct + "%"));
        }
        s1.appendChild(row);
      });
      container.appendChild(s1);

      var s2 = section("Classes and materials",
        "Slides, recordings, readings and quizzes for your cohort. Items appear as they are released.");
      if (!mats.length) s2.appendChild(empty("Nothing released yet."));
      mats.forEach(function (m) {
        var row = el("div", "prow");
        row.appendChild(el("span", "prow__tag", esc(m.kind)));
        if (m.url) {
          var a = el("a", null, esc(m.title));
          a.setAttribute("href", m.url);
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener");
          var st = el("strong");
          st.appendChild(a);
          row.appendChild(st);
        } else {
          row.appendChild(el("strong", null, esc(m.title)));
        }
        s2.appendChild(row);
      });
      container.appendChild(s2);
    });
  }

  /** @param {HTMLElement} container */
  function renderVolunteer(container) {
    return Promise.all([
      get("volunteer_hours?select=*&order=happened_on.desc"),
      get("events?select=*&order=starts_at.asc")
    ]).then(function (res) {
      var hours = res[0], events = res[1];

      var total = hours.reduce(function (n, h) { return n + Number(h.hours || 0); }, 0);
      var s1 = section("Your hours",
        "What you have given, and where. Confirmed hours can be used in a written reference.");
      var tot = el("div", "prow");
      tot.appendChild(el("strong", null, total.toFixed(1) + " hours"));
      tot.appendChild(el("p", "prow__meta", hours.length + " entries"));
      s1.appendChild(tot);
      if (!hours.length) s1.appendChild(empty("No hours logged yet."));
      hours.forEach(function (h) {
        var row = el("div", "prow");
        row.appendChild(el("span", "prow__tag" + (h.confirmed ? "" : " prow__tag--pending"),
          h.confirmed ? "Confirmed" : "Pending"));
        row.appendChild(el("strong", null, when(new Date(h.happened_on)) + " · " + h.hours + "h"));
        row.appendChild(el("p", null, esc(h.activity) + (h.setting ? " — " + esc(h.setting) : "")));
        s1.appendChild(row);
      });
      container.appendChild(s1);

      var s2 = section("What is coming up", "Camps, open days and volunteer sessions.");
      var future = events.filter(function (v) { return new Date(v.starts_at) >= new Date(); });
      if (!future.length) s2.appendChild(empty("Nothing scheduled yet. We will email you."));
      future.forEach(function (v) {
        var row = el("div", "prow");
        row.appendChild(el("span", "prow__tag", when(new Date(v.starts_at))));
        row.appendChild(el("strong", null, esc(v.title)));
        if (v.location) row.appendChild(el("p", "prow__meta", esc(v.location)));
        if (v.detail) row.appendChild(el("p", null, esc(v.detail)));
        if (v.signup_url) {
          var a = el("a", "more", "Sign up");
          a.setAttribute("href", v.signup_url);
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener");
          row.appendChild(a);
        }
        s2.appendChild(row);
      });
      container.appendChild(s2);
    });
  }

  /* ---- boot ------------------------------------------------------------- */
  captureFragment();

  if (!readToken()) return;                 // stays on the signed-out view

  viewOut.hidden = true;
  viewIn.hidden = false;

  get("profiles?select=*&limit=1").then(function (rows) {
    var me = rows[0];
    if (!me) throw new Error("no profile");
    /** @type {Object<string,string>} */
    var ROLE = { family: "Family portal", trainee: "Training portal",
                 volunteer: "Volunteer portal", staff: "Staff" };
    roleNode.textContent = ROLE[me.role] || "Portal";
    nameNode.textContent = me.full_name ? "Welcome back, " + me.full_name : "Welcome back";
    bodyEl.innerHTML = "";

    if (me.role === "trainee") return renderTrainee(bodyEl);
    if (me.role === "volunteer") return renderVolunteer(bodyEl);
    return renderFamily(bodyEl);
  }).catch(function (err) {
    bodyEl.innerHTML = "";
    var msg = String(err && err.message) === "session expired"
      ? "That sign-in link has expired. Ask for a new one."
      : "We could not load your portal just now. Call or WhatsApp us on " +
        (cfg.FALLBACK_PHONE || "our number") + " and we will help.";
    bodyEl.appendChild(el("p", "pblock__empty", msg));
    var again = el("button", "btn btn--ghost", "Back to sign in");
    again.setAttribute("type", "button");
    again.addEventListener("click", function () { writeToken(null); window.location.reload(); });
    bodyEl.appendChild(again);
  });
})();
