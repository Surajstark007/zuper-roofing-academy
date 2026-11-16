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

  function wireLogin() {
    var g = $("gBtn"), f = $("mailForm"), redirect = location.origin + location.pathname;
    g.hidden = !(C.AUTH && C.AUTH.google);
    f.hidden = !(C.AUTH && C.AUTH.emailLink);
    g.onclick = async function () {
      msg("");
      var opts = { redirectTo: redirect };
      if (domains.length === 1) opts.queryParams = { hd: domains[0] };
      var res = await SB.auth.signInWithOAuth({ provider: "google", options: opts });
      if (res.error) msg(res.error.message, "err");
    };
    f.onsubmit = async function (e) {
      e.preventDefault();
      var email = $("mailIn").value.trim();
      if (!domainOk(email)) { msg("Use your " + domains.join(" or ") + " email address.", "err"); return; }
      var b = f.querySelector("button"); b.disabled = true;
      var res = await SB.auth.signInWithOtp({ email: email, options: { emailRedirectTo: redirect, shouldCreateUser: true } });
      b.disabled = false;
      if (res.error) msg(res.error.message, "err");
      else msg("Check your inbox for a sign-in link, and open it in this same browser.", "ok");
    };
  }

  async function boot() {
    brand();
    if (!configured || !window.supabase) {
      showLogin(); $("gBtn").hidden = true; $("mailForm").hidden = true;
      msg("This copy isn’t connected yet. Add your Supabase project URL and anon key to config.js.", "err");
      return;
    }
    SB = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, {
      auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true, autoRefreshToken: true }
    });
    var params = new URLSearchParams(location.search);
    var urlError = params.get("error_description");
    var got = await SB.auth.getSession();
    var session = got.data && got.data.session;
    if (params.has("code") || urlError) history.replaceState(null, "", location.pathname + location.hash);
    if (!session) { showLogin(); wireLogin(); if (urlError) msg(urlError, "err"); return; }
    if (!domainOk(session.user.email)) {
      await SB.auth.signOut(); showLogin(); wireLogin();
      msg("Sign in with your " + domains.join(" or ") + " account.", "err"); return;
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
