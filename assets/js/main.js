/* The Castle Star — site interactions (no dependencies) */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- header state + mobile menu ---- */
  var header = $(".site-header");
  var hero = $(".hero");
  var onScroll = function () {
    header.classList.toggle("scrolled", window.scrollY > 40);
    if (hero) document.body.classList.toggle("past-hero", window.scrollY > hero.offsetHeight - 120);
    if (hero && window.scrollY < hero.offsetHeight * 0.6) $$("#nav a.active").forEach(function (a) { a.classList.remove("active"); });
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var toggle = $(".menu-toggle"), nav = $("#nav");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
      header.classList.add("scrolled");
    });
    $$("#nav a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); onScroll(); });
    });
  }

  /* ---- room tabs ---- */
  $$(".room-tabs [role=tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      $$(".room-tabs [role=tab]").forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on);
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
    });
  });

  /* ---- room galleries: dots + gentle autoplay on hover ---- */
  $$(".room-gallery").forEach(function (g) {
    var imgs = $$("img", g);
    if (imgs.length < 2) return;
    var i = 0, timer = null;
    var dots = document.createElement("div");
    dots.className = "dots";
    imgs.forEach(function (_, n) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Photo " + (n + 1));
      if (n === 0) b.className = "on";
      b.addEventListener("click", function (e) { e.stopPropagation(); show(n); });
      dots.appendChild(b);
    });
    g.appendChild(dots);
    function show(n) {
      i = (n + imgs.length) % imgs.length;
      imgs.forEach(function (im, k) { im.classList.toggle("on", k === i); });
      $$("button", dots).forEach(function (d, k) { d.classList.toggle("on", k === i); });
    }
    g.addEventListener("mouseenter", function () { timer = setInterval(function () { show(i + 1); }, 1600); });
    g.addEventListener("mouseleave", function () { clearInterval(timer); });
    // swipe on touch
    var x0 = null;
    g.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    g.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1) * (document.dir === "rtl" ? -1 : 1));
      x0 = null;
    });
  });

  /* ---- day / night view ---- */
  var vb = $("#viewbox");
  if (vb) {
    $$(".toggle button", vb).forEach(function (b) {
      b.addEventListener("click", function () {
        var night = b.dataset.view === "night";
        vb.classList.toggle("night", night);
        $$(".toggle button", vb).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      });
    });
  }

  /* ---- lightbox for mosaic (prev / next / swipe / keyboard) ---- */
  var lb = $("#lightbox");
  if (lb) {
    var lbImg = $("img", lb), lbCap = $("figcaption", lb), figs = $$(".mosaic figure"), cur = 0, opener = null;
    var rtl = document.documentElement.dir === "rtl";
    var show = function (i) {
      cur = (i + figs.length) % figs.length;
      var im = $("img", figs[cur]), cap = $("figcaption", figs[cur]);
      lbImg.src = im.currentSrc && im.currentSrc.indexOf("-800") === -1 ? im.currentSrc : im.src.replace("-800.jpg", ".jpg");
      lbImg.alt = im.alt;
      lbCap.textContent = cap ? cap.textContent : "";
    };
    var open = function (i) { opener = document.activeElement; show(i); lb.classList.add("open"); document.body.style.overflow = "hidden"; $(".lb-close", lb).focus(); };
    var close = function () { lb.classList.remove("open"); document.body.style.overflow = ""; if (opener) opener.focus(); };
    figs.forEach(function (f, i) {
      f.style.cursor = "zoom-in";
      f.tabIndex = 0;
      f.setAttribute("role", "button");
      f.addEventListener("click", function () { open(i); });
      f.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); } });
    });
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", function (e) { e.stopPropagation(); show(cur - 1); });
    $(".lb-next", lb).addEventListener("click", function (e) { e.stopPropagation(); show(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(cur + (rtl ? -1 : 1));
      if (e.key === "ArrowLeft") show(cur + (rtl ? 1 : -1));
    });
    var lx = null;
    lb.addEventListener("touchstart", function (e) { lx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (lx === null) return;
      var dx = e.changedTouches[0].clientX - lx;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1) * (rtl ? -1 : 1));
      lx = null;
    });
  }

  /* ---- active nav link + hide floating button at the booking form ---- */
  if ("IntersectionObserver" in window) {
    var links = {};
    $$('#nav a[href^="#"]:not(.btn)').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.target.id === "book") document.body.classList.toggle("at-book", e.isIntersecting);
        var a = links[e.target.id];
        if (a && e.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("active"); });
          a.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(function (s) { spy.observe(s); });
  }

  /* ---- map: load Google Maps only when asked (faster, more private) ---- */
  var mapBtn = $("#mapLoad"), map = $("#map");
  if (mapBtn && map) {
    mapBtn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = map.dataset.src; f.title = mapBtn.dataset.title || "Map"; f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      map.appendChild(f); map.classList.add("live");
    });
  }

  /* ---- reveal on scroll ---- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- WhatsApp booking form ---- */
  var form = $("#bookForm");
  if (!form) return;
  var T = form.dataset;
  var room = $("#room"), din = $("#in"), dout = $("#out"), guests = $("#guests"),
      nameI = $("#name"), note = $("#note"), sumText = $("#sumText"), sumPrice = $("#sumPrice"), err = $("#err");

  function iso(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  var today = new Date();
  din.min = iso(today);
  dout.min = iso(new Date(today.getTime() + 864e5));

  function nights() {
    if (!din.value || !dout.value) return 0;
    var n = Math.round((new Date(dout.value) - new Date(din.value)) / 864e5);
    return n > 0 ? n : 0;
  }
  var AR = document.documentElement.lang === "ar";
  function fmtDate(v) {
    var d = new Date(v + "T00:00:00");
    return d.toLocaleDateString(AR ? "ar-JO-u-nu-latn" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function nightsLabel(n) {
    if (!AR) return n + " " + (n === 1 ? "night" : "nights");
    if (n === 1) return "ليلة واحدة";
    if (n === 2) return "ليلتان";
    if (n <= 10) return n + " ليالٍ";
    return n + " ليلة";
  }
  function update() {
    var opt = room.options[room.selectedIndex];
    var price = +opt.dataset.price, unit = opt.dataset.unit, g = +guests.value, n = nights();
    if (din.value) {
      var next = new Date(new Date(din.value).getTime() + 864e5);
      dout.min = iso(next);
      if (dout.value && dout.value <= din.value) dout.value = "";
    }
    if (!n) { sumText.textContent = T.tPick; sumPrice.textContent = "—"; return; }
    var qty = unit === "bed" ? g : 1;
    var total = price * qty * n;
    sumText.textContent = T.tEst + " · " + nightsLabel(n) + (unit === "bed" ? " · " + g + " × " + T.tBed : "");
    sumPrice.textContent = "US$" + total + " ≈ " + Math.round(total * 0.709) + (AR ? " دينار" : " JD");
  }
  [room, din, dout, guests].forEach(function (el) { el.addEventListener("change", update); });

  // "Book" buttons on room cards preselect the room
  $$("[data-pick]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.dataset.pick;
      for (var k = 0; k < room.options.length; k++) if (room.options[k].value === v) room.selectedIndex = k;
      update();
      setTimeout(function () { din.focus({ preventScroll: true }); }, 600);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = nights();
    if (!n) { err.textContent = T.tErr; err.classList.add("show"); din.focus(); return; }
    err.classList.remove("show");
    var opt = room.options[room.selectedIndex];
    var lines = [
      T.tHello,
      "",
      "• " + T.tRoom + ": " + opt.value,
      "• " + T.tIn + ": " + fmtDate(din.value),
      "• " + T.tOut + ": " + fmtDate(dout.value) + " (" + nightsLabel(n) + ")",
      "• " + T.tGuests + ": " + guests.value
    ];
    var pk = $("#pickup"); if (pk && pk.checked) lines.push("• " + T.tPickup);
    if (nameI.value.trim()) lines.push("• " + T.tName + ": " + nameI.value.trim());
    if (note.value.trim()) lines.push("• " + T.tNote + ": " + note.value.trim());
    var url = "https://wa.me/" + T.wa + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener");
  });

  var yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();
})();
