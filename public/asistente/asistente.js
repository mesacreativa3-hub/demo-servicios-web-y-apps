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

  // Icono del asistente (robot, 72×72 webp)
  var ROBOT_CERRADO = "data:image/webp;base64,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";
  var ROBOT = "data:image/webp;base64,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";

  var css = "" +
    ".mca-btn{position:fixed;left:18px;bottom:18px;z-index:85;display:flex;align-items:center;gap:8px;border:1px solid rgba(201,162,39,.55);border-radius:999px;padding:12px 18px 12px 14px;background:rgba(15,13,10,.92);color:#f7f3ec;font:600 .9rem/1 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;cursor:pointer;box-shadow:0 14px 34px -10px rgba(0,0,0,.8);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}" +
    ".mca-btn:hover{border-color:#c9a227}.mca-btn .mca-ico{position:relative;flex:none;width:30px;height:30px;margin:-6px 0 -6px -2px}.mca-btn .mca-ico img{width:100%;height:100%;display:block}.mca-btn .mca-ico .mca-parpado{position:absolute;inset:0;opacity:0;animation:mca-parpadeo 4.6s infinite}@keyframes mca-parpadeo{0%,90%,95%,97%,100%{opacity:0}91.5%,93.5%,98.5%{opacity:1}}@media(prefers-reduced-motion:reduce){.mca-btn .mca-ico .mca-parpado{animation:none}}.mca-btn .mca-dot{position:absolute;right:-1px;bottom:1px;width:8px;height:8px;border-radius:50%;background:#86e0a0;box-shadow:0 0 0 2px #0f0d0a}" +
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
  var ico = el("span", "mca-ico"), robot = new Image(30, 30);
  robot.src = ROBOT; robot.alt = ""; robot.decoding = "async";
  var parpado = new Image(30, 30);
  parpado.src = ROBOT_CERRADO; parpado.alt = ""; parpado.className = "mca-parpado"; parpado.decoding = "async";
  ico.appendChild(robot); ico.appendChild(parpado); ico.appendChild(el("span", "mca-dot"));
  btn.appendChild(ico);
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
