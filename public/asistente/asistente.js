/* Asistente con IA de Mesa Creativa — widget de chat para cualquier web.
   Uso:
     <script>window.MC_ASISTENTE = { slug: "demo", nombre: "Casa Araguaney",
       saludo: "¡Hola! …", sugerencias: ["¿Qué horario tienen?"],
       whatsapp: function (texto) { return "https://wa.me/58…?text=" + encodeURIComponent(texto); } };</script>
     <script src="/hoy/config.js"></script>
     <script src="/asistente/asistente.js" defer></script>
   Abre el chat desde cualquier botón con: data-asistente-abrir  (o window.MCAsistente.abrir()).
   Las respuestas las genera la función "asistente" de Supabase; si no hay respuesta, ofrece WhatsApp. */
(function () {
  "use strict";
  var O = window.MC_ASISTENTE || {};
  var C = window.HOY_CONFIG || {};
  var U = (C.url || "").replace(/\/$/, "");
  var K = C.key || "";
  if (!O.slug || !U) return;

  var nombre = O.nombre || "nuestro negocio";
  var SK = "mc_asistente_" + O.slug;
  var historial = [];
  try { historial = JSON.parse(sessionStorage.getItem(SK) || "[]") || []; } catch (e) { historial = []; }
  var ocupado = false;

  var css = "" +
    ".mca-btn{position:fixed;left:18px;bottom:18px;z-index:85;display:flex;align-items:center;gap:8px;border:1px solid rgba(201,162,39,.55);border-radius:999px;padding:12px 18px 12px 14px;background:rgba(15,13,10,.92);color:#f7f3ec;font:600 .9rem/1 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;cursor:pointer;box-shadow:0 14px 34px -10px rgba(0,0,0,.8);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}" +
    ".mca-btn:hover{border-color:#c9a227}.mca-btn .mca-dot{width:9px;height:9px;border-radius:50%;background:#86e0a0;box-shadow:0 0 0 3px rgba(134,224,160,.25)}" +
    ".mca-btn[hidden],.mca-panel[hidden]{display:none!important}" +
    "@media(max-width:899px){.mca-btn{bottom:calc(" + (O.bottomMovil || 18) + "px + env(safe-area-inset-bottom));left:12px;padding:11px 15px 11px 12px;font-size:.84rem}}" +
    ".mca-panel{position:fixed;left:18px;bottom:18px;z-index:120;width:min(380px,calc(100vw - 36px));height:min(560px,calc(100vh - 120px));display:flex;flex-direction:column;background:#14120f;color:#f7f3ec;border:1px solid rgba(201,162,39,.35);border-radius:20px;box-shadow:0 30px 70px -20px rgba(0,0,0,.9);font:15px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;overflow:hidden}" +
    "@media(max-width:600px){.mca-panel{left:0;right:0;bottom:0;width:100%;height:min(82vh,640px);border-radius:20px 20px 0 0;border-bottom:0}}" +
    ".mca-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(247,243,236,.12);background:linear-gradient(120deg,rgba(201,162,39,.16),rgba(184,115,51,.08))}" +
    ".mca-head b{display:block;font-size:.98rem}.mca-head small{color:#c8bfb1;font-size:.76rem}" +
    ".mca-av{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(120deg,#c9a227,#b87333);color:#17140c;font-size:1.05rem;flex:none}" +
    ".mca-x{margin-left:auto;background:none;border:0;color:#f7f3ec;font-size:1.5rem;line-height:1;cursor:pointer;padding:4px 8px;border-radius:8px}.mca-x:hover{background:rgba(247,243,236,.08)}" +
    ".mca-log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}" +
    ".mca-m{max-width:86%;padding:10px 13px;border-radius:16px;white-space:pre-wrap;overflow-wrap:anywhere}" +
    ".mca-a{align-self:flex-start;background:#1f1c16;border:1px solid rgba(247,243,236,.1);border-bottom-left-radius:6px}" +
    ".mca-u{align-self:flex-end;background:linear-gradient(120deg,#c9a227,#b87333);color:#17140c;border-bottom-right-radius:6px;font-weight:500}" +
    ".mca-typing{display:inline-flex;gap:4px}.mca-typing i{width:7px;height:7px;border-radius:50%;background:#c8bfb1;animation:mcaB 1s infinite}.mca-typing i:nth-child(2){animation-delay:.15s}.mca-typing i:nth-child(3){animation-delay:.3s}" +
    "@keyframes mcaB{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}" +
    ".mca-sug{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px}" +
    ".mca-sug button{border:1px solid rgba(201,162,39,.45);background:none;color:#e9d9a6;border-radius:999px;padding:7px 12px;font:inherit;font-size:.8rem;cursor:pointer}.mca-sug button:hover{background:rgba(201,162,39,.12)}" +
    ".mca-wa{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:8px 12px;border-radius:999px;background:#25D366;color:#0b3d24;font-weight:700;font-size:.82rem;text-decoration:none}" +
    ".mca-form{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(247,243,236,.12)}" +
    ".mca-form input{flex:1;min-width:0;font:inherit;font-size:16px;color:#f7f3ec;background:#0e0d0b;border:1px solid rgba(247,243,236,.16);border-radius:999px;padding:11px 15px}" +
    ".mca-form input:focus{outline:2px solid #c9a227;outline-offset:1px}" +
    ".mca-form button{flex:none;border:0;border-radius:999px;padding:0 16px;background:linear-gradient(120deg,#c9a227,#b87333);color:#17140c;font-weight:700;cursor:pointer}.mca-form button:disabled{opacity:.5;cursor:wait}" +
    ".mca-foot{padding:0 14px 10px;color:#8f887b;font-size:.7rem;text-align:center}" +
    "@media(prefers-reduced-motion:reduce){.mca-typing i{animation:none}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  var btn = el("button", "mca-btn");
  btn.type = "button";
  btn.setAttribute("aria-label", "Abrir el asistente con inteligencia artificial");
  btn.appendChild(el("span", "mca-dot"));
  btn.appendChild(document.createTextNode(O.textoBoton || "Pregúntale a la IA"));

  var panel = el("div", "mca-panel");
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Asistente de " + nombre);
  var head = el("div", "mca-head");
  head.appendChild(el("div", "mca-av", "✦"));
  var ht = el("div");
  ht.appendChild(el("b", null, O.titulo || "Asistente de " + nombre));
  ht.appendChild(el("small", null, "Responde al momento · 24/7"));
  head.appendChild(ht);
  var x = el("button", "mca-x", "×");
  x.type = "button";
  x.setAttribute("aria-label", "Cerrar el asistente");
  head.appendChild(x);
  var log = el("div", "mca-log");
  log.setAttribute("aria-live", "polite");
  var sug = el("div", "mca-sug");
  var form = el("form", "mca-form");
  var inp = el("input");
  inp.type = "text";
  inp.maxLength = 500;
  inp.placeholder = "Escribe tu pregunta…";
  inp.setAttribute("aria-label", "Tu pregunta");
  inp.autocomplete = "off";
  var send = el("button", null, "Enviar");
  send.type = "submit";
  form.appendChild(inp);
  form.appendChild(send);
  var foot = el("div", "mca-foot", "Respuestas generadas con IA. Confirma precios y disponibilidad por WhatsApp.");
  panel.appendChild(head);
  panel.appendChild(log);
  panel.appendChild(sug);
  panel.appendChild(form);
  panel.appendChild(foot);

  function waUrl(texto) {
    try { if (typeof O.whatsapp === "function") return O.whatsapp(texto || ""); } catch (e) {}
    return null;
  }
  function burbuja(rol, texto, conWa) {
    var m = el("div", "mca-m " + (rol === "u" ? "mca-u" : "mca-a"), texto);
    if (conWa) {
      var ultima = "";
      for (var i = historial.length - 1; i >= 0; i--) { if (historial[i].rol === "u") { ultima = historial[i].t; break; } }
      var href = waUrl(ultima ? "Tengo una consulta: " + ultima : "Tengo una consulta.");
      if (href) {
        m.appendChild(document.createElement("br"));
        var a = el("a", "mca-wa", "💬 Seguir por WhatsApp");
        a.href = href; a.target = "_blank"; a.rel = "noopener";
        m.appendChild(a);
      }
    }
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }
  function guardar() {
    try { sessionStorage.setItem(SK, JSON.stringify(historial.slice(-12))); } catch (e) {}
  }
  function pintarSugerencias() {
    sug.textContent = "";
    if (historial.length) return;
    (O.sugerencias || []).slice(0, 4).forEach(function (s) {
      var b = el("button", null, s);
      b.type = "button";
      b.addEventListener("click", function () { preguntar(s); });
      sug.appendChild(b);
    });
  }
  function inicio() {
    log.textContent = "";
    burbuja("a", O.saludo || ("¡Hola! Soy el asistente de " + nombre + ". ¿En qué te ayudo?"));
    historial.forEach(function (h) { burbuja(h.rol, h.t); });
    pintarSugerencias();
  }

  var FALLOS = {
    limite: "Hoy ya he respondido muchas preguntas. Escríbenos por WhatsApp y te atendemos enseguida.",
    no_configurado: "El asistente se está activando. Mientras tanto, escríbenos por WhatsApp y te respondemos.",
    defecto: "Ahora mismo no puedo responder. Escríbenos por WhatsApp y te atendemos."
  };

  function preguntar(texto) {
    texto = String(texto || "").trim().slice(0, 500);
    if (!texto || ocupado) return;
    ocupado = true; send.disabled = true;
    var previo = historial.slice(-6);
    historial.push({ rol: "u", t: texto });
    burbuja("u", texto);
    sug.textContent = "";
    var esp = el("div", "mca-m mca-a");
    var ty = el("span", "mca-typing");
    ty.appendChild(el("i")); ty.appendChild(el("i")); ty.appendChild(el("i"));
    esp.appendChild(ty);
    log.appendChild(esp); log.scrollTop = log.scrollHeight;
    var ctrl = "AbortController" in window ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
    fetch(U + "/functions/v1/asistente", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: K },
      body: JSON.stringify({ slug: O.slug, mensaje: texto, historial: previo }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json(); }).then(function (j) {
      esp.remove();
      if (j && j.ok && j.respuesta) {
        historial.push({ rol: "a", t: j.respuesta });
        burbuja("a", j.respuesta, /whatsapp|reserv|pedido|confirm/i.test(j.respuesta));
      } else {
        burbuja("a", FALLOS[j && j.motivo] || FALLOS.defecto, true);
      }
    }).catch(function () {
      esp.remove();
      burbuja("a", FALLOS.defecto, true);
    }).then(function () {
      clearTimeout(t); ocupado = false; send.disabled = false; guardar();
    });
  }

  function abrir() {
    if (!panel.hidden) return;
    panel.hidden = false; btn.hidden = true;
    if (!log.childNodes.length) inicio();
    setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }
  function cerrar() { panel.hidden = true; btn.hidden = false; btn.focus(); }

  btn.addEventListener("click", abrir);
  x.addEventListener("click", cerrar);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) cerrar(); });
  form.addEventListener("submit", function (e) { e.preventDefault(); var v = inp.value; inp.value = ""; preguntar(v); });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-asistente-abrir]");
    if (a) { e.preventDefault(); abrir(); var q = a.getAttribute("data-asistente-abrir"); if (q) preguntar(q); }
  });

  function montar() { document.body.appendChild(btn); document.body.appendChild(panel); }
  if (document.body) montar(); else document.addEventListener("DOMContentLoaded", montar);
  window.MCAsistente = { abrir: abrir, cerrar: cerrar, preguntar: function (q) { abrir(); preguntar(q); } };
})();
