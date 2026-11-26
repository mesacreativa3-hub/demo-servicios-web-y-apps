/* Código común de los paneles de Mesa Creativa (pedidos, asistente, resumen).
   Cada página tiene: #v-login (form #login, #em, #pw, #b-login, #m-login), #v-panel, #b-out,
   #sel-box/#sel (selector de negocio) y llama a Panel.iniciar({alCargar: function(neg){…}}). */
(function () {
  "use strict";
  var C = window.HOY_CONFIG || {}, U = (C.url || "").replace(/\/$/, ""), K = C.key || "";
  var SK = "catalogo_admin_session";
  var $ = function (i) { return document.getElementById(i); };
  var P = { U: U, K: K, $: $, negocios: [], neg: null };

  function getS() { try { return JSON.parse(localStorage.getItem(SK) || "null"); } catch (e) { return null; } }
  function setS(s) { try { if (s) localStorage.setItem(SK, JSON.stringify(s)); else localStorage.removeItem(SK); } catch (e) {} }
  P.msg = function (id, t, cls) { var m = $(id); if (!m) return; m.textContent = t || ""; m.className = "msg" + (cls ? " " + cls : ""); };
  P.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  function api(path, opt, tok) { opt = opt || {}; opt.headers = Object.assign({ apikey: K }, opt.headers || {}); if (tok) opt.headers.Authorization = "Bearer " + tok; return fetch(U + path, opt); }
  function saveSession(j) { var s = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (j.expires_in || 3600) }; setS(s); return s; }
  P.token = async function () {
    var s = getS(); if (!s) throw new Error("login");
    if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    var r = await api("/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: s.refresh_token }) });
    if (!r.ok) { setS(null); throw new Error("login"); }
    return saveSession(await r.json()).access_token;
  };
  P.call = async function (path, opt) {
    var tok = await P.token(), r = await api(path, opt, tok);
    if (r.status === 401) throw new Error("login");
    if (!r.ok) { var j = null; try { j = await r.json(); } catch (e) {} throw new Error((j && j.message && !/violates|constraint|syntax/.test(j.message)) ? j.message : "No se pudo completar. Revisa tu conexión e inténtalo de nuevo."); }
    if (r.status === 204) return null;
    var t = await r.text(); return t ? JSON.parse(t) : null;
  };
  P.rpc = function (fn, args) { return P.call("/rest/v1/rpc/" + fn, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args || {}) }); };
  function view(v) { $("v-login").hidden = v !== "login"; $("v-panel").hidden = v !== "panel"; }
  P.fail = function (e, box) {
    if (e.message === "login") { view("login"); P.msg("m-login", "Tu sesión venció. Vuelve a entrar.", "err"); }
    else P.msg(box || "m-panel", e.message, "err");
  };
  P.hoyISO = function () { var d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000); return d.toISOString().slice(0, 10); };
  P.money = function (n) { return "$" + Number(n || 0).toFixed(2); };
  P.telWa = function (t) {
    var d = String(t || "").replace(/[^0-9+]/g, "");
    if (d.charAt(0) === "+") return d.slice(1);
    d = d.replace(/\D/g, "");
    if (d.length === 11 && d.charAt(0) === "0") return "58" + d.slice(1);
    if (d.length === 10 && d.charAt(0) === "4") return "58" + d;
    return d;
  };
  P.wa = function (tel, texto) { return "https://wa.me/" + P.telWa(tel) + "?text=" + encodeURIComponent(texto); };

  async function cargarNegocios(opts) {
    var a = await P.call("/rest/v1/negocio_usuarios?select=negocios(id,slug,nombre,web,info,asistente)", { cache: "no-store" });
    P.negocios = (a || []).map(function (x) { return x.negocios; }).filter(Boolean)
      .filter(function (n) { return !opts.excluir || opts.excluir.indexOf(n.slug) < 0; })
      .sort(function (x, y) { return (x.slug === "mesa-creativa") - (y.slug === "mesa-creativa"); });
    if (!P.negocios.length) throw new Error("Tu usuario todavía no tiene un negocio asignado. Escríbele a Mesa Creativa.");
    $("sel").innerHTML = P.negocios.map(function (n, i) { return '<option value="' + i + '">' + P.esc(n.nombre) + "</option>"; }).join("");
    $("sel-box").hidden = P.negocios.length < 2;
    P.neg = P.negocios[0];
  }

  P.iniciar = function (opts) {
    async function show() {
      view("panel"); P.msg("m-panel", "Cargando…");
      try { await cargarNegocios(opts); await opts.alCargar(P.neg); P.msg("m-panel", ""); } catch (err) { P.fail(err); }
    }
    $("sel").addEventListener("change", function () { P.neg = P.negocios[+this.value]; opts.alCargar(P.neg).catch(P.fail); });
    $("login").addEventListener("submit", async function (e) {
      e.preventDefault(); $("b-login").disabled = true; P.msg("m-login", "Entrando…");
      try {
        var r = await api("/auth/v1/token?grant_type=password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: $("em").value.trim(), password: $("pw").value }) });
        if (!r.ok) { P.msg("m-login", "Correo o contraseña incorrectos.", "err"); return; }
        saveSession(await r.json()); P.msg("m-login", ""); $("pw").value = ""; show();
      } catch (err) { P.msg("m-login", "No hay conexión. Inténtalo de nuevo.", "err"); }
      finally { $("b-login").disabled = false; }
    });
    $("b-out").addEventListener("click", function () { setS(null); view("login"); });
    if (!U || !K) { view("login"); P.msg("m-login", "Falta configurar la conexión (archivo hoy/config.js).", "err"); $("b-login").disabled = true; }
    else if (getS()) show(); else view("login");
  };
  window.Panel = P;
})();
