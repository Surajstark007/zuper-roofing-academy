/* Zuper Roofing Academy — Supabase sign-in and data adapter.
   The app talks to a small capability interface (user, db, downloads);
   this file provides it on top of Supabase Auth and the public.progress table. */
(function () {
  "use strict";
  var C = window.ACADEMY_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var SB = null, SESSION = null, ROWS = new Map();

  var configured = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY &&
    !/YOUR-PROJECT/.test(C.SUPABASE_URL) && !/YOUR-ANON-KEY/.test(C.SUPABASE_ANON_KEY));
  var domains = (C.ALLOWED_DOMAINS || []).map(function (d) { return String(d).toLowerCase(); });
  function domainOk(email) {
    if (!domains.length) return true;
    var dom = (String(email || "").split("@")[1] || "").toLowerCase();
    return domains.indexOf(dom) !== -1;
  }
  function msg(text, kind) { var m = $("loginMsg"); m.textContent = text || ""; m.dataset.kind = kind || ""; m.hidden = !text; }
  function showLogin() { document.body.classList.add("gated"); $("bootMsg").hidden = true; $("login").hidden = false; }

  function brand() {
    if (C.LOGO_SRC) {
      document.querySelectorAll(".logo").forEach(function (el) {
        el.textContent = ""; var img = new Image(); img.src = C.LOGO_SRC; img.alt = "Zuper"; el.appendChild(img);
      });
    }
    document.querySelectorAll("a[data-deck]").forEach(function (a) {
      if (C.DECK_URL) { a.href = C.DECK_URL; } else { a.hidden = true; }
    });
  }

  function mapErr(error) {
    var st = error && (error.status || 0), code = error && error.code;
    if (code === "42501" || code === "PGRST301" || st === 401 || st === 403) return { code: "invalid_argument", message: error.message };
    return { code: "unavailable", message: (error && error.message) || "Network error" };
  }
  function meta() { var md = SESSION.user.user_metadata || {}; return { name: md.full_name || md.name || "", avatar: md.avatar_url || md.picture || "" }; }

  function makeUser() {
    var u = SESSION.user, roleP = null;
    function role() { return roleP || (roleP = SB.rpc("staff_role").then(function (r) { return r.error ? null : (r.data || null); }, function () { return null; })); }
    return {
      id: async function () { return u.id; },
      canEdit: async function () { var r = await role(); return r === "admin" || r === "owner"; },
      isOwner: async function () { return (await role()) === "owner"; },
      can: async function () { return true; },
      me: async function () { var r = await role(); var m = meta(); return { id: u.id, name: m.name, email: u.email, avatarUrl: m.avatar, color: "", isOwner: r === "owner", canEdit: r === "admin" || r === "owner" }; },
      profiles: async function (ids) {
        var out = {};
        ids.forEach(function (id) { var r = ROWS.get(id) || {}; out[id] = { id: id, name: r.full_name || (r.email ? r.email.split("@")[0] : ""), email: r.email || null, avatarUrl: r.avatar_url || "" }; });
        return out;
      }
    };
  }

  function makeDb() {
    return {
      doc: function (path) {
        var id = path.split("/")[1];
        return {
          id: id, path: path,
          get: async function () {
            var res = await SB.from("progress").select("data").eq("user_id", id).maybeSingle();
            if (res.error) throw mapErr(res.error);
            var row = res.data;
            return { id: id, exists: !!row, data: function () { return row ? row.data : undefined; }, metadata: { fromCache: false, hasPendingWrites: false } };
          },
          set: async function (body) {
            var m = meta();
            var res = await SB.from("progress").upsert({ user_id: id, full_name: m.name || null, avatar_url: m.avatar || null, data: body }, { onConflict: "user_id" });
            if (res.error) throw mapErr(res.error);
          },
          delete: async function () {
            var res = await SB.from("progress").delete().eq("user_id", id);
            if (res.error) throw mapErr(res.error);
          }
        };
      },
      collection: function () {
        return {
          onSnapshot: function (next, onError) {
            var alive = true, timer = null, first = true;
            async function load() {
              var res = await SB.from("progress").select("user_id,email,full_name,avatar_url,data,updated_at");
              if (!alive) return;
              if (res.error) { if (first && onError) { alive = false; onError(mapErr(res.error)); } return; }
              first = false; ROWS.clear();
              res.data.forEach(function (r) { ROWS.set(r.user_id, r); });
              next({
                docs: res.data.map(function (r) { return { id: r.user_id, exists: true, data: function () { return r.data; }, metadata: { fromCache: false, hasPendingWrites: false } }; }),
                size: res.data.length, empty: !res.data.length, metadata: { fromCache: false, hasPendingWrites: false }
              });
            }
            load();
            var ch = SB.channel("progress-feed-" + Math.random().toString(36).slice(2))
              .on("postgres_changes", { event: "*", schema: "public", table: "progress" }, function () { clearTimeout(timer); timer = setTimeout(load, 800); })
              .subscribe();
            var poll = setInterval(load, 60000);
            return function () { alive = false; clearInterval(poll); clearTimeout(timer); try { SB.removeChannel(ch); } catch (e) {} };
          }
        };
      }
    };
  }

  /* Sign-in log (public.sign_ins). Written by a database trigger on every new
     session; readable by staff only. Returns the newest rows first. */
  function makeSignins() {
    return {
      list: async function (limit) {
        var res = await SB.from("sign_ins").select("id,user_id,email,signed_in_at,user_agent,ip")
          .order("signed_in_at", { ascending: false }).limit(limit || 1000);
        if (res.error) throw mapErr(res.error);
        return res.data || [];
      }
    };
  }

  function makeDownloads() {
    return {
      save: async function (req) {
        var data = typeof req.data === "string" ? "\ufeff" + req.data : req.data;
        var blob = data instanceof Blob ? data : new Blob([data], { type: "text/csv;charset=utf-8" });
        var url = URL.createObjectURL(blob), a = document.createElement("a");
        a.href = url; a.download = req.filename; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        return { status: "saved" };
      }
    };
  }

  /* A message with an action button, e.g. "Resend confirmation email". */
  function msgAction(text, kind, label, fn) {
    msg(text, kind);
    var b = document.createElement("button"); b.type = "button"; b.className = "linkbtn"; b.textContent = label;
    b.onclick = fn; $("loginMsg").appendChild(document.createTextNode(" ")); $("loginMsg").appendChild(b);
  }

  var MIN_PW = 8;
  var redirect = location.origin + location.pathname;

  /* Turn Supabase's error text into plain guidance. */
  function friendly(err) {
    var m = String((err && err.message) || "").toLowerCase();
    if (/rate limit|too many|security purposes/.test(m)) return "Too many attempts or emails in a short time. Wait a few minutes and try again.";
    if (/invalid login credentials/.test(m)) return "That email and password don’t match. Try again, or use “Forgot password?”.";
    if (/password should be|password is too short|weak password/.test(m)) return "Choose a password with at least " + MIN_PW + " characters.";
    if (/same.*password|different from the old/.test(m)) return "Choose a password that’s different from your current one.";
    if (/network|fetch/.test(m)) return "Couldn’t reach the sign-in service. Check your connection and try again.";
    return (err && err.message) || "Something went wrong. Try again.";
  }

  /* Sign-in card modes: signin, signup, forgot, reset (set a new password after a reset link). */
  var MODES = {
    signin: { h: "Sign in to start learning", lede: "Use your work email and password. Your progress and scores are saved to your profile so your lead can follow along.", btn: "Sign in", pass: true, pass2: false, email: true },
    signup: { h: "Create your account", lede: "Use your work email and choose a password. We’ll email you a link to confirm the address once; after that you sign in with your email and password.", btn: "Create account", pass: true, pass2: true, email: true },
    forgot: { h: "Reset your password", lede: "Enter your work email and we’ll send you a link to choose a new password. Signed in before with an email link? Use this to set a password for the first time.", btn: "Email me a reset link", pass: false, pass2: false, email: true },
    reset:  { h: "Choose a new password", lede: "Enter a new password for your account. You’ll use it with your work email from now on.", btn: "Save password and continue", pass: true, pass2: true, email: false }
  };
  var mode = "signin";
  function setMode(m, keepMsg) {
    mode = m; var M = MODES[m];
    $("loginH").textContent = M.h;
    document.querySelector("#login .lede").textContent = M.lede;
    $("pwEmailF").hidden = !M.email;
    $("pwPassF").hidden = !M.pass;
    $("pwPass2F").hidden = !M.pass2;
    $("pwHint").hidden = !M.pass2;
    $("pwPassL").textContent = m === "reset" ? "New password" : "Password";
    $("pwPass").autocomplete = M.pass2 ? "new-password" : "current-password";
    $("pwPass").value = ""; $("pwPass2").value = "";
    $("pwSubmit").textContent = M.btn;
    $("pwForgot").hidden = m !== "signin";
    $("pwSwitch").hidden = m === "reset";
    $("pwSwitch").textContent = m === "signin" ? "New here? Create an account" : "Back to sign in";
    if (!keepMsg) msg("");
  }

  async function resendConfirm(email) {
    var res = await SB.auth.resend({ type: "signup", email: email, options: { emailRedirectTo: redirect } });
    if (res.error) msg(friendly(res.error), "err");
    else msg("Confirmation email sent to " + email + ". Open the link in this browser.", "ok");
  }

  function wireLogin(startMode) {
    var g = $("gBtn"), f = $("pwForm");
    g.hidden = !(C.AUTH && C.AUTH.google);
    f.hidden = !(C.AUTH && C.AUTH.password);
    g.onclick = async function () {
      msg("");
      var opts = { redirectTo: redirect };
      if (domains.length === 1) opts.queryParams = { hd: domains[0] };
      var res = await SB.auth.signInWithOAuth({ provider: "google", options: opts });
      if (res.error) msg(friendly(res.error), "err");
    };
    $("pwSwitch").onclick = function () { setMode(mode === "signin" ? "signup" : "signin"); };
    $("pwForgot").onclick = function () { setMode("forgot"); };
    setMode(startMode || "signin", true);

    f.onsubmit = async function (e) {
      e.preventDefault();
      var email = $("pwEmail").value.trim(), pw = $("pwPass").value, pw2 = $("pwPass2").value;
      var M = MODES[mode];
      if (M.email) {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg("Enter your work email address.", "err"); $("pwEmail").focus(); return; }
        if (!domainOk(email)) { msg("Use your " + domains.map(function (d) { return "@" + d; }).join(" or ") + " email address.", "err"); $("pwEmail").focus(); return; }
      }
      if (M.pass && !pw) { msg("Enter your password.", "err"); $("pwPass").focus(); return; }
      if (M.pass2) {
        if (pw.length < MIN_PW) { msg("Choose a password with at least " + MIN_PW + " characters.", "err"); $("pwPass").focus(); return; }
        if (pw !== pw2) { msg("The two passwords don’t match.", "err"); $("pwPass2").focus(); return; }
      }
      var b = $("pwSubmit"); b.disabled = true; msg("");
      try {
        var res;
        if (mode === "signin") {
          res = await SB.auth.signInWithPassword({ email: email, password: pw });
          if (res.error) {
            if (/not confirmed/i.test(res.error.message || "")) msgAction("Confirm your email first: open the link we sent to " + email + ".", "err", "Resend confirmation email", function () { resendConfirm(email); });
            else msg(friendly(res.error), "err");
            return;
          }
          location.reload(); return;
        }
        if (mode === "signup") {
          res = await SB.auth.signUp({ email: email, password: pw, options: { emailRedirectTo: redirect } });
          if (res.error) {
            if (/already registered|already exists/i.test(res.error.message || "")) { setMode("signin", true); $("pwEmail").value = email; msg("You already have an account. Sign in, or use “Forgot password?”.", "err"); }
            else msg(friendly(res.error), "err");
            return;
          }
          if (res.data && res.data.session) { location.reload(); return; }
          var u = res.data && res.data.user;
          if (u && Array.isArray(u.identities) && u.identities.length === 0) { setMode("signin", true); $("pwEmail").value = email; msg("You already have an account. Sign in, or use “Forgot password?”.", "err"); return; }
          setMode("signin", true); $("pwEmail").value = email;
          msgAction("Almost done: we’ve emailed a confirmation link to " + email + ". Open it in this browser and you’ll be signed in. Next time, sign in here with your email and password.", "ok", "Resend email", function () { resendConfirm(email); });
          return;
        }
        if (mode === "forgot") {
          res = await SB.auth.resetPasswordForEmail(email, { redirectTo: redirect + "?reset=1" });
          if (res.error) { msg(friendly(res.error), "err"); return; }
          msg("If there’s an account for " + email + ", we’ve emailed a link to choose a new password. Open it in this browser.", "ok");
          return;
        }
        if (mode === "reset") {
          res = await SB.auth.updateUser({ password: pw });
          if (res.error) { msg(friendly(res.error), "err"); return; }
          location.replace(location.pathname + location.hash); return;
        }
      } catch (err) {
        msg(friendly(err), "err");
      } finally {
        b.disabled = false;
      }
    };
  }

  async function boot() {
    brand();
    if (!configured || !window.supabase) {
      showLogin(); $("gBtn").hidden = true; $("pwForm").hidden = true;
      msg("This copy isn’t connected yet. Add your Supabase project URL and anon key to config.js.", "err");
      return;
    }
    SB = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, {
      auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true, autoRefreshToken: true }
    });
    var params = new URLSearchParams(location.search);
    var urlError = params.get("error_description");
    var hadCode = params.has("code"), isReset = params.get("reset") === "1";
    var got = await SB.auth.getSession();
    var session = got.data && got.data.session;
    if (hadCode || urlError || isReset) history.replaceState(null, "", location.pathname + location.hash);
    if (!session) {
      showLogin(); wireLogin(isReset ? "forgot" : "signin");
      if (urlError || hadCode) msg(isReset
        ? "That reset link has expired or was opened in a different browser. Request a new one below."
        : "That link has expired or was opened in a different browser. If you just confirmed your email, sign in with your email and password.", "err");
      return;
    }
    if (!domainOk(session.user.email)) {
      await SB.auth.signOut(); showLogin(); wireLogin();
      msg("Sign in with your " + domains.map(function (d) { return "@" + d; }).join(" or ") + " email address.", "err"); return;
    }
    if (isReset) {
      /* Arrived from a password-reset email: ask for the new password before opening the Academy. */
      showLogin(); wireLogin("reset"); return;
    }
    SESSION = session;
    var caps = { user: makeUser(), db: makeDb(), downloads: makeDownloads(), signins: makeSignins() };
    window.claude = { use: async function (name) { return caps[name] || null; } };
    document.body.classList.remove("gated"); $("login").hidden = true; $("bootMsg").hidden = true;
    $("whoami").textContent = session.user.email;
    var so = $("signOut"); so.hidden = false; so.onclick = async function () { await SB.auth.signOut(); location.reload(); };
    SB.auth.onAuthStateChange(function (event) { if (event === "SIGNED_OUT") location.reload(); });
    window.startAcademy();
  }

  boot().catch(function (e) { showLogin(); msg("Something went wrong while signing in. Refresh to try again.", "err"); if (window.console) console.error(e); });
})();
