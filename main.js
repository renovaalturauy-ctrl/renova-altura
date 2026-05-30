(function () {
  "use strict";

  /* ── Helpers ── */
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[RENOVA:" + name + "]", e); }
  }

  /* ──────────────────────────────────────────
     INTRO CINEMATICO — Window Cleaner Reveal
  ────────────────────────────────────────── */
  function initIntro() {
    var intro     = document.getElementById("intro");
    var glass     = document.getElementById("intro-glass");
    var rope      = document.getElementById("intro-rope");
    var char_     = document.getElementById("intro-char");
    var squeegee  = document.getElementById("intro-squeegee");
    var sqDrips   = document.getElementById("intro-sq-drips");
    var introLogo = document.getElementById("intro-logo");
    var bubblesEl = document.getElementById("intro-bubbles");

    if (!intro) return;

    // Intro siempre visible en cada visita/recarga

    // Fallback sin GSAP
    if (typeof gsap === "undefined") {
      intro.style.display = "none";
      return;
    }


    document.body.style.overflow = "hidden";

    var W = window.innerWidth;
    var H = window.innerHeight;
    // climber top = -200px; rope crece hasta que el personaje quede ~50vh
    var ropeTarget = Math.min(H * 0.75 + 200, 950); // personaje baja al 75% de pantalla, bajo el logo

    /* ── Burbujas ─────────────────────────────── */
    function spawnBubble(x, y) {
      var b = document.createElement("div");
      b.className = "bubble";
      var size  = 7 + Math.random() * 26;
      var rise  = -(55 + Math.random() * 90);
      var dur   = 0.75 + Math.random() * 1.0;
      var delay = Math.random() * 0.25;
      b.style.cssText = [
        "width:"   + size  + "px",
        "height:"  + size  + "px",
        "left:"    + (x - size / 2 + (Math.random() - 0.5) * 80) + "px",
        "top:"     + (y + (Math.random() - 0.5) * 25) + "px",
        "--dur:"   + dur   + "s",
        "--delay:" + delay + "s",
        "--rise:"  + rise  + "px"
      ].join(";");
      bubblesEl.appendChild(b);
      setTimeout(function () {
        if (b.parentNode) b.parentNode.removeChild(b);
      }, (dur + delay + 0.4) * 1000);
    }

    function spawnCluster(x, y, n) {
      for (var i = 0; i < n; i++) spawnBubble(x, y);
    }

    function spawnRowBubbles(sqY) {
      var n = 5 + Math.floor(Math.random() * 7);
      for (var i = 0; i < n; i++) {
        spawnBubble(Math.random() * W, sqY + Math.random() * 15);
      }
    }

    function refreshDrips() {
      sqDrips.innerHTML = "";
      var n = 5 + Math.floor(Math.random() * 9);
      for (var i = 0; i < n; i++) {
        var d = document.createElement("div");
        d.className = "sq-drip";
        d.style.left = (4 + Math.random() * 92) + "%";
        d.style.setProperty("--sq-delay", (Math.random() * 0.45) + "s");
        sqDrips.appendChild(d);
      }
    }

    /* ── Fin ──────────────────────────────────── */
    function finishIntro() {
      document.body.style.overflow = "";
      intro.style.display = "none";
      // (sin sessionStorage: se muestra en cada recarga)
    }

    /* ── Timeline ─────────────────────────────── */
    var tl = gsap.timeline({ onComplete: finishIntro });

    // Fase 1 — cuerda crece, personaje baja (2 s)
    tl.to(rope, {
      height: ropeTarget,
      duration: 2.0,
      ease: "power2.out",
      onUpdate: function () {
        var h     = parseFloat(gsap.getProperty(rope, "height")) || 0;
        var charY = h - 200 + 65; // centro del personaje en pantalla
        if (charY > 0 && Math.random() < 0.06) {
          spawnCluster(W / 2, charY, 2 + Math.floor(Math.random() * 3));
        }
      }
    }, 0.25);

    // Pausa "limpiando"
    tl.to({}, { duration: 0.4 });

    // Fase 2 — lampazo barre la pantalla (1.75 s)
    tl.call(function () {
      refreshDrips();
      gsap.set(squeegee, { y: 0, opacity: 1 });
    });

    tl.to(squeegee, {
      y: H + 120,
      duration: 1.75,
      ease: "power2.inOut",
      onUpdate: function () {
        var y        = parseFloat(gsap.getProperty(squeegee, "y")) || 0;
        // filo visual: CSS top(-82) + translateY + agua(56)
        var bladeTop = -82 + y + 56;
        var pct      = Math.max(0, Math.min(100, (bladeTop / H) * 100));
        glass.style.clipPath = "inset(" + pct.toFixed(2) + "% 0 0 0)";
        if (bladeTop > 0 && bladeTop < H && Math.random() < 0.13) {
          spawnRowBubbles(bladeTop - 4);
        }
        if (Math.random() < 0.04) refreshDrips();
      }
    });

    // Logo se desvanece a mitad del barrido
    tl.to(introLogo, { opacity: 0, duration: 0.55, ease: "power2.in" }, "-=1.35");
    // Personaje y cuerda desaparecen con el lampazo
    tl.to([char_, rope], { opacity: 0, duration: 0.35, ease: "power2.in" }, "-=1.25");

    /* ── Skip ─────────────────────────────────── */
    function skipIntro() { tl.progress(1); }
    intro.addEventListener("click",      skipIntro, { once: true });
    intro.addEventListener("touchstart", skipIntro, { once: true, passive: true });
  }

  /* ──────────────────────────────────────────
     CURSOR (desktop only)
  ────────────────────────────────────────── */
  function initCursor() {
    if (!fineHover) return;
    var cursor = $(".cursor");
    if (!cursor) return;
    var dot  = $(".cursor-dot",  cursor);
    var ring = $(".cursor-ring", cursor);
    if (!dot || !ring) return;

    var mx = 0, my = 0, rx = 0, ry = 0;
    var firstMove = false;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform  = "translate3d(" + mx + "px," + my + "px,0) translate(-50%,-50%)";
      if (!firstMove) {
        firstMove = true;
        rx = mx; ry = my;
        ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
        cursor.classList.add("is-ready");
      }
    });

    // Smooth ring follow
    (function loop() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();

    // Hover state on interactive elements
    var HOVERABLES = "a, button, .service-card, .sector-badge, .gallery-item, .feature-item";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(HOVERABLES)) document.body.classList.add("cursor-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(HOVERABLES)) document.body.classList.remove("cursor-hover");
    });
  }

  /* ──────────────────────────────────────────
     NAV — transparent → solid + mobile menu
  ────────────────────────────────────────── */
  function initNav() {
    var header  = $("#header");
    var burger  = $("#navBurger");
    var menu    = $("#navMenu");
    if (!header) return;

    // Solid on scroll
    function onScroll() {
      if (window.scrollY > 40) {
        header.classList.add("is-solid");
      } else {
        header.classList.remove("is-solid");
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Mobile burger
    if (burger && menu) {
      burger.addEventListener("click", function () {
        var isOpen = menu.classList.toggle("is-open");
        burger.classList.toggle("is-open", isOpen);
        burger.setAttribute("aria-expanded", String(isOpen));
      });
      // Close on link click
      $$("a", menu).forEach(function (a) {
        a.addEventListener("click", function () {
          menu.classList.remove("is-open");
          burger.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  /* ──────────────────────────────────────────
     SMOOTH ANCHOR SCROLL
  ────────────────────────────────────────── */
  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"), 10) || 80;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navH,
        behavior: "smooth"
      });
    });
  }

  /* ──────────────────────────────────────────
     SCROLL REVEALS (IntersectionObserver)
  ────────────────────────────────────────── */
  function initReveals() {
    var items = $$(".reveal");
    if (!items.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -4% 0px" });

    items.forEach(function (el) { io.observe(el); });

    // Safety: force-reveal visible items after 1.5s
    setTimeout(function () {
      items.forEach(function (el) {
        if (!el.classList.contains("is-visible")) {
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight + 200) {
            el.classList.add("is-visible");
          }
        }
      });
    }, 1500);
  }

  /* ──────────────────────────────────────────
     HERO SCROLL HINT — fade out on scroll
  ────────────────────────────────────────── */
  function initHeroScrollHint() {
    var hint = $(".hero-scroll-hint");
    if (!hint) return;
    window.addEventListener("scroll", function () {
      var progress = Math.min(1, window.scrollY / 200);
      hint.style.opacity = String(0.5 * (1 - progress));
    }, { passive: true });
  }

  /* ──────────────────────────────────────────
     HERO PARALLAX (GSAP + ScrollTrigger)
  ────────────────────────────────────────── */
  function initHeroParallax() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    var overlay = $(".hero-overlay");
    var content = $(".hero-content");
    if (!overlay || !content) return;

    gsap.to(overlay, {
      opacity: 0.95,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.to(content, {
      y: 80,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "60% top",
        scrub: true
      }
    });
  }

  /* ──────────────────────────────────────────
     GALLERY LIGHTBOX
  ────────────────────────────────────────── */
  function initGallery() {
    var items = $$(".gallery-item");
    if (!items.length) return;

    // Build lightbox
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Imagen ampliada");
    lb.innerHTML = '<button class="lightbox-close" aria-label="Cerrar">&times;</button><img class="lightbox-img" src="" alt="" />';
    document.body.appendChild(lb);

    var lbImg   = lb.querySelector(".lightbox-img");
    var lbClose = lb.querySelector(".lightbox-close");

    function open(img) {
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lb.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(function () { lbImg.src = ""; }, 400);
    }

    items.forEach(function (item) {
      item.addEventListener("click", function () {
        var img = item.querySelector("img");
        if (img) open(img);
      });
    });
    lbClose.addEventListener("click", close);
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("is-open")) close();
    });
  }

  /* ──────────────────────────────────────────
     CONTACT FORM — send via WhatsApp
  ────────────────────────────────────────── */
  function initForm() {
    var form = $("#contactForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      form.classList.add("is-sending");
      var btn = $("#submitBtn", form);
      if (btn) btn.disabled = true;

      // Build WhatsApp message from form data
      var nombre   = ($("#nombre",   form) || {}).value || "";
      var empresa  = ($("#empresa",  form) || {}).value || "";
      var emailVal = ($("#email",    form) || {}).value || "";
      var tel      = ($("#telefono", form) || {}).value || "";
      var servicio = ($("#servicio", form) || {}).selectedOptions[0]
                     ? ($("#servicio", form) || {}).selectedOptions[0].text : "";
      var mensaje  = ($("#mensaje",  form) || {}).value || "";

      var lines = [
        "Hola RENOVA, me interesa solicitar un presupuesto.",
        "Nombre: " + nombre,
        empresa ? "Empresa: " + empresa : "",
        "Email: " + emailVal,
        tel      ? "Teléfono: " + tel : "",
        "Servicio: " + servicio,
        mensaje  ? "Mensaje: " + mensaje : ""
      ].filter(Boolean).join("\n");

      var waURL = "https://wa.me/59892588755?text=" + encodeURIComponent(lines);

      setTimeout(function () {
        form.classList.remove("is-sending");
        form.classList.add("is-sent");
        window.open(waURL, "_blank", "noopener,noreferrer");
        // Reset after delay
        setTimeout(function () {
          form.classList.remove("is-sent");
          form.reset();
          if (btn) btn.disabled = false;
        }, 4000);
      }, 900);
    });
  }

  /* ──────────────────────────────────────────
     GSAP STAGGER REVEALS (enhanced)
  ────────────────────────────────────────── */
  function initGsapAnimations() {
    if (!window.gsap || !window.ScrollTrigger) return;

    // Service cards stagger
    var cards = $$(".service-card");
    if (cards.length) {
      gsap.fromTo(cards,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.07, duration: 0.7, ease: "expo.out",
          scrollTrigger: {
            trigger: ".services-grid",
            start: "top 80%"
          }
        }
      );
      // Remove CSS reveal class from cards since GSAP handles them
      cards.forEach(function (c) { c.classList.remove("reveal"); c.classList.add("is-visible"); });
    }
  }

  /* ──────────────────────────────────────────
     COUNTER ANIMATION
  ────────────────────────────────────────── */
  function initCounters() {
    var counters = $$("[data-count-to]");
    if (!counters.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el  = e.target;
        var end = parseFloat(el.dataset.countTo);
        var dec = (String(end).split(".")[1] || "").length;
        var dur = 1200;
        var start = performance.now();
        (function tick(now) {
          var progress = Math.min((now - start) / dur, 1);
          var ease = 1 - Math.pow(1 - progress, 3);
          el.textContent = (end * ease).toFixed(dec);
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = end.toFixed(dec);
        })(start);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ──────────────────────────────────────────
     TESTIMONIOS — Carrusel premium
     - Flechas, dots, swipe táctil, autoplay con pausa
  ────────────────────────────────────────── */
  function initTestimonials() {
    var stage = document.querySelector("[data-testimonials]");
    if (!stage) return;

    var track  = stage.querySelector("[data-track]");
    var slides = $$("[data-slide]", track);
    var prev   = stage.querySelector("[data-prev]");
    var next   = stage.querySelector("[data-next]");
    var dots   = $$("[data-dot]", stage);
    var current = stage.querySelector("[data-current]");
    var total   = stage.querySelector("[data-total]");
    if (!track || !slides.length) return;

    var index = 0;
    var count = slides.length;
    var AUTOPLAY_MS = 7500;
    var autoplayTimer = null;
    var isPointerDown = false;
    var startX = 0;
    var deltaX = 0;
    var dragging = false;
    var trackBaseX = 0;

    if (total) total.textContent = String(count).padStart(2, "0");

    function pad(n) { return String(n + 1).padStart(2, "0"); }

    function update(animated) {
      track.style.transition = animated === false ? "none" : "";
      track.style.transform  = "translate3d(" + (-index * 100) + "%,0,0)";

      slides.forEach(function (s, i) {
        s.classList.toggle("is-active", i === index);
        s.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === index);
        d.setAttribute("aria-selected", i === index ? "true" : "false");
      });
      if (current) current.textContent = pad(index);
    }

    function go(i) {
      index = ((i % count) + count) % count;
      update(true);
      restartAutoplay();
    }
    function nextSlide() { go(index + 1); }
    function prevSlide() { go(index - 1); }

    /* Controls */
    if (prev) prev.addEventListener("click", prevSlide);
    if (next) next.addEventListener("click", nextSlide);
    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { go(i); });
    });

    /* Keyboard (only when stage is in view) */
    document.addEventListener("keydown", function (e) {
      var rect = stage.getBoundingClientRect();
      var inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft")  prevSlide();
    });

    /* Touch / pointer swipe */
    function pointerDown(e) {
      isPointerDown = true;
      dragging = false;
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      deltaX = 0;
      trackBaseX = -index * track.offsetWidth;
      track.style.transition = "none";
      stopAutoplay();
    }
    function pointerMove(e) {
      if (!isPointerDown) return;
      var x = (e.touches ? e.touches[0].clientX : e.clientX);
      deltaX = x - startX;
      if (Math.abs(deltaX) > 8) dragging = true;
      var pct = ((trackBaseX + deltaX) / track.offsetWidth) * 100;
      track.style.transform = "translate3d(" + pct + "%,0,0)";
    }
    function pointerUp() {
      if (!isPointerDown) return;
      isPointerDown = false;
      track.style.transition = "";
      var threshold = track.offsetWidth * 0.18;
      if (deltaX < -threshold) nextSlide();
      else if (deltaX > threshold) prevSlide();
      else update(true);
      deltaX = 0;
    }

    track.addEventListener("touchstart", pointerDown, { passive: true });
    track.addEventListener("touchmove",  pointerMove, { passive: true });
    track.addEventListener("touchend",   pointerUp);
    track.addEventListener("touchcancel",pointerUp);

    track.addEventListener("mousedown", function (e) {
      pointerDown(e); e.preventDefault();
    });
    window.addEventListener("mousemove", pointerMove);
    window.addEventListener("mouseup",   pointerUp);

    // Prevent accidental link clicks after a drag
    track.addEventListener("dragstart", function (e) { e.preventDefault(); });
    track.addEventListener("click", function (e) {
      if (dragging) { e.preventDefault(); e.stopPropagation(); dragging = false; }
    }, true);

    /* Autoplay */
    function startAutoplay() {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = setInterval(nextSlide, AUTOPLAY_MS);
    }
    function stopAutoplay() {
      if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
    }
    function restartAutoplay() { stopAutoplay(); startAutoplay(); }

    stage.addEventListener("mouseenter", stopAutoplay);
    stage.addEventListener("mouseleave", startAutoplay);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAutoplay(); else startAutoplay();
    });

    /* Init */
    update(false);
    startAutoplay();
  }

  /* ──────────────────────────────────────────
     SERVICE LIGHTBOX — Mini-video por servicio
  ────────────────────────────────────────── */
  function initServiceLightbox() {
    var modal = document.querySelector("[data-service-modal]");
    if (!modal) return;
    var video   = modal.querySelector("[data-modal-video]");
    var title   = modal.querySelector("[data-modal-title]");
    var loader  = modal.querySelector("[data-modal-loader]");
    var closers = $$("[data-modal-close]", modal);
    var cards   = $$(".service-card[data-video]");
    if (!video || !cards.length) return;

    var prevFocus = null;

    function open(src, label) {
      prevFocus = document.activeElement;
      title.textContent = label || "";
      video.src = src;
      loader.classList.remove("is-hidden");
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      video.addEventListener("loadeddata", onLoaded, { once: true });
      video.addEventListener("error", onError, { once: true });
      try { video.load(); video.play().catch(function(){}); } catch(_) {}
    }
    function onLoaded() { loader.classList.add("is-hidden"); }
    function onError() {
      loader.innerHTML = '<div style="font-family:var(--display);font-size:.85rem;letter-spacing:.12em;text-transform:uppercase;color:var(--cream-2);text-align:center;padding:0 1rem">Clip no disponible<br><span style="font-size:.65rem;opacity:.7">Subir a /assets/video/services/</span></div>';
    }
    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      try { video.pause(); } catch(_) {}
      setTimeout(function () {
        video.removeAttribute("src");
        video.load();
        loader.classList.remove("is-hidden");
        loader.innerHTML = '<div class="service-modal-spinner"></div>';
      }, 400);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    }

    cards.forEach(function (card) {
      function trigger() {
        var src = card.getAttribute("data-video");
        var label = card.getAttribute("data-service") || "";
        open(src, label);
      }
      card.addEventListener("click", trigger);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          trigger();
        }
      });
    });

    closers.forEach(function (c) { c.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  }

  /* ──────────────────────────────────────────
     JOIN US — Modal de postulación + WhatsApp/Email
  ────────────────────────────────────────── */
  function initJoinModal() {
    var modal = document.querySelector("[data-join-modal]");
    var opener = document.querySelector("[data-join-open]");
    if (!modal || !opener) return;
    var closers = $$("[data-join-close]", modal);
    var form    = $("#joinForm", modal);
    var submits = $$("[data-join-submit]", modal);
    var prevFocus = null;

    function open() {
      prevFocus = document.activeElement;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      var first = $("#join-nombre", modal);
      if (first) setTimeout(function () { first.focus(); }, 350);
    }
    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    }

    opener.addEventListener("click", open);
    closers.forEach(function (c) { c.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });

    function buildMessage(data) {
      var lines = [
        "Hola RENOVA, quiero postularme para trabajar con ustedes.",
        "",
        "Nombre: " + data.nombre,
        data.edad ? "Edad: " + data.edad : "",
        "Teléfono: " + data.telefono,
        "Email: " + data.email,
        "Experiencia en altura: " + data.experiencia,
        data.mensaje ? "" : null,
        data.mensaje ? "Mensaje: " + data.mensaje : null
      ];
      return lines.filter(function (l) { return l !== null && l !== undefined; }).join("\n");
    }

    function collect() {
      if (!form.reportValidity()) return null;
      return {
        nombre:     ($("#join-nombre", form) || {}).value || "",
        edad:       ($("#join-edad", form) || {}).value || "",
        telefono:   ($("#join-telefono", form) || {}).value || "",
        email:      ($("#join-email", form) || {}).value || "",
        experiencia:($("#join-experiencia", form) || {}).value || "",
        mensaje:    ($("#join-mensaje", form) || {}).value || ""
      };
    }

    submits.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var data = collect();
        if (!data) return;
        var channel = btn.getAttribute("data-join-submit");
        var body = buildMessage(data);
        if (channel === "whatsapp") {
          var url = "https://wa.me/59892588755?text=" + encodeURIComponent(body);
          window.open(url, "_blank", "noopener,noreferrer");
        } else if (channel === "email") {
          var subj = "Postulación RENOVA — " + data.nombre;
          var mailto = "mailto:" + ["renova.alturauy","gmail.com"].join("@")
            + "?subject=" + encodeURIComponent(subj)
            + "&body=" + encodeURIComponent(body);
          window.location.href = mailto;
        }
        setTimeout(close, 400);
      });
    });
  }

  /* ──────────────────────────────────────────
     MAGNETIC CURSOR — Atrae botones al puntero (desktop only)
  ────────────────────────────────────────── */
  function initMagneticButtons() {
    if (!fineHover) return;
    var targets = $$(".btn-primary, .btn-cta, .btn-pulse");
    if (!targets.length) return;

    var STRENGTH = 0.28;   // 0..1 — qué tanto sigue al cursor
    var MAX_PULL = 14;     // px máximo de desplazamiento
    var ACTIVATION = 90;   // px de distancia desde el centro a partir del cual actúa

    targets.forEach(function (btn) {
      btn.style.transition = "transform .25s cubic-bezier(0.18, 0.9, 0.3, 1)";
      var rafId = 0;
      var currentX = 0, currentY = 0;
      var targetX  = 0, targetY  = 0;

      function loop() {
        currentX += (targetX - currentX) * 0.2;
        currentY += (targetY - currentY) * 0.2;
        // Conserva la animación inline; combinamos con translate vía CSS variable
        btn.style.setProperty("--mx", currentX.toFixed(2) + "px");
        btn.style.setProperty("--my", currentY.toFixed(2) + "px");
        btn.style.transform = "translate3d(" + currentX.toFixed(2) + "px," + currentY.toFixed(2) + "px,0)";
        if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
          rafId = requestAnimationFrame(loop);
        } else {
          rafId = 0;
        }
      }

      function onMove(e) {
        var r = btn.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top  + r.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.hypot(dx, dy);
        if (dist > ACTIVATION + Math.max(r.width, r.height) / 2) {
          targetX = 0; targetY = 0;
        } else {
          targetX = Math.max(-MAX_PULL, Math.min(MAX_PULL, dx * STRENGTH));
          targetY = Math.max(-MAX_PULL, Math.min(MAX_PULL, dy * STRENGTH));
        }
        if (!rafId) rafId = requestAnimationFrame(loop);
      }
      function onLeave() {
        targetX = 0; targetY = 0;
        if (!rafId) rafId = requestAnimationFrame(loop);
      }

      window.addEventListener("mousemove", onMove, { passive: true });
      btn.addEventListener("mouseleave", onLeave);
    });
  }

  /* ──────────────────────────────────────────
     BOOT
  ────────────────────────────────────────── */
  /* ─────────────────────────────────────────────────────────────
     GALLERY CAROUSEL
  ────────────────────────────────────────── */
  function initGalleryCarousel() {
    var wrap  = document.querySelector("[data-gallery-carousel]");
    if (!wrap) return;
    var track = wrap.querySelector("[data-gal-track]");
    var slides = wrap.querySelectorAll("[data-gal-slide]");
    var prevBtn = wrap.querySelector("[data-gal-prev]");
    var nextBtn = wrap.querySelector("[data-gal-next]");
    var dotsWrap = wrap.querySelector("[data-gal-dots]");
    var n = slides.length, cur = 0, timer;

    // Build dots
    slides.forEach(function(_, i) {
      var d = document.createElement("button");
      d.className = "gal-dot" + (i === 0 ? " is-active" : "");
      d.setAttribute("aria-label", "Imagen " + (i + 1));
      d.addEventListener("click", function() { goTo(i); });
      dotsWrap.appendChild(d);
    });

    function goTo(idx) {
      cur = (idx + n) % n;
      track.style.transform = "translateX(-" + (cur * 100) + "%)";
      wrap.querySelectorAll(".gal-dot").forEach(function(d, i) {
        d.classList.toggle("is-active", i === cur);
      });
    }
    function next() { goTo(cur + 1); }
    function prev() { goTo(cur - 1); }
    function startAuto() { timer = setInterval(next, 4000); }
    function stopAuto()  { clearInterval(timer); }

    nextBtn.addEventListener("click", function() { stopAuto(); next(); startAuto(); });
    prevBtn.addEventListener("click", function() { stopAuto(); prev(); startAuto(); });
    wrap.addEventListener("mouseenter", stopAuto);
    wrap.addEventListener("mouseleave", startAuto);

    // Touch swipe
    var tx = 0;
    track.addEventListener("touchstart", function(e) { tx = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", function(e) {
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) { stopAuto(); dx < 0 ? next() : prev(); startAuto(); }
    }, { passive: true });

    startAuto();
  }

  /* ─────────────────────────────────────────────────────────────
     SECTORS SCROLL
  ────────────────────────────────────────── */
  function initSectorsScroll() {
    var wrap   = document.querySelector("[data-sectors-scroll]");
    var prev   = document.querySelector("[data-sectors-prev]");
    var next   = document.querySelector("[data-sectors-next]");
    if (!wrap) return;
    var step = wrap.querySelector(".sector-badge");
    var stepW = step ? step.offsetWidth + 16 : 200;
    if (prev) prev.addEventListener("click", function() { wrap.scrollBy({ left: -stepW * 2, behavior: "smooth" }); });
    if (next) next.addEventListener("click", function() { wrap.scrollBy({ left:  stepW * 2, behavior: "smooth" }); });
  }

  /* ─────────────────────────────────────────────────────────────
     EMAIL OBFUSCATION (anti-scraping)
  ────────────────────────────────────────── */
  function initEmailReveal() {
    document.querySelectorAll(".js-email").forEach(function(el) {
      var u = el.getAttribute("data-u"), d = el.getAttribute("data-d");
      if (!u || !d) return;
      var addr = u + "@" + d;
      // Si el elemento ya tiene texto custom (ej. "Email"), envolverlo en mailto
      var custom = el.textContent && el.textContent !== "Cargando…" && el.textContent !== "Cargando..." && el.textContent.trim();
      var inner = (custom && custom !== "Email") ? custom : addr;
      el.innerHTML = '<a href="mailto:' + addr + '">' + inner + '</a>';
    });
    document.querySelectorAll(".js-email-link").forEach(function(el) {
      var u = el.getAttribute("data-u"), d = el.getAttribute("data-d");
      if (!u || !d) return;
      el.setAttribute("href", "mailto:" + u + "@" + d);
    });
  }

  function boot() {
    safe(initEmailReveal,    "email");
    safe(initIntro,          "intro");
    safe(initCursor,         "cursor");
    safe(initNav,            "nav");
    safe(initSmoothScroll,   "smoothScroll");
    safe(initReveals,        "reveals");
    safe(initHeroScrollHint, "heroHint");
    safe(initGallery,        "gallery");
    safe(initForm,           "form");
    safe(initCounters,       "counters");
    safe(initTestimonials,   "testimonials");
    safe(initServiceLightbox,"serviceLightbox");
    safe(initJoinModal,      "joinModal");
    safe(initMagneticButtons,"magneticButtons");
    safe(initGalleryCarousel,"galleryCarousel");
    safe(initSectorsScroll,  "sectorsScroll");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initHeroParallax,   "heroParallax");
      safe(initGsapAnimations, "gsapAnimations");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
